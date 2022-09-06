import { Connection, Keypair, PublicKey, sendAndConfirmRawTransaction, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { SolanaConfigService } from "../src/config"
import { DurableNonceService } from "../src"

describe("Test durable nonce service", () => {
  let connection: Connection
  let defaultAccount: Keypair
  let nonceAddress: PublicKey;

  before(async function () {
    connection = new Connection("http://localhost:8899", "confirmed")
    defaultAccount = await SolanaConfigService.getDefaultAccount()
  })

  it("Create nonce account", async () => {
    const nonceAccount = Keypair.generate()

    const tx = await DurableNonceService.createNonceAccount(
      connection,
      nonceAccount,
      defaultAccount,
      defaultAccount.publicKey,
    )
    console.log(tx)

    nonceAddress = nonceAccount.publicKey
  })

  it("Get nonce account", async () => {
    const nonceAccountData = await DurableNonceService.getNonceAccount(
      connection,
      nonceAddress,
    )

    console.log(nonceAccountData)
  })

  it("Use nonce account", async () => {
    const secondWallet = Keypair.generate()
    const nonceTransaction: Transaction = await DurableNonceService.createNonceTransaction(
      connection,
      nonceAddress,
      defaultAccount.publicKey
    )

    nonceTransaction.add(
      SystemProgram.transfer({
        fromPubkey: defaultAccount.publicKey,
        toPubkey: secondWallet.publicKey,
        lamports: 2e8
      }),
      SystemProgram.transfer({
        fromPubkey: secondWallet.publicKey,
        toPubkey: defaultAccount.publicKey,
        lamports: 1e8
      })
    )

    nonceTransaction.feePayer = defaultAccount.publicKey
    nonceTransaction.sign(defaultAccount, secondWallet)

    const rawTx = nonceTransaction.serialize()
    const receipt: string = await connection.sendRawTransaction(rawTx)
    console.log(receipt)
  })

})

import { Connection, Keypair, NonceAccount, NONCE_ACCOUNT_LENGTH, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";

export class DurableNonceService {
  static async createNonceAccount(
    connection: Connection,
    nonceAccount: Keypair,
    payerAccount: Keypair,
    authorityAddress: PublicKey,
  ): Promise<string | any> {
    const transaction: Transaction = new Transaction()

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payerAccount.publicKey,
        newAccountPubkey: nonceAccount.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH),
        space: NONCE_ACCOUNT_LENGTH,
        programId: SystemProgram.programId
      }),
      SystemProgram.nonceInitialize({
        noncePubkey: nonceAccount.publicKey,
        authorizedPubkey: authorityAddress
      })
    )
    const tx: string | any = sendAndConfirmTransaction(connection, transaction, [payerAccount, nonceAccount])
    return tx
  }

  static async getNonceAccount(
    connection: Connection,
    nonceAddress: PublicKey,
  ): Promise<NonceAccount> {
    let accountInfo = await connection.getAccountInfo(nonceAddress)

    return NonceAccount.fromAccountData(accountInfo.data)
  }

  static async createNonceTransaction(
    connection: Connection,
    nonceAddress: PublicKey,
    authorityAddress: PublicKey
  ): Promise<Transaction> {
    const nonceAccount: NonceAccount = await DurableNonceService.getNonceAccount(connection, nonceAddress)

    const transaction: Transaction = new Transaction()
    transaction.recentBlockhash = nonceAccount.nonce
    transaction.add(
      SystemProgram.nonceAdvance({
        noncePubkey: nonceAddress,
        authorizedPubkey: authorityAddress
      })
    )

    return transaction
  }
}

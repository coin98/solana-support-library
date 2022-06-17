import {
  Connection,
  sendAndConfirmTransaction,
  Signer,
  Transaction
} from '@solana/web3.js'

export async function getTransactionReturn(
  connection: Connection,
  txHash: string,
): Promise<string> {
  const txInfo = await connection.getTransaction(txHash)
  const logMessages = txInfo.meta.logMessages
  for(const message of logMessages) {
    if(message.startsWith('Program return: ')) {
      const base64Value = message.slice(61)
      return Buffer.from(base64Value, 'base64').toString('hex')
    }
  }
  return null
}

export async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Signer[],
): Promise<string> {
  return sendAndConfirmTransaction(
    connection,
    transaction,
    signers,
    {
      skipPreflight: true,
    },
  )
}

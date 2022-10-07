import {
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  Signer,
  Transaction
} from '@solana/web3.js'
import { SignatureTuple } from './interfaces'

export const DEFAULT_PUBKEY = new PublicKey('11111111111111111111111111111111');

export async function getProgramReturn(
  connection: Connection,
  txHash: string,
): Promise<string> {
  const txInfo = await connection.getTransaction(txHash);
  const logMessages = txInfo.meta.logMessages;
  for(const message of logMessages) {
    if(message.startsWith('Program return: ')) {
      const base64Value = message.slice(61);
      return Buffer.from(base64Value, 'base64').toString('hex');
    }
  }
  return null;
}

export async function sendRawTransaction(
  connection: Connection,
  rawTransaction: Buffer,
  signatures: SignatureTuple[],
): Promise<string> {

  const transaction = Transaction.from(rawTransaction);
  for(let signature of signatures) {
    transaction.addSignature(signature.publicKey, signature.signature);
  }

  try {
    return await sendAndConfirmRawTransaction(
      connection,
      transaction.serialize(),
      {
        skipPreflight: true,
      },
    );
  }
  catch(err) {
    if(err) {
      console.debug(JSON.stringify(err));
    }
    console.error(err);
    throw err;
  }
}

export async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Signer[],
): Promise<string> {

  try {
    const txSign = await sendAndConfirmTransaction(
      connection,
      transaction,
      signers,
      {
        skipPreflight: true,
      },
    );
    return txSign;
  }
  catch(err) {
    if(err) {
      console.debug(JSON.stringify(err));
    }
    console.error(err);
    throw err;
  }
}

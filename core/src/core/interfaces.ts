import { PublicKey } from '@solana/web3.js';

export interface SignatureTuple {
  publicKey: PublicKey
  signature: Buffer
}


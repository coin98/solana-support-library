import * as borsh from '@project-serum/borsh';
import {
  AccountMeta,
  Ed25519Program,
  Keypair,
  PublicKey,
  TransactionInstruction
} from '@solana/web3.js';
import { BorshService } from './core/borsh.service';
import { Ed25519SignService } from './core/ed25519_sign.service';
import { SignatureTuple } from './core/interfaces';

const U16_MAX = 65535;

interface VerifySignaturesRequestHeader {
  numSignatures: number
  padding: number
}

const VERIFY_SIGNATURES_REQUEST_HEADER_LAYOUT: borsh.Layout<VerifySignaturesRequestHeader> = borsh.struct([
  borsh.u8('numSignatures'),
  borsh.u8('padding'),
]);

const VERIFY_SIGNATURES_REQUEST_HEADER_SPAN = VERIFY_SIGNATURES_REQUEST_HEADER_LAYOUT.span;

interface SignatureOffset {
  signatureOffset: number
  signatureInstructionIndex: number
  publicKeyOffset: number
  publicKeyInstructionIndex: number
  messageDataOffset: number
  messageDataSize: number
  messageInstructionIndex: number
}

const SIGNATURE_OFFSET_LAYOUT: borsh.Layout<SignatureOffset> = borsh.struct([
  borsh.u16('signatureOffset'),
  borsh.u16('signatureInstructionIndex'),
  borsh.u16('publicKeyOffset'),
  borsh.u16('publicKeyInstructionIndex'),
  borsh.u16('messageDataOffset'),
  borsh.u16('messageDataSize'),
  borsh.u16('messageInstructionIndex'),
]);

const SIGNATURE_OFFSET_SPAN = SIGNATURE_OFFSET_LAYOUT.span;

interface SignatureData {
  publicKey: PublicKey
  signature: Uint8Array
}

const SIGNATURE_DATA_LAYOUT: borsh.Layout<SignatureData> = borsh.struct([
  borsh.publicKey('publicKey'),
  borsh.array(borsh.u8(), 64, 'signature'),
]);

const SIGNATURE_DATA_SPAN = SIGNATURE_DATA_LAYOUT.span;

export interface SignMessageParams {
  message: Buffer
  signer: Keypair
}

export interface VerifyMessageParams {
  message: Buffer
  publicKey: PublicKey
  signature: Buffer
}

export class Ed25519InstructionService {

  static createMessageVerification(
    message: Buffer,
    ...signatures: SignatureTuple[]
  ): TransactionInstruction {

    const dataSpan = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
      + (SIGNATURE_OFFSET_SPAN + SIGNATURE_DATA_SPAN) * signatures.length
      + message.length;
    const data = Buffer.alloc(dataSpan);

    // Fill header
    const header = <VerifySignaturesRequestHeader>{
      numSignatures: signatures.length,
      padding: 0,
    };
    const headerBytes = BorshService.serialize(VERIFY_SIGNATURES_REQUEST_HEADER_LAYOUT, header, VERIFY_SIGNATURES_REQUEST_HEADER_SPAN);
    data.fill(headerBytes, 0, VERIFY_SIGNATURES_REQUEST_HEADER_SPAN);

    const messageOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
      + (SIGNATURE_OFFSET_SPAN + SIGNATURE_DATA_SPAN) * signatures.length;

    // Fill offsets
    for(let i = 0; i < signatures.length; i++) {
      const signOffsetOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
        + SIGNATURE_OFFSET_SPAN * i;
      const signDataOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
        + SIGNATURE_OFFSET_SPAN * signatures.length
        + SIGNATURE_DATA_SPAN * i;
      const signOffset = <SignatureOffset>{
        signatureOffset: signDataOffset + 32,
        signatureInstructionIndex: U16_MAX,
        publicKeyOffset: signDataOffset + 0,
        publicKeyInstructionIndex: U16_MAX,
        messageDataOffset: messageOffset,
        messageDataSize: message.length,
        messageInstructionIndex: U16_MAX,
      };
      const signOffsetBuffer = BorshService.serialize(SIGNATURE_OFFSET_LAYOUT, signOffset, SIGNATURE_OFFSET_SPAN);
      data.fill(signOffsetBuffer, signOffsetOffset, signOffsetOffset + SIGNATURE_OFFSET_SPAN);
    }

    // Fill signatures
    for(let i = 0; i < signatures.length; i++) {
      const signatureTuple = signatures[i];
      const signData = <SignatureData>{
        publicKey: signatureTuple.publicKey,
        signature: signatureTuple.signature,
      };
      const signDataOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
        + SIGNATURE_OFFSET_SPAN * signatures.length
        + SIGNATURE_DATA_SPAN * i;
      const signDataBuffer = BorshService.serialize(SIGNATURE_DATA_LAYOUT, signData, SIGNATURE_DATA_SPAN);
      data.fill(signDataBuffer, signDataOffset, signDataOffset + SIGNATURE_DATA_SPAN);
    }

    // Fill messages
    data.fill(message, messageOffset, messageOffset + message.length);

    const keys: AccountMeta[] = []

    return new TransactionInstruction({
      keys,
      data,
      programId: Ed25519Program.programId,
    });
  }

  static createMessagesVerification(
    ...params: VerifyMessageParams[]
  ): TransactionInstruction {

    const totalMessageLength = params.reduce((sum, x) => sum + x.message.length, 0);

    const dataSpan = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
      + (SIGNATURE_OFFSET_SPAN + SIGNATURE_DATA_SPAN) * params.length
      + totalMessageLength;
    const data = Buffer.alloc(dataSpan);

    // Fill header
    const header = <VerifySignaturesRequestHeader>{
      numSignatures: params.length,
      padding: 0,
    };
    const headerBytes = BorshService.serialize(VERIFY_SIGNATURES_REQUEST_HEADER_LAYOUT, header, VERIFY_SIGNATURES_REQUEST_HEADER_SPAN);
    data.fill(headerBytes, 0, VERIFY_SIGNATURES_REQUEST_HEADER_SPAN);

    const messageOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
      + (SIGNATURE_OFFSET_SPAN + SIGNATURE_DATA_SPAN) * params.length;
    const messageOffsets: number[] = [];
    for(let i = 0; i < params.length; i++) {
      if(i == 0) {
        messageOffsets.push(messageOffset);
      }
      else {
        const previousParam = params[i-1];
        messageOffsets.push(messageOffsets[i-1] + previousParam.message.length);
      }
    }
    // Fill offsets
    for(let i = 0; i < params.length; i++) {
      const param = params[i];
      const signOffsetOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
        + SIGNATURE_OFFSET_SPAN * i;
      const signDataOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
        + SIGNATURE_OFFSET_SPAN * params.length
        + SIGNATURE_DATA_SPAN * i;
      const signOffset = <SignatureOffset>{
        signatureOffset: signDataOffset + 32,
        signatureInstructionIndex: U16_MAX,
        publicKeyOffset: signDataOffset + 0,
        publicKeyInstructionIndex: U16_MAX,
        messageDataOffset: messageOffsets[i],
        messageDataSize: param.message.length,
        messageInstructionIndex: U16_MAX,
      };
      const signOffsetBuffer = BorshService.serialize(SIGNATURE_OFFSET_LAYOUT, signOffset, SIGNATURE_OFFSET_SPAN);
      data.fill(signOffsetBuffer, signOffsetOffset, signOffsetOffset + SIGNATURE_OFFSET_SPAN);
    }

    // Fill signatures
    for(let i = 0; i < params.length; i++) {
      const signatureTuple = params[i];
      const signData = <SignatureData>{
        publicKey: signatureTuple.publicKey,
        signature: signatureTuple.signature,
      };
      const signDataOffset = VERIFY_SIGNATURES_REQUEST_HEADER_SPAN
        + SIGNATURE_OFFSET_SPAN * params.length
        + SIGNATURE_DATA_SPAN * i;
      const signDataBuffer = BorshService.serialize(SIGNATURE_DATA_LAYOUT, signData, SIGNATURE_DATA_SPAN);
      data.fill(signDataBuffer, signDataOffset, signDataOffset + SIGNATURE_DATA_SPAN);
    }

    // Fill messages
    for(let i = 0; i < params.length; i++) {
      const param = params[i];
      data.fill(param.message, messageOffsets[i], messageOffsets[i] + param.message.length);
    }

    const keys: AccountMeta[] = []

    return new TransactionInstruction({
      keys,
      data,
      programId: Ed25519Program.programId,
    });
  }

  static signAndCreateMessageVerification(
    message: Buffer,
    ...signers: Keypair[]
  ): TransactionInstruction {
    const signatures = signers.map(signer => {
      const signature = Ed25519SignService.signMessage(
        message,
        Buffer.from(signer.secretKey)
      );
      return <SignatureTuple>{
        publicKey: signer.publicKey,
        signature,
      };
    });

    return this.createMessageVerification(
      message,
      ...signatures,
    );
  }

  static signAndCreateMessagesVerification(
    ...params: SignMessageParams[]
  ): TransactionInstruction {
    const verifyParams = params.map(param => {
      const signature = Ed25519SignService.signMessage(
        param.message,
        Buffer.from(param.signer.secretKey)
      );
      return <VerifyMessageParams>{
        message: param.message,
        publicKey: param.signer.publicKey,
        signature,
      };
    });

    return this.createMessagesVerification(
      ...verifyParams,
    );
  }
}


import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

ed25519.utils.sha512Sync = (...m) => sha512(ed25519.utils.concatBytes(...m));

export class Ed25519SignService {

  static signMessage(
    message: Buffer,
    secretKey: Buffer,
  ): Buffer {
    const bytes = ed25519.sync.sign(message, secretKey.slice(0, 32));
    return Buffer.from(bytes);
  }
}


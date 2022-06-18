import { Keypair } from '@solana/web3.js';
import path from 'path';
import { FileSystemService } from '../core/file_system.service';
import { SolanaConfigService } from './solana_config.service';

export class TestAccountService {
  static async getAccount(
    num: number,
  ): Promise<Keypair> {
    switch(num) {
      case 0:
        return Keypair.fromSecretKey(Uint8Array.from([46,65,79,135,17,235,62,170,138,250,37,6,218,61,184,106,19,149,245,54,234,41,37,118,76,181,234,82,237,244,93,201,110,134,224,91,83,45,112,151,22,166,164,229,140,3,5,26,206,25,240,219,57,78,235,214,112,45,54,90,237,167,118,113]))
      case 1:
        return Keypair.fromSecretKey(Uint8Array.from([104,50,235,9,64,139,20,154,193,211,121,6,193,239,93,24,236,68,114,116,108,19,138,180,151,2,35,84,239,114,13,171,142,216,25,84,78,168,1,193,90,234,206,34,168,124,173,173,211,60,79,50,122,238,134,15,141,232,255,102,82,192,19,131]))
      case 2:
        return Keypair.fromSecretKey(Uint8Array.from([147,120,138,101,242,3,149,231,219,245,246,41,218,3,246,98,40,79,93,135,248,139,185,27,133,88,114,237,45,228,163,241,142,216,28,20,227,148,3,28,70,79,202,35,227,196,69,40,247,179,228,61,160,237,132,84,26,86,119,248,108,230,12,242]))
      case 3:
        return Keypair.fromSecretKey(Uint8Array.from([179,208,116,197,18,27,95,29,250,151,182,230,247,179,109,217,42,211,166,70,70,3,4,217,97,123,112,227,190,131,163,252,142,216,32,151,223,190,190,104,216,164,32,56,244,2,166,206,174,86,44,4,216,213,233,22,110,168,106,142,183,240,78,93]))
      case 4:
        return Keypair.fromSecretKey(Uint8Array.from([162,110,171,146,161,243,248,71,147,162,5,47,57,190,234,217,191,104,195,45,221,179,100,241,16,104,50,55,170,235,201,117,142,216,40,199,215,5,220,248,60,244,247,30,107,55,106,28,55,160,158,118,221,52,205,121,222,229,137,209,246,254,116,15]))
      case 5:
        return Keypair.fromSecretKey(Uint8Array.from([163,186,191,195,110,169,139,108,138,199,132,57,120,102,186,55,31,95,44,106,180,85,183,181,104,16,234,31,190,159,213,115,142,216,42,243,142,118,136,143,174,143,115,2,40,84,118,172,226,91,187,61,217,80,229,68,84,247,92,180,249,100,101,128]))
      case 6:
        return Keypair.fromSecretKey(Uint8Array.from([251,39,36,189,2,12,136,216,205,238,88,241,34,65,30,80,215,142,176,51,147,144,168,157,237,185,40,141,139,187,212,105,142,216,48,137,43,153,205,165,123,158,208,229,86,46,176,88,238,215,50,61,164,84,197,62,129,107,117,65,227,217,213,155]))
      case 7:
        return Keypair.fromSecretKey(Uint8Array.from([181,188,187,90,251,50,229,62,71,244,171,111,94,0,30,115,174,18,3,88,2,46,210,4,110,208,149,165,118,8,94,56,142,216,52,246,243,93,157,224,97,62,60,106,111,22,44,78,226,233,112,126,151,118,60,180,231,151,217,151,143,227,46,189]))
      case 8:
        return Keypair.fromSecretKey(Uint8Array.from([232,129,14,34,171,192,105,33,79,63,128,234,149,196,110,224,49,88,125,107,8,95,138,74,254,128,148,210,15,118,79,143,142,216,60,155,134,146,87,193,133,252,169,181,158,37,38,153,45,142,211,55,185,135,143,157,119,5,62,175,72,56,21,75]))
      case 9:
        return Keypair.fromSecretKey(Uint8Array.from([16,242,232,80,238,116,98,209,132,221,118,209,242,254,75,159,54,88,169,75,60,54,85,173,219,75,126,12,161,27,52,103,142,216,62,179,114,126,99,95,205,147,252,53,91,33,169,27,143,20,136,170,156,212,235,197,134,205,217,85,4,125,240,48]))
    }
    return getExistAccountOrCreateNew(`test_account_${num}.json`)
  }

  static async getProgramAccount(
    num: number,
  ): Promise<Keypair> {
    return getExistAccountOrCreateNew(`program_account_${num}.json`)
  }

  static async getTokenAccount(
    num: number,
  ): Promise<Keypair> {
    switch(num) {
      case 1:
        return Keypair.fromSecretKey(Uint8Array.from([20,3,143,66,122,68,214,132,181,97,198,97,50,233,135,236,6,43,203,141,251,240,206,224,248,7,37,247,12,167,22,112,6,218,154,4,165,184,82,156,176,7,85,218,204,8,189,219,121,43,254,19,227,66,6,220,24,86,217,116,198,29,121,3]))
      case 2:
        return Keypair.fromSecretKey(Uint8Array.from([94,90,29,160,249,28,183,119,237,214,204,111,200,35,222,32,238,41,34,74,191,47,166,28,217,32,178,179,79,231,25,226,6,218,154,32,236,236,9,48,248,228,183,199,183,21,110,202,132,184,128,34,223,153,44,21,10,153,23,206,103,110,32,37]))
      case 3:
        return Keypair.fromSecretKey(Uint8Array.from([52,226,49,176,93,169,205,44,143,111,225,97,13,63,160,159,84,13,70,94,10,103,79,207,25,56,191,253,16,114,145,3,6,218,154,60,203,246,90,15,247,216,183,201,61,233,140,60,80,53,127,179,79,92,230,67,71,120,118,27,169,15,196,129]))
      case 4:
        return Keypair.fromSecretKey(Uint8Array.from([166,17,154,140,19,193,224,90,149,188,115,248,56,186,210,250,114,120,25,156,97,154,80,192,177,75,201,232,176,35,240,48,6,218,154,76,66,213,77,47,92,100,38,59,113,65,11,154,158,24,247,157,193,112,72,151,59,51,27,202,240,249,72,133]))
      case 5:
        return Keypair.fromSecretKey(Uint8Array.from([254,57,46,17,59,127,207,235,242,40,106,189,135,110,78,249,107,99,122,114,219,60,119,234,20,181,41,20,126,199,65,227,6,218,154,95,37,97,185,103,178,134,225,194,45,253,109,41,168,98,14,249,170,72,34,132,32,93,26,193,176,214,44,207]))
      case 6:
        return Keypair.fromSecretKey(Uint8Array.from([218,193,135,67,251,17,123,182,98,247,75,218,51,223,120,250,115,186,202,111,34,63,181,169,248,110,0,239,176,251,83,202,6,218,154,118,166,92,62,123,247,199,196,255,182,46,128,88,163,166,183,91,160,81,204,192,76,209,202,152,197,137,219,152]))
      case 7:
        return Keypair.fromSecretKey(Uint8Array.from([127,122,120,76,17,92,88,245,174,192,14,7,27,167,100,28,49,43,2,15,241,168,22,170,255,235,70,28,252,253,246,178,6,218,154,142,242,55,4,42,153,95,243,77,206,86,174,171,199,246,37,164,104,230,56,234,75,196,227,124,50,16,169,142]))
      case 8:
        return Keypair.fromSecretKey(Uint8Array.from([93,191,1,117,95,141,81,44,252,218,55,11,53,84,35,170,219,90,246,77,148,95,68,54,99,142,15,81,74,26,57,153,6,218,154,169,93,131,191,173,107,194,53,250,222,101,195,142,131,192,116,32,144,143,194,27,131,69,252,115,197,207,128,200]))
      case 9:
        return Keypair.fromSecretKey(Uint8Array.from([150,112,40,84,75,35,23,132,163,161,88,207,8,45,202,84,58,241,172,59,222,198,50,215,75,114,37,165,162,255,1,97,6,218,154,193,223,180,159,116,91,46,111,74,238,120,75,115,151,140,61,88,115,214,52,13,56,187,199,62,198,174,197,27]))
    }
    return getExistAccountOrCreateNew(`token_account_${num}.json`)
  }

  static getNamedTokenAccount(
    tokenName: TokenName,
  ): Keypair {
    switch(tokenName) {
      case TokenName.C98:
        return Keypair.fromSecretKey(Uint8Array.from([162,155,104,171,129,102,129,160,196,161,49,52,96,229,195,29,63,232,142,79,163,97,51,36,109,156,118,190,16,128,237,218,171,41,42,208,25,96,5,0,70,164,180,81,25,45,171,175,214,150,230,106,149,103,49,37,237,35,56,35,89,90,223,64]))
      case TokenName.CUSD:
        return Keypair.fromSecretKey(Uint8Array.from([202,192,162,73,184,144,236,61,88,204,128,42,118,116,110,72,153,114,57,183,67,59,239,160,46,130,112,92,219,145,116,21,171,46,92,155,111,121,107,137,187,201,219,116,208,23,156,137,19,146,184,45,122,164,241,252,184,1,174,7,13,160,189,174]))
      case TokenName.USDC:
        return Keypair.fromSecretKey(Uint8Array.from([60,231,165,208,225,90,117,100,22,235,253,243,161,9,223,54,139,142,78,108,18,22,88,83,16,154,198,212,38,116,83,178,7,7,47,239,146,149,227,157,134,184,142,41,0,116,30,156,5,137,155,122,200,7,156,95,250,65,130,110,210,224,109,43]))
      case TokenName.USDT:
        return Keypair.fromSecretKey(Uint8Array.from([236,151,173,254,101,155,109,246,177,10,166,118,56,248,241,61,84,92,28,161,223,117,27,144,129,53,9,117,125,57,62,44,7,7,49,61,169,163,25,74,204,125,53,179,167,62,142,96,45,254,128,12,28,221,99,113,229,80,145,215,86,94,211,20]))
    }
  }
}

export enum TokenName {
  C98,
  CUSD,
  USDC,
  USDT,
}

async function getExistAccountOrCreateNew(
  fileName: string
): Promise<Keypair> {
  const accountPath = path.join('shared_accounts', fileName)
  const isAccountExists = await FileSystemService.exists(accountPath)
  const account = isAccountExists
    ? await SolanaConfigService.readAccountFromFile(accountPath)
    : Keypair.generate()
  if (!isAccountExists) {
    SolanaConfigService.writeAccountToFile(accountPath, account)
  }
  return account
}

import { Connection, Keypair } from '@solana/web3.js';
import { BN } from 'bn.js';
import { TokenProgramService } from '../src';
import { SolanaConfigService, TestAccountService } from '../src/config';

describe('Test NFT service', () => {
  let connection: Connection;
  let defaultAccount: Keypair;
  let ownerAccount: Keypair;

  before(async function () {
    connection = new Connection('http://localhost:8899', 'confirmed');
    defaultAccount = await SolanaConfigService.getDefaultAccount();
    ownerAccount = await TestAccountService.getAccount(0);
  });

  it.only('create_nft_1' ,async function () {
    const tokenMintAccount = Keypair.generate();
    await TokenProgramService.createNonFungibleTokenMint(
      connection,
      defaultAccount,
      tokenMintAccount,
      ownerAccount.publicKey,
    );
  });

  it.only('create_nft_2' ,async function () {
    const tokenMintAccount = Keypair.generate();
    await TokenProgramService.createTokenMint(
      connection,
      defaultAccount,
      tokenMintAccount,
      0,
      ownerAccount.publicKey,
      null,
    );

    await TokenProgramService.mint(
      connection,
      defaultAccount,
      ownerAccount,
      tokenMintAccount.publicKey,
      defaultAccount.publicKey,
      new BN('1'),
    );

    await TokenProgramService.changeAuthority(
      connection,
      defaultAccount,
      ownerAccount,
      tokenMintAccount.publicKey,
      0,
      null,
    );
  });
})

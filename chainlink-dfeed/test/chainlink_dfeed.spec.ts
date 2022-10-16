import { SolanaConfigService } from '@coin98/solana-support-library/config';
import {
  Connection,
  Keypair,
  PublicKey
} from '@solana/web3.js';
import BN from 'bn.js';
import { ChainlinkDfeedService } from '../services/chainlink_dfeed.service';
import {
  ChainkDfeedInstructionService,
  ScopeDecimals,
  ScopeDescription,
  ScopeLatestRoundData,
  ScopeVersion
} from '../services/chainlink_dfeed_instruction.service';

describe('chainlink_dfeed_local_test', function() {

  const PROGRAM_ID = new PublicKey('HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny')

  const connection = new Connection('http://localhost:8899', 'confirmed')
  let defaultAccount: Keypair
  let randomFeedName: string
  let randomFeeAddress: PublicKey

  before(async function() {
    defaultAccount = await SolanaConfigService.getDefaultAccount()
    randomFeedName = (Math.random() * 999999).toString()
    randomFeeAddress = ChainlinkDfeedService.findFeedAddress(
      randomFeedName,
      PROGRAM_ID,
    )[0]
  })

  it('create feed', async function() {
    await ChainlinkDfeedService.createFeed(
      connection,
      defaultAccount,
      randomFeedName,
      25,
      75,
      "CCX/USD Price Feed",
      9,
      1,
      PROGRAM_ID,
    )
  })

  it('submit price', async function() {
    await ChainlinkDfeedService.submitFeed(
      connection,
      defaultAccount,
      randomFeeAddress,
      new BN(1000),
      PROGRAM_ID,
    )
  })

  it('query version', async function() {
    await ChainlinkDfeedService.query(
      connection,
      defaultAccount,
      randomFeeAddress,
      <ScopeVersion>{
        version: true,
      },
      PROGRAM_ID,
    )
  })

  it('query description', async function() {
    await ChainlinkDfeedService.query(
      connection,
      defaultAccount,
      randomFeeAddress,
      <ScopeDescription>{
        description: true,
      },
      PROGRAM_ID,
    )
  })

  it('query decimals', async function() {
    await ChainlinkDfeedService.query(
      connection,
      defaultAccount,
      randomFeeAddress,
      <ScopeDecimals>{
        decimals: true,
      },
      PROGRAM_ID,
    )
  })

  it('query price', async function() {
    const roundData = await ChainlinkDfeedService.query(
      connection,
      defaultAccount,
      randomFeeAddress,
      <ScopeLatestRoundData>{
        latestRoundData: true,
      },
      PROGRAM_ID,
    )
    const round = ChainkDfeedInstructionService.decodeRoundData(
      Buffer.from(roundData, 'hex'),
    )
    console.info(round)
  })

  it('print feed info', async function() {
    await ChainlinkDfeedService.printFeedInfo(
      connection,
      randomFeeAddress,
    )
  })
})

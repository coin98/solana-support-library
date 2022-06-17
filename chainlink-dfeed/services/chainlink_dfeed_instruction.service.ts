import {
  BorshService,
  HashService
} from '@coin98/solana-support-library'
import { BorshCoder, Idl } from '@project-serum/anchor'
import * as borsh from '@project-serum/borsh'
import {
  AccountMeta,
  PublicKey,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js'
import BN from 'bn.js'
import ChainlinkDfeedIdl from './chainlink_dfeed.json'

const coder = new BorshCoder(ChainlinkDfeedIdl as Idl)

// Requests
interface CreateFeedRequest {
  derivationPath: Buffer
  liveLength: number
  historyLength: number
  description: string
  decimals: number
  granularity: number
}

interface SubmitFeedRequest {
  timestamp: BN
  answer: BN
}

interface QueryRequest {
  scope: Scope
}

// Accounts
export interface Feed {
  version: number
  state: number
  owner: PublicKey
  proposedOwner: PublicKey
  writer: PublicKey
  description: Buffer
  decimals: number
  flaggingThreshold: number
  latestRoundId: number
  granularity: number
  liveLength: number
  liveCursor: number
  historicalCursor: number
  liveData: FeedDetail[]
  historicalData: FeedDetail[]
}

export interface FeedDetail {
  slot: BN
  timestamp: number
  price: BN
}

const FEED_DETAIL_LAYOUT: borsh.Layout<FeedDetail> = borsh.struct([
  borsh.u64('slot'),
  borsh.u32('timestamp'),
  borsh.u32('_padding0'),
  borsh.i128('price'),
  borsh.u64('_padding1'),
  borsh.u64('_padding2'),
])

// Helpers
export interface Round {
  roundId: number
  slot: BN
  timestamp: number
  answer: BN
}

const ROUND_LAYOUT: borsh.Layout<Round> = borsh.struct([
  borsh.u32('roundId'),
  borsh.u64('slot'),
  borsh.u32('timestamp'),
  borsh.i128('answer'),
])

export interface Scope {
}

export interface ScopeVersion extends Scope{
  version: boolean
}

export interface ScopeDecimals extends Scope{
  decimals: boolean
}

export interface ScopeDescription extends Scope{
  description: boolean
}

export interface ScopeRoundData extends Scope{
  roundData: ScopeRoundDataDetail
}

export interface ScopeRoundDataDetail {
  roundId: number
}

export interface ScopeLatestRoundData {
  latestRoundData: boolean
}

export interface ScopeAggregator {
  aggregator: boolean
}

// RPC
export class ChainkDfeedInstructionService {
  static createFeed(
    authorityAddress: PublicKey,
    derivationPath: Buffer,
    liveLength: number,
    historyLength: number,
    description: string,
    decimals: number,
    granularity: number,
    chainlinkDfeedProgramId: PublicKey,
  ): TransactionInstruction {

    const request: CreateFeedRequest = {
      derivationPath,
      liveLength,
      historyLength,
      description,
      decimals,
      granularity,
    }
    const data = coder.instruction.encode('createFeed', request)

    const [feedAddress,] = this.findFeedAddress(
      derivationPath,
      chainlinkDfeedProgramId,
    )

    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: authorityAddress, isSigner: true, isWritable: true, },
      <AccountMeta>{ pubkey: feedAddress, isSigner: false, isWritable: true, },
      <AccountMeta>{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false, },
    ]

    return <TransactionInstruction>{
      data,
      keys,
      programId: chainlinkDfeedProgramId,
    }
  }

  static submitFeed(
    authorityAddress: PublicKey,
    feedAddress: PublicKey,
    timestamp: BN,
    price: BN,
    chainlinkDfeedProgramId: PublicKey,
  ): TransactionInstruction {

    const request: SubmitFeedRequest = {
      timestamp,
      answer: price,
    }
    const data = coder.instruction.encode('submitFeed', request)

    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: authorityAddress, isSigner: true, isWritable: false, },
      <AccountMeta>{ pubkey: feedAddress, isSigner: false, isWritable: true, },
    ]

    return <TransactionInstruction>{
      data,
      keys,
      programId: chainlinkDfeedProgramId,
    }
  }

  static query(
    feedAddress: PublicKey,
    scope: Scope,
    chainlinkDfeedProgramId: PublicKey,
  ): TransactionInstruction {

    const request: QueryRequest = {
      scope,
    }
    const data = coder.instruction.encode('query', request)

    const keys: AccountMeta[] = [
      <AccountMeta>{ pubkey: feedAddress, isSigner: false, isWritable: false, },
    ]

    return <TransactionInstruction>{
      data,
      keys,
      programId: chainlinkDfeedProgramId,
    }
  }

  static decodeFeedData(
    data: Buffer,
  ): Feed {
    const headerData = data.slice(0, 200)
    const feed = coder.accounts.decode('Transmissions', headerData) as Feed
    feed.liveData = []
    feed.historicalData = []
    let index = 0
    let cursor = 200
    while (cursor + 48 < data.length && index < feed.historicalCursor) {
      const feedDetailData = data.slice(cursor, cursor + 48)
      const feedDetail = BorshService.deserialize(FEED_DETAIL_LAYOUT, feedDetailData)
      if(index < feed.liveLength && feedDetail.slot.gt(new BN(0))) {
        feed.liveData.push(feedDetail)
      }
      if(index >= feed.liveLength && feedDetail.slot.gt(new BN(0))) {
        feed.historicalData.push(feedDetail)
      }
      index += 1
      cursor += 48
    }
    return feed
  }

  static decodeRoundData(
    data: Buffer,
  ): Round {
    return BorshService.deserialize(ROUND_LAYOUT, data)
  }

  static findFeedAddress(
    derivationPath: Buffer,
    chainlinkDfeedProgramId: PublicKey,
  ): [PublicKey, number] {

    const prefix = HashService.sha256("Feed").slice(0, 8)
    return PublicKey.findProgramAddressSync(
      [
        prefix,
        derivationPath,
      ],
      chainlinkDfeedProgramId,
    )
  }
}

import {
  getProgramReturn,
  HashService,
  sendTransaction
} from '@coin98/solana-support-library';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  ChainkDfeedInstructionService,
  Feed,
  Scope
} from './chainlink_dfeed_instruction.service';

export class ChainlinkDfeedService {
  static async cteateFeed(
    connection: Connection,
    payerAccount: Keypair,
    feedName: string,
    liveLength: number,
    historyLength: number,
    description: string,
    decimals: number,
    granularity: number,
    chainlinkDfeedProgramId: PublicKey,
  ): Promise<PublicKey> {

    const derivationPath = HashService.sha256(feedName).slice(0, 8)

    const transaction = new Transaction()

    const createFeedInstruction = ChainkDfeedInstructionService.createFeed(
      payerAccount.publicKey,
      derivationPath,
      liveLength,
      historyLength,
      description,
      decimals,
      granularity,
      chainlinkDfeedProgramId,
    )
    transaction.add(createFeedInstruction)

    const txSign = await sendTransaction(connection, transaction, [
      payerAccount,
    ])

    const [feedAddress,] = ChainkDfeedInstructionService.findFeedAddress(
      derivationPath,
      chainlinkDfeedProgramId,
    )
    console.info(`Created Feed ${feedAddress.toBase58()}`, '---', txSign, '\n')
    return feedAddress
  }

  static async submitFeed(
    connection: Connection,
    payerAccount: Keypair,
    feedAddress: PublicKey,
    price: BN,
    chainlinkDfeedProgramId: PublicKey,
  ): Promise<boolean> {

    const transaction = new Transaction()

    const createFeedInstruction = ChainkDfeedInstructionService.submitFeed(
      payerAccount.publicKey,
      feedAddress,
      new BN(new Date().getTime() / 1000),
      price,
      chainlinkDfeedProgramId,
    )
    transaction.add(createFeedInstruction)

    const txSign = await sendTransaction(connection, transaction, [
      payerAccount,
    ])

    console.info(`Updated price feed ${feedAddress.toBase58()}, price = ${price.toString()}`, '---', txSign, '\n')
    return true
  }

  static async query(
    connection: Connection,
    payerAccount: Keypair,
    feedAddress: PublicKey,
    scope: Scope,
    chainlinkDfeedProgramId: PublicKey,
  ): Promise<string> {

    const transaction = new Transaction()

    const queryInstruction = ChainkDfeedInstructionService.query(
      feedAddress,
      scope,
      chainlinkDfeedProgramId,
    )
    transaction.add(queryInstruction)

    const txSign = await sendTransaction(connection, transaction, [
      payerAccount,
    ])
    const returnValue = await getProgramReturn(connection, txSign)
    console.info(`Query price feed ${feedAddress.toBase58()} Value: ${returnValue}`, '---', txSign, '\n')

    return returnValue
  }

  static async getFeedAccountInfo(
    connection: Connection,
    feedAddress: PublicKey,
  ): Promise<Feed> {
    const accountInfo = await connection.getAccountInfo(feedAddress)
    const data = ChainkDfeedInstructionService.decodeFeedData(accountInfo.data)
    return data
  }

  static async printFeedInfo(
    connection: Connection,
    feedAddress: PublicKey,
  ) {
    const accountData = await this.getFeedAccountInfo(connection, feedAddress)
    console.info('--- FEED ACCOUNT INFO ---')
    console.info(`Address:                 ${feedAddress.toBase58()} --- ${feedAddress.toBuffer().toString('hex')}`)
    console.info(`Version:                 ${accountData.version}`)
    console.info(`Owner:                   ${accountData.owner.toBase58()} --- ${accountData.owner.toBuffer().toString('hex')}`)
    console.info(`Proposed owner:          ${accountData.proposedOwner.toBase58()} --- ${accountData.proposedOwner.toBuffer().toString('hex')}`)
    console.info(`Writer:                  ${accountData.writer.toBase58()} --- ${accountData.writer.toBuffer().toString('hex')}`)
    console.info(`Description:             ${accountData.description.toString('utf8')}`)
    console.info(`Decimals:                ${accountData.decimals}`)
    console.info(`Flagging threshold:      ${accountData.flaggingThreshold}`)
    console.info(`Latest round ID:         ${accountData.latestRoundId}`)
    console.info(`Granularity:             ${accountData.granularity}`)
    console.info(`Live length:             ${accountData.liveLength}`)
    console.info(`Live cursor:             ${accountData.liveCursor}`)
    console.info(`Historical cursor:       ${accountData.historicalCursor}`)
    console.info(`Live data records:       ${accountData.liveData.length}`)
    console.info(`Historical data records: ${accountData.historicalData.length}`)
    accountData.liveData.forEach((item, index) => {
      if(index < 10) {
        console.info(`Live data (${item.slot.toString()}): ${item.price.toString()}`)
      }
    })
    accountData.historicalData.forEach((item, index) => {
      if(index < 10) {
        console.info(`Historical data (${item.slot.toString()}): ${item.price.toString()}`)
      }
    })
  }

  static findFeedAddress(
    params: string | Buffer,
    chainlinkDfeedProgramId: PublicKey,
  ): [PublicKey, number] {
    const derivationPath = (typeof(params) === 'string')
      ? HashService.sha256(params).slice(0, 8)
      : params
    return ChainkDfeedInstructionService.findFeedAddress(
      derivationPath,
      chainlinkDfeedProgramId,
    )
  }
}

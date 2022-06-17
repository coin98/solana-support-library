import {
  Connection, PublicKey
} from '@solana/web3.js'
import { ChainlinkDfeedService } from '../services/chainlink_dfeed.service'

describe('chainlink_dfeed_devnet_test', function() {

  const PROGRAM_ID = new PublicKey('HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny')

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

  it('print feed info: BTC/USD', async function() {
    await ChainlinkDfeedService.printFeedInfo(
      connection,
      new PublicKey('CzZQBrJCLqjXRfMjRN3fhbxur2QYHUzkpaRwkWsiPqbz'),
    )
  })
})

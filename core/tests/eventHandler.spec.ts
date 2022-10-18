import { IdlParserService } from "../src"
import { PublicKey } from "@solana/web3.js";
import { Idl } from "@project-serum/anchor";

const idlTest = {
  "version": "0.1.0",
  "name": "hello_world",
  "instructions": [
    {
      "name": "helloWorld",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "helloAccount",
          "isMut": true,
          "isSigner": false
        },
      ],
      "args": [
        {
          "name": "name1",
          "type": "bytes"
        },
        {
          "name": "name",
          "type": "publicKey"
        },
        {
          "name": "number",
          "type": "u8"
        },
      ]
    }
  ],
  "events": [
    {
      "name": "CreateAppDataEvent",
      "fields": [
        {
          "name": "maxCreator",
          "type": "u8",
          "index": false
        }
      ]
    }
  ],
  "accounts": [
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidOwner",
      "msg": "SarosNFTFarm: Invalid Owner"
    },
  ]
}

describe("Test Event Handler", () => {

})

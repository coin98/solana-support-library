import { IdlParserService } from "../src"
import assert from 'assert';
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

describe("Test idl parser service", () => {
  /* 
  it("Construction idl parser", () => {
    const parser = new IdlParserService(idlTest as Idl) as any

    assert(typeof parser.helloWorld === "function")
    // assert(typeof parser.decodeHelloAccount === "function")
  })
  */

  it("Create instruction", () => {
    const parser = new IdlParserService(idlTest as Idl) as any
    console.log(parser.ixLayout.get("helloWorld"))

    const request = {
      name: new PublicKey("5UrM9csUEDBeBqMZTuuZyHRNhbRW4vQ1MgKJDrKU1U2v"),
      name1: Buffer.from("hello")
    }

    const context = {
      user: new PublicKey("5UrM9csUEDBeBqMZTuuZyHRNhbRW4vQ1MgKJDrKU1U2v"),
      helloAccount: new PublicKey("5UrM9csUEDBeBqMZTuuZyHRNhbRW4vQ1MgKJDrKU1U2v")
    }

    const instruction = parser.helloWorld(
      request,
      context,
      new PublicKey("5UrM9csUEDBeBqMZTuuZyHRNhbRW4vQ1MgKJDrKU1U2v")
    )

    // console.log(instruction)
  })
})

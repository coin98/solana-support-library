import * as borsh from "@project-serum/borsh";
import { Layout } from "buffer-layout";
import * as base64 from "base64-js";
import camelCase from "camelcase";
import { snakeCase } from "snake-case";
import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js"
import { BorshService } from "./borsh.service";
import { IdlCoder } from "../helpers/idl_coder";
import type { Idl, IdlAccount, IdlAccountDef, IdlEvent, IdlField, IdlInstruction, IdlStateMethod, IdlTypeDef } from "../types/idl"
import { HashService } from "./hash.service";

type BuildInstructionFunction = (args: any, ctx: any, programId: PublicKey) => TransactionInstruction
type DecodeFunction = (data: Buffer) => any

export const DISCRIMINATOR_SIZE = 8;

function eventDiscriminator(name: string): Buffer {
  return Buffer.from(HashService.sha256(`event:${name}`)).slice(0, DISCRIMINATOR_SIZE);
}

function accountDiscriminator(name: string): Buffer {
  return Buffer.from(HashService.sha256(`account:${name}`)).slice(0, DISCRIMINATOR_SIZE);
}

export class IdlParserService {
  private ixLayout: Map<string, Layout>;
  private accountLayouts: Map<string, Layout>;
  private eventLayouts: Map<string, Layout>;
  private eventDiscriminators: Map<string, string>;
  private accountDiscriminators: Map<string, string>;

  constructor(idl: Idl) {
    this.ixLayout = IdlParserService.parseIxLayout(idl)
    this.accountLayouts = IdlParserService.parseAccountLayout(idl)
    this.eventLayouts = IdlParserService.parseEventLayout(idl)

    this.build(idl)
  }

  private static parseIxLayout(idl: Idl): Map<string, Layout> {
    const stateMethods: IdlStateMethod[] = idl.state ? idl.state.methods : [];

    const ixLayouts = stateMethods
      .map((m: IdlStateMethod): [string, Layout<unknown>] => {
        let fieldLayouts = m.args.map((arg: IdlField) => {
          return IdlCoder.fieldLayout(
            arg,
            Array.from([...(idl.accounts ?? []), ...(idl.types ?? [])])
          );
        });
        const name = camelCase(m.name);
        return [name, borsh.struct(fieldLayouts, name)];
      })
      .concat(
        idl.instructions.map((ix: IdlInstruction) => {
          let fieldLayouts = ix.args.map((arg: IdlField) =>
            IdlCoder.fieldLayout(
              arg,
              Array.from([...(idl.accounts ?? []), ...(idl.types ?? [])])
            )
          );
          const name = camelCase(ix.name);
          return [name, borsh.struct(fieldLayouts, name)];
        })
      );
    return new Map(ixLayouts);
  }

  private static parseAccountLayout(idl: Idl): Map<string, Layout> {
    const layouts: [string, Layout][] = idl.accounts.map((acc: IdlAccountDef) => {
      return [acc.name, IdlCoder.typeDefLayout(acc, idl.types)];
    });

    return new Map(layouts)
  }

  private static parseEventLayout(idl: Idl): Map<string, Layout> {
    const layouts: [string, Layout][] = idl.events.map((event) => {
      let eventTypeDef: IdlTypeDef = {
        name: event.name,
        type: {
          kind: "struct",
          fields: event.fields.map((f) => {
            return { name: f.name, type: f.type };
          }),
        },
      };
      return [event.name, IdlCoder.typeDefLayout(eventTypeDef, idl.types)];
    })


    return new Map(layouts)
  }

  private build(idl: Idl) {
    idl.instructions.map((inx: IdlInstruction) => {
      const inxImplement: BuildInstructionFunction = (args: any, ctx: any, programId: PublicKey): TransactionInstruction => {
        const layout = this.ixLayout.get(inx.name);
        const data = BorshService.anchorSerialize(snakeCase(inx.name), layout, args, 1000)
        const keys: AccountMeta[] = inx.accounts.map((item: IdlAccount) => <AccountMeta>{ pubkey: ctx[item.name], isWritable: item.isMut, isSigner: item.isSigner})

        if (ctx.remainingAccounts) {
          keys.push(...ctx.remainingAccounts)
        }

        return new TransactionInstruction({
          data,
          keys,
          programId
        })
      }
      this[inx.name] = inxImplement
    })

    idl.accounts.map((account: IdlTypeDef) => {
      const decode: DecodeFunction = (data: Buffer): any => {
        return BorshService.anchorDeserialize(this.accountLayouts.get(account.name), data)
      }

      this[`decode${account.name}Account`] = decode
    })

    idl.events.map((event: IdlEvent) => {
      const decode: DecodeFunction = (data: Buffer): any => {
        return BorshService.anchorDeserialize(this.eventLayouts.get(event.name), data)
      }

      this[`decode${event.name}`] = decode
    })

    this.eventDiscriminators = new Map<string, string>(
      idl.events === undefined
        ? []
        : idl.events.map((e) => [
            base64.fromByteArray(eventDiscriminator(e.name)),
            e.name,
          ])
    );

    this.accountDiscriminators = new Map<string, string>(
      idl.accounts === undefined
        ? []
        : idl.accounts.map((e) => [
            base64.fromByteArray(accountDiscriminator(e.name)),
            e.name,
          ])
    );
  }
  
  public decodeAnyAccount(data: Buffer): any {
    const disc = base64.fromByteArray(data.slice(0, 8));
    const accountName = this.accountDiscriminators.get(disc);
    if (accountName === undefined) {
      return null;
    }

    return {
      name: accountName,
      data: this.decodeAccount(accountName, data)
    }
  }

  public decodeAccount(accountName: string, data: Buffer): any {
    const layout = this.accountLayouts.get(accountName) 
    return BorshService.anchorDeserialize(layout, data)
  }

  public decodeAnyEvent(log: string): any {
    let logArr: Buffer;
    // This will throw if log length is not a multiple of 4.
    try {
      logArr = Buffer.from(base64.toByteArray(log));
    } catch (e) {
      return null;
    }

    const disc = base64.fromByteArray(logArr.slice(0, 8));
    const eventName = this.eventDiscriminators.get(disc);
    if (eventName === undefined) {
      return null;
    }

    return {
      name: eventName,
      data: this.decodeEvent(eventName, logArr)
    }
  }

  public decodeEvent(eventName: string, data: Buffer): any {
    const layout = this.eventLayouts.get(eventName) 
    return BorshService.anchorDeserialize(layout, data)
  }
}

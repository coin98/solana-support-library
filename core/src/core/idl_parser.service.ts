import * as borsh from "@project-serum/borsh";
import { Layout } from "buffer-layout";
import camelCase from "camelcase";
import { snakeCase } from "snake-case";
import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js"
import { BorshService } from "./borsh.service";
import { IdlCoder } from "../helpers/idl_coder";
import type { Idl, IdlAccount, IdlAccountDef, IdlField, IdlInstruction, IdlStateMethod, IdlTypeDef } from "../types/idl"

type BuildInstructionFunction = (args: any, ctx: any, programId: PublicKey) => TransactionInstruction
type DecodeAccountFunction = (data: Buffer) => any

export class IdlParserService {
  private ixLayout: Map<string, Layout>;
  private accountLayouts: Map<string, Layout>;

  constructor(idl: Idl) {
    this.ixLayout = IdlParserService.parseIxLayout(idl)
    this.accountLayouts = IdlParserService.parseAccountLayout(idl)

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
      const decode: DecodeAccountFunction = (data: Buffer): any => {
        return BorshService.anchorDeserialize(this.accountLayouts.get(account.name), data)
      }

      this[`decode${account.name}Account`] = decode
    })
  }
}

import * as borsh from "@project-serum/borsh";
import { Layout } from "buffer-layout";
import camelCase from "camelcase";
import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js"
import { BorshService } from "./borsh.service";
import { IdlCoder } from "../helpers/idl_coder";

type BuildInstructionFunction = (args: any, ctx: any, programId: PublicKey) => TransactionInstruction
type DecodeAccountFunction = (data: Buffer) => any

export class IdlParserService {
  private ixLayout: Map<string, Layout>;
  private accountLayouts: Map<string, Layout>;

  constructor(idl: any) {
    this.ixLayout = IdlParserService.parseIxLayout(idl)
    this.accountLayouts = IdlParserService.parseAccountLayout(idl)

    this.build(idl)
  }

  private static parseIxLayout(idl: any): Map<string, Layout> {
    const stateMethods = idl.state ? idl.state.methods : [];

    const ixLayouts = stateMethods
      .map((m: any): [string, Layout<unknown>] => {
        let fieldLayouts = m.args.map((arg: any) => {
          return IdlCoder.fieldLayout(
            arg,
            Array.from([...(idl.accounts ?? []), ...(idl.types ?? [])])
          );
        });
        const name = camelCase(m.name);
        return [name, borsh.struct(fieldLayouts, name)];
      })
      .concat(
        idl.instructions.map((ix: any) => {
          let fieldLayouts = ix.args.map((arg: any) =>
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

  private static parseAccountLayout(idl: any): Map<string, Layout> {
    const layouts: [string, Layout][] = idl.accounts.map((acc: any) => {
      return [acc.name, IdlCoder.typeDefLayout(acc, idl.types)];
    });

    return new Map(layouts)
  }

  private build(idl: any) {
    idl.instructions.map((inx: any) => {
      //this.buildLayout(inx.name, inx.args)
      const inxImplement: BuildInstructionFunction = (args: any, ctx: any, programId: PublicKey): TransactionInstruction => {
        const layout = this.ixLayout.get(inx.name);
        const data = BorshService.anchorSerialize(inx.name, layout, args, 1000)
        const keys: AccountMeta[] = inx.accounts.map((item: any) => <AccountMeta>{ pubkey: ctx[item.name], isWritable: item.isMut, isSigner: item.isSigner})

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

    idl.accounts.map((account: any) => {
      const decode: DecodeAccountFunction = (data: Buffer): any => {
        return BorshService.anchorDeserialize(this.accountLayouts.get(account.name), data)
      }

      this[`decode${account.name}Account`] = decode
    })
  }
}

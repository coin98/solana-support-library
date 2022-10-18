import { Connection, PublicKey } from "@solana/web3.js";
import { IdlParserService } from "./core";

export type EventCallback = (event: any, slot: number, signature: string) => void;

const PROGRAM_LOG = "Program log: ";
const PROGRAM_DATA = "Program data: ";

class LogScanner {
  constructor(public logs: string[]) {}

  next(): string | null {
    if (this.logs.length === 0) {
      return null;
    }
    let l = this.logs[0];
    this.logs = this.logs.slice(1);
    return l;
  }
}

class ExecutionContext {
  stack: string[] = [];

  program(): string {
    if (this.stack.length == 0) {
      throw "Empty stack"
    }
    return this.stack[this.stack.length - 1];
  }

  push(newProgram: string) {
    this.stack.push(newProgram);
  }

  pop() {
    if (this.stack.length == 0) {
      throw "Empty stack"
    }
    this.stack.pop();
  }
}

export class EventHandlerService {
  private _connection: Connection
  private _idlParserService: IdlParserService
  private _eventCallbacks: Map<number, [string, EventCallback]>;
  private _programId: PublicKey;
  private _eventListeners: Map<string, Array<number>>;

  private _listenerIdCount: number;
  private _onLogsSubscriptionId: number | undefined;

  constructor(
    connection: Connection,
    programId: PublicKey,
    idlParserService: IdlParserService
  ) {
    this._connection = connection
    this._programId = programId
    this._idlParserService = idlParserService
  }

  private _handleSystemlog(log: string): [string, boolean] {
    const logStart = log.split(":")[0];
    if (logStart.match(/^Program (.*) success/g) !== null) {
      return [null, true]
      // Recursive call.
    } else if (
      logStart.startsWith(`Program ${this._programId.toString()} invoke`)
    ) {
      return [this._programId.toString(), false]
    }
    // CPI call.
    else if (logStart.includes("invoke")) {
      return ["CPI", false]
    } else {
      return [null, false];
    }
  }

  // we use generator function here
  private* _parseLogs(logs: string[]) {
    const logScanner = new LogScanner(logs)
    const execution = new ExecutionContext()

    let log = logScanner.next()
    let isPopContext: boolean
    let newProgramExecute: string

    while(log != null) {
      if (execution.stack.length > 0 && execution.program() == this._programId.toString()) {
        if (log.startsWith(PROGRAM_LOG) || log.startsWith(PROGRAM_DATA)) {
          // handle program log
          const logStr = log.startsWith(PROGRAM_LOG) ? log.slice(PROGRAM_LOG.length) : log.slice(PROGRAM_DATA.length);
          const event = this._idlParserService.decodeAnyEvent(logStr) 

          if (event) {
            yield event
          }
        } else {
          [newProgramExecute, isPopContext] = this._handleSystemlog(log)
        }
      } else {
        [newProgramExecute, isPopContext] = this._handleSystemlog(log)
      }

      if (newProgramExecute) {
        execution.push(newProgramExecute)
      }

      if (isPopContext) {
        execution.pop()
      }

      log  = logScanner.next()
    }
  }

  public addEventListener(
    eventName: string,
    callback: EventCallback
  ): number {
    let listener = this._listenerIdCount;
    this._listenerIdCount += 1;

    if (!(eventName in this._eventCallbacks)) {
      this._eventListeners.set(eventName, []);
    }

    this._eventListeners.set(
      eventName,
      (this._eventListeners.get(eventName) ?? []).concat(listener)
    );

    this._eventCallbacks.set(listener, [eventName, callback]);

    // only create subscription one time
    if (this._onLogsSubscriptionId !== undefined) {
      return listener;
    }

    this._onLogsSubscriptionId = this._connection.onLogs(
      this._programId,
      (logs, ctx) => {
        if (logs.err) {
          return;
        }

        for (const event of this._parseLogs(logs.logs)) {
          const allListeners = this._eventListeners.get(event.name);

          if (allListeners) {
            allListeners.forEach((listener) => {
              const listenerCb = this._eventCallbacks.get(listener);

              if (listenerCb) {
                const [, callback] = listenerCb;
                callback(event.data, ctx.slot, logs.signature);
              }
            });
          }
        }
      }
    );
  }
}

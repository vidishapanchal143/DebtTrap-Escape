// Minimal accurate TypeScript declarations for better-sqlite3.
// The real @types/better-sqlite3 package is installed as a dev dependency and takes precedence.
// This file serves as a fallback shim.
declare module 'better-sqlite3' {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement<BindParameters extends unknown[] = unknown[]> {
    run(...params: BindParameters): RunResult;
    get(...params: BindParameters): unknown;
    all(...params: BindParameters): unknown[];
  }

  export default class Database {
    constructor(filename: string, options?: { readonly?: boolean; fileMustExist?: boolean });
    exec(sql: string): this;
    prepare<BindParameters extends unknown[] = unknown[]>(sql: string): Statement<BindParameters>;
    transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T;
    close(): void;
  }
}

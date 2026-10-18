/**
 * Pure-JS in-memory mock for `better-sqlite3` (no native binaries required).
 *
 * Implements the synchronous better-sqlite3 API subset used by ledger.ts:
 *   db.exec(sql)             – runs DDL
 *   db.prepare(sql).get(...) – returns first matching row or undefined
 *   db.prepare(sql).run(...) – executes DML, returns { changes, lastInsertRowid }
 *   db.prepare(sql).all(...) – returns all matching rows
 *   db.transaction(fn)()     – synchronous "atomic" wrapper (single-threaded Jest)
 *
 * Jest uses this file automatically via jest.config.ts moduleNameMapper.
 */

type Row = Record<string, unknown>;

// ─── In-memory table ──────────────────────────────────────────────────────────

class Table {
  rows: Row[] = [];

  insert(row: Row): void {
    this.rows.push({ ...row });
  }

  find(col: string, val: unknown): Row | undefined {
    return this.rows.find(r => r[col] === val);
  }

  findAll(conditions: Array<{ col: string; val: unknown }>, logic: 'AND' | 'OR' = 'AND'): Row[] {
    return this.rows.filter(row =>
      logic === 'OR'
        ? conditions.some(c => row[c.col] === c.val)
        : conditions.every(c => row[c.col] === c.val)
    );
  }

  updateWhere(
    sets: Record<string, unknown>,
    where: { col: string; val: unknown },
    notWhere?: { col: string; val: unknown }
  ): number {
    let count = 0;
    for (const row of this.rows) {
      if (row[where.col] !== where.val) continue;
      if (notWhere && row[notWhere.col] === notWhere.val) continue;
      for (const [k, v] of Object.entries(sets)) {
        if (v !== null && typeof v === 'object' && '__op' in (v as object)) {
          const op = v as { __op: '+' | '-'; delta: number };
          row[k] = op.__op === '+' ? Number(row[k]) + op.delta : Number(row[k]) - op.delta;
        } else {
          row[k] = v;
        }
      }
      count++;
    }
    return count;
  }
}

class InMemoryDB {
  private tables = new Map<string, Table>();

  ensure(name: string): Table {
    if (!this.tables.has(name)) this.tables.set(name, new Table());
    return this.tables.get(name)!;
  }

  get(name: string): Table | undefined {
    return this.tables.get(name);
  }
}

// ─── SQL interpreter ──────────────────────────────────────────────────────────

class Statement {
  constructor(private db: InMemoryDB, private sql: string) {}

  /** Bind parameters and execute, returning one row. */
  get(...params: unknown[]): Row | undefined {
    return this._exec(params).rows[0];
  }

  /** Bind parameters and execute, returning all matching rows. */
  all(...params: unknown[]): Row[] {
    return this._exec(params).rows;
  }

  /** Bind parameters and execute a mutating statement. */
  run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
    const res = this._exec(params);
    return { changes: res.changes, lastInsertRowid: res.lastInsertRowid };
  }

  // ── Core executor ───────────────────────────────────────────────────────────

  private _exec(params: unknown[]): {
    rows: Row[];
    changes: number;
    lastInsertRowid: number;
  } {
    const s = this.sql.replace(/\s+/g, ' ').trim();
    let pi = 0;
    const p = () => params[pi++];

    // ── CREATE TABLE ──────────────────────────────────────────────────────────
    if (/^CREATE TABLE/i.test(s)) {
      const m = s.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
      if (m) this.db.ensure(m[1]);
      return { rows: [], changes: 0, lastInsertRowid: 0 };
    }

    // ── SELECT ────────────────────────────────────────────────────────────────
    if (/^SELECT/i.test(s)) {
      const tableMatch = s.match(/FROM\s+(\w+)/i);
      if (!tableMatch) return { rows: [], changes: 0, lastInsertRowid: 0 };
      const table = this.db.get(tableMatch[1]);
      if (!table) return { rows: [], changes: 0, lastInsertRowid: 0 };

      // WHERE col = ? OR col = ?
      const orMatch = s.match(/WHERE\s+(\w+)\s*=\s*\?\s+OR\s+(\w+)\s*=\s*\?/i);
      let rows: Row[];
      if (orMatch) {
        const v1 = p(), v2 = p();
        rows = table.findAll([{ col: orMatch[1], val: v1 }, { col: orMatch[2], val: v2 }], 'OR');
      } else {
        const whereMatch = s.match(/WHERE\s+(\w+)\s*=\s*\?/i);
        rows = whereMatch ? table.findAll([{ col: whereMatch[1], val: p() }]) : [...table.rows];
      }

      // ORDER BY col DESC
      const orderMatch = s.match(/ORDER BY\s+(\w+)\s+DESC/i);
      if (orderMatch) {
        const col = orderMatch[1];
        rows = [...rows].sort((a, b) => String(b[col] ?? '').localeCompare(String(a[col] ?? '')));
      }

      // LIMIT ? OFFSET ? — consume in SQL-declaration order: LIMIT before OFFSET
      const limitMatch = s.match(/LIMIT\s+\?/i);
      const offsetMatch = s.match(/OFFSET\s+\?/i);
      const limit = limitMatch ? Number(p()) : rows.length;
      const offset = offsetMatch ? Number(p()) : 0;

      return { rows: rows.slice(offset, offset + limit), changes: 0, lastInsertRowid: 0 };
    }

    // ── INSERT ────────────────────────────────────────────────────────────────
    if (/^INSERT/i.test(s)) {
      const tableMatch = s.match(/INTO\s+(\w+)/i);
      if (!tableMatch) return { rows: [], changes: 0, lastInsertRowid: 0 };
      const table = this.db.ensure(tableMatch[1]);

      const colMatch = s.match(/\(([^)]+)\)\s*VALUES/i);
      const columns = colMatch ? colMatch[1].split(',').map(c => c.trim()) : [];
      const row: Row = {};
      for (const col of columns) {
        const v = params[pi++];
        // 'NULL' literal in SQL becomes null in JS
        row[col] = v === undefined ? null : v;
      }
      table.insert(row);
      return { rows: [], changes: 1, lastInsertRowid: table.rows.length };
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (/^UPDATE/i.test(s)) {
      const tableMatch = s.match(/UPDATE\s+(\w+)/i);
      if (!tableMatch) return { rows: [], changes: 0, lastInsertRowid: 0 };
      const table = this.db.get(tableMatch[1]);
      if (!table) return { rows: [], changes: 0, lastInsertRowid: 0 };

      // Extract SET clause (between SET and WHERE)
      const setMatch = s.match(/SET\s+(.*?)\s+WHERE/i);
      const setStr = setMatch?.[1] ?? '';
      const sets: Record<string, unknown> = {};

      // Match "col = col +/- ?" (arithmetic update like balance = balance - ?)
      const arithMatch = setStr.match(/(\w+)\s*=\s*\w+\s*([+-])\s*\?/);
      if (arithMatch) {
        const delta = params[pi++] as number;
        sets[arithMatch[1]] = { __op: arithMatch[2] as '+' | '-', delta };
      }

      // Match "col = 'literal'"
      for (const m of setStr.matchAll(/(\w+)\s*=\s*'([^']*)'/g)) {
        if (!(m[1] in sets)) sets[m[1]] = m[2];
      }

      // Match "col = ?" (simple param)
      for (const m of setStr.matchAll(/(\w+)\s*=\s*\?/g)) {
        if (!(m[1] in sets)) sets[m[1]] = params[pi++];
      }

      // WHERE col = ?
      const whereMatch = s.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (!whereMatch) return { rows: [], changes: 0, lastInsertRowid: 0 };
      const whereVal = params[pi++];

      // AND col != 'literal'
      const notMatch = s.match(/AND\s+(\w+)\s*!=\s*'([^']*)'/i);
      const notWhere = notMatch ? { col: notMatch[1], val: notMatch[2] } : undefined;

      const changes = table.updateWhere(
        sets,
        { col: whereMatch[1], val: whereVal },
        notWhere
      );
      return { rows: [], changes, lastInsertRowid: 0 };
    }

    return { rows: [], changes: 0, lastInsertRowid: 0 };
  }
}

// ─── Database (default export matching better-sqlite3) ────────────────────────

class Database {
  private db = new InMemoryDB();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_filename: string) {}

  exec(sql: string): this {
    // Create each table mentioned in CREATE TABLE statements
    for (const m of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(/gi)) {
      this.db.ensure(m[1]);
    }
    return this;
  }

  prepare(sql: string): Statement {
    return new Statement(this.db, sql);
  }

  /**
   * Returns a function that runs fn synchronously.
   * In Node/Jest (single-threaded), this is safe as an "atomic" wrapper.
   */
  transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T {
    return (...args: unknown[]) => fn(...args);
  }
}

export default Database;

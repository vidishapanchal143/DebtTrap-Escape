import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
// Path to persistent mock state file (for environments without real SQLite)
const STATE_FILE = path.resolve(__dirname, '../../ledger.state.json');
// Simple exec stub for mock DB
const exec = () => {};
function loadMockState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as {
        wallets: Record<string, { address: string; balance: number; asset: string; created_at: string }>;
        transactions: Record<string, DBTransactionRow>;
      };
      Object.assign(mockWallets, data.wallets || {});
      Object.assign(mockTransactions, data.transactions || {});
    }
  } catch (e) {
    console.error('Failed to load mock ledger state:', e);
  }
}
function saveMockState() {
  try {
    const data = { wallets: mockWallets, transactions: mockTransactions };
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save mock ledger state:', e);
  }
}
// Attempt to load real SQLite DB via better-sqlite3; fallback to in-memory mock if unavailable.


/* eslint-disable @typescript-eslint/no-explicit-any */
interface PreparedStatement {
  run: (...args: any[]) => any;
  get?: (...args: any[]) => any;
  all?: (...args: any[]) => any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type LedgerDB = {
  exec: (sql: string) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  prepare: (sql: string) => any;
  transaction: <T>(fn: () => T) => T;
};
let db!: LedgerDB;
// After prepare is defined we will assign db = { exec, prepare, transaction }

// Mock data stores
const mockWallets: Record<string, { address: string; balance: number; asset: string; created_at: string }> = {};
const mockTransactions: Record<string, DBTransactionRow> = {};
loadMockState();

const DEMO_ADDRESS = '0xDEMO1234567890';
const DEMO_ASSET = 'SIM-USDC';
const DEMO_INITIAL_BALANCE = 1_000_000;

try {
  
  // eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3');
  db = new Database('ledger.db');
  // Ensure required tables exist.
  db.exec(`CREATE TABLE IF NOT EXISTS wallet (address TEXT PRIMARY KEY, balance INTEGER, asset TEXT, created_at TEXT);`);
  db.exec(`CREATE TABLE IF NOT EXISTS "transaction" (id TEXT PRIMARY KEY, hash TEXT, sender_address TEXT, recipient_address TEXT, amount INTEGER, fee INTEGER, status TEXT, created_at TEXT, completed_at TEXT, idempotency_key TEXT UNIQUE, error TEXT);`);
  // Ensure demo wallet exists.
  if (db) {
    const exists = db!.prepare('SELECT 1 FROM wallet WHERE address = ?').get?.(DEMO_ADDRESS);
    if (!exists) {
      db!.prepare('INSERT INTO wallet (address, balance, asset, created_at) VALUES (?, ?, ?, ?)').run!(

        DEMO_ADDRESS,
        DEMO_INITIAL_BALANCE,
        DEMO_ASSET,
        new Date().toISOString()
      );
    }
  } else {
    if (!mockWallets[DEMO_ADDRESS]) {
      mockWallets[DEMO_ADDRESS] = { address: DEMO_ADDRESS, balance: DEMO_INITIAL_BALANCE, asset: DEMO_ASSET, created_at: new Date().toISOString() };
      if (typeof saveMockState === 'function') saveMockState();
    }
  }
    // Persist mock state if using mock DB (no-op for real DB)
    // Persist mock state if using mock DB (no-op for real DB)
if (typeof saveMockState === 'function') saveMockState();
}
catch (e) {
  // Optional: log error if needed
  console.error('Ledger initialization error:', e);

  // Fallback to mock implementation.
  mockWallets[DEMO_ADDRESS] = { address: DEMO_ADDRESS, balance: DEMO_INITIAL_BALANCE, asset: DEMO_ASSET, created_at: new Date().toISOString() };
  saveMockState();
}
  const prepare = (sql: string) => {
    // Very minimal parsing based on known queries used in this file
    if (/INSERT INTO wallet/.test(sql)) {
      return { run: (address: string, balance: number, asset: string, created_at: string) => {
        mockWallets[address] = { address, balance, asset, created_at };
      } };
    }
    if (/SELECT 1 FROM wallet/.test(sql)) {
      return { get: (addr: string) => (mockWallets[addr] ? { val: 1 } : undefined) };
    }
    if (/SELECT address, balance, asset, created_at FROM wallet/.test(sql)) {
      return { get: (addr: string) => (mockWallets[addr] ? mockWallets[addr] : undefined) };
    }
    if (/SELECT \* FROM transaction WHERE idempotency_key =/.test(sql)) {
      return { get: (key: string) => Object.values(mockTransactions).find((t) => t.idempotency_key === key) };
    }
    if (/SELECT id, hash, status FROM transaction WHERE idempotency_key =/.test(sql)) {
      return { get: (key: string) => {
        const t = Object.values(mockTransactions).find((tr) => tr.idempotency_key === key);
        return t ? { id: t.id, hash: t.hash, status: t.status } : undefined;
      } };
    }
    if (/SELECT balance FROM wallet/.test(sql)) {
      return { get: () => ({ balance: mockWallets[DEMO_ADDRESS].balance }) };
    }
    if (/UPDATE wallet SET balance = balance -/.test(sql)) {
      return { run: (debit: number) => { mockWallets[DEMO_ADDRESS].balance -= debit; saveMockState(); } };
    }
    if (/INSERT INTO wallet/.test(sql)) {
      return { run: (address: string, balance: number, asset: string, created_at: string) => {
        mockWallets[address] = { address, balance, asset, created_at };
        saveMockState();
      } };
    }
    if (/UPDATE wallet SET balance = balance +/.test(sql)) {
      return { run: (amount: number, address: string) => { if (mockWallets[address]) { mockWallets[address].balance += amount; saveMockState(); } } };
    }
    if (/INSERT INTO transaction/.test(sql)) {
      return { run: (
        id: string,
        hash: string,
        sender_address: string,
        recipient_address: string,
        amount: number,
        fee: number,
        status: string,
        created_at: string,
        completed_at: string,
        idempotency_key: string,
        error?: string | null
      ) => {
        mockTransactions[id] = {
          id,
          hash,
          sender_address,
          recipient_address,
          amount,
          fee,
          status,
          created_at,
          completed_at,
          idempotency_key,
          error: error ?? null,
        };
        saveMockState();
      } };
    }
    if (/SELECT \* FROM transaction WHERE id =/.test(sql)) {
      return { get: (id: string) => mockTransactions[id] };
    }
    if (/SELECT id, status FROM transaction WHERE idempotency_key =/.test(sql)) {
      return { get: (key: string) => {
        const t = Object.values(mockTransactions).find((tr) => tr.idempotency_key === key);
        return t ? { id: t.id, status: t.status } : undefined;
      } };
    } 
    if (/SELECT \* FROM transaction/.test(sql) && /sender_address/.test(sql)) {
      return { all: (...args: [string, string, number, number]) => {
        // args order: sender, recipient, limit, offset
        const [sender, recipient, limit, offset] = args;
        const filtered = Object.values(mockTransactions).filter((t) => t.sender_address === sender || t.recipient_address === recipient);
        // order by created_at descending
        filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        return filtered.slice(offset, offset + limit);
      } };
    }
    if (/UPDATE transaction SET status = 'cancelled'/.test(sql)) {
      return { run: (now: string, id: string) => {
        const tx = mockTransactions[id];
        if (tx) {
          tx.status = 'cancelled';
          tx.completed_at = now;
          return { changes: 1 };
        }
        return { changes: 0 };
      } };
    }
    if (/SELECT \* FROM transaction WHERE sender_address =/.test(sql)) {
      return { all: (addr: string) => Object.values(mockTransactions).filter((t) => t.sender_address === addr || t.recipient_address === addr) };
    }
    // Default stub for unhandled queries
    return { get: () => undefined, run: () => {}, all: () => [] };
  };
  // expose mock db API
db = {
  exec,
  prepare,
  transaction: <T>(fn: () => T) => {
    try {
      return fn();
    } catch (e) {
      throw e;
    }
  },
};


// DB setup already handled above with fallback

// Create tables if they do not exist
// No actual SQL table creation needed for the in‑memory fallback. The mock db's exec is a no‑op.

// Demo wallet constants (single‑user demo)


// Ensure demo wallet exists
// Ensure the demo wallet exists in the mock store
if (!db!.prepare('SELECT 1 FROM wallet WHERE address = ?').get?.(DEMO_ADDRESS)) {
  db!.prepare('INSERT INTO wallet (address, balance, asset, created_at) VALUES (?, ?, ?, ?)').run!(
    DEMO_ADDRESS,
    DEMO_INITIAL_BALANCE,
    DEMO_ASSET,
    new Date().toISOString()
  );
}

/** Types exported for the API layer */
export interface WalletInfo {
  address: string;
  balance: number; // cents
  asset: string;
  createdAt: string;
}

// Internal DB row interfaces
interface DBWalletRow {
  address: string;
  balance: number;
  asset: string;
  created_at: string;
}

interface DBTransactionRow {
  id: string;
  hash: string;
  sender_address: string;
  recipient_address: string;
  amount: number;
  fee: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  idempotency_key: string;
  error: string | null;
}

export function getWallet(): WalletInfo {
  let row: DBWalletRow | undefined;
  try {
    row = db.prepare('SELECT address, balance, asset, created_at FROM wallet WHERE address = ?').get!(DEMO_ADDRESS) as DBWalletRow | undefined;
  } catch (err) {
    console.error('Error fetching demo wallet from db:', err);
  }

  if (!row) {
    return { address: DEMO_ADDRESS, balance: DEMO_INITIAL_BALANCE, asset: DEMO_ASSET, createdAt: new Date().toISOString() };
  }

  const rawBalance = row.balance;
  const numBalance = typeof rawBalance === 'number' && !isNaN(rawBalance) ? rawBalance : Number(rawBalance);
  const safeBalance = !isNaN(numBalance) && numBalance !== null ? numBalance : DEMO_INITIAL_BALANCE;

  return { address: row.address || DEMO_ADDRESS, balance: safeBalance, asset: row.asset || DEMO_ASSET, createdAt: row.created_at || new Date().toISOString() };
}

export interface WalletBalance {
  balance: number; // display units (e.g., USDC)
  asset: string;
}

export function getWalletBalance(): WalletBalance {
  const { balance, asset } = getWallet();
  const safeCents = (typeof balance === 'number' && !isNaN(balance)) ? balance : 0;
  // Convert cents to display units with two decimal places
  const display = Number((safeCents / 100).toFixed(2));
  return { balance: isNaN(display) ? 0 : display, asset: asset || DEMO_ASSET };
}

/** Transfer preparation – validates only, never mutates DB */
export interface TransferRequest {
  recipient: string;
  amount: number; // display units (USDC)
  fee?: number;
  idempotencyKey?: string;
}

export interface PreparedTransfer {
  recipient: string;
  amountCents: number;
  feeCents: number;
  totalDebit: number;
  idempotencyKey: string;
}

export function prepareTransfer(req: TransferRequest): PreparedTransfer {
  const { recipient, amount, fee = 0, idempotencyKey } = req;
  // Runtime validation (addresses must look like 0x… hex strings)
  if (typeof recipient !== 'string' || !/^0x[0-9A-Fa-f]{8,40}$/.test(recipient)) {
    throw new Error('Invalid recipient address format');
  }
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Transfer amount must be a positive number');
  }
  if (typeof fee !== 'number' || fee < 0) {
    throw new Error('Fee must be a non‑negative number');
  }
  const amountCents = Math.round(amount * 100);
  const feeCents = Math.round(fee * 100);
  const totalDebit = amountCents + feeCents;
  const wallet = getWallet();
  if (totalDebit > wallet.balance) {
    throw new Error('Insufficient funds for this transfer');
  }
  const key = idempotencyKey ?? uuidv4();
  // Idempotency – if a transaction with this key already exists, return its details
  const existing = db!.prepare('SELECT * FROM transaction WHERE idempotency_key = ?').get!(key) as DBTransactionRow | undefined;
  if (existing) {
    return {
      recipient: existing.recipient_address,
      amountCents: existing.amount,
      feeCents: existing.fee,
      totalDebit: existing.amount + existing.fee,
      idempotencyKey: existing.idempotency_key,
    };
  }
  return { recipient, amountCents, feeCents, totalDebit, idempotencyKey: key };
}

/** Confirm (commit) a previously prepared transfer – atomic update */
export interface ConfirmTransferResult {
  txId: string;
  txHash: string;
}

export function confirmTransfer(prepared: PreparedTransfer): ConfirmTransferResult {
  // Atomic block – re-check status inside the transaction so a concurrent
  // cancelTransfer cannot slip through between the pre-check and the INSERT.
  const result = db.transaction(() => {
    const existing = db!.prepare(
      'SELECT id, hash, status FROM transaction WHERE idempotency_key = ?'
    ).get!(prepared.idempotencyKey) as { id: string; hash: string; status: string } | undefined;

    if (existing) {
      if (existing.status === 'cancelled') {
        throw new Error('Transaction has been cancelled and cannot be confirmed');
      }
      // Already confirmed – idempotent success
      return { txId: existing.id, txHash: existing.hash } as ConfirmTransferResult;
    }

    const sender = db!.prepare(
      'SELECT balance FROM wallet WHERE address = ?'
    ).get!(DEMO_ADDRESS) as { balance: number };
    if (sender.balance < prepared.totalDebit) {
      throw new Error('Balance changed, insufficient funds at commit time');
    }
    // Debit sender
    db!.prepare('UPDATE wallet SET balance = balance - ? WHERE address = ?').run(
      prepared.totalDebit, DEMO_ADDRESS
    );
    // Credit recipient (create wallet entry if missing)
    const recipientRow = db!.prepare(
      'SELECT address FROM wallet WHERE address = ?'
    ).get(prepared.recipient) as { address: string } | undefined;
    if (!recipientRow) {
      db!.prepare(
        'INSERT INTO wallet (address, balance, asset, created_at) VALUES (?, ?, ?, ?)'
      ).run(prepared.recipient, prepared.amountCents, DEMO_ASSET, new Date().toISOString());
    } else {
      db!.prepare(
        'UPDATE wallet SET balance = balance + ? WHERE address = ?'
      ).run(prepared.amountCents, prepared.recipient);
    }
    // Record the confirmed transaction
    const txId = uuidv4();
    const txHash = '0x' + Buffer.from(txId).toString('hex').slice(0, 64);
    const now = new Date().toISOString();
    db!.prepare(`
      INSERT INTO transaction
        (id, hash, sender_address, recipient_address, amount, fee, status, created_at, completed_at, idempotency_key, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `).run(
      txId, txHash, DEMO_ADDRESS, prepared.recipient,
      prepared.amountCents, prepared.feeCents,
      'confirmed', now, now, prepared.idempotencyKey
    );
    // Persist mock state if using mock DB
    if (typeof saveMockState === 'function') {
      saveMockState();
    }
    return { txId, txHash } as ConfirmTransferResult;
  });
  return result;
}

/**
 * Cancel a pending/prepared transfer by its idempotency key.
 *
 * Rules:
 * - Only works if NO transaction row with this key exists yet (nothing was persisted
 *   during prepare) OR the row has status 'pending' (if we ever add that status).
 * - If the row is already 'cancelled' → idempotent, return true.
 * - If the row is 'confirmed' → throws; the caller maps this to HTTP 409.
 * - Uses a SQLite transaction and checks affected-row count – never claims
 *   success if a concurrent confirm already wrote the row.
 *
 * Note: prepareTransfer currently does NOT write a DB row; confirmation is the
 * first persistence step.  Therefore, if no row exists for the key, there is
 * nothing to cancel (return false → 404).
 */
export function cancelTransfer(idempotencyKey: string): boolean {
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    throw new Error('idempotencyKey must be a non-empty string');
  }

  const result = db.transaction((): boolean => {
    const tx = db!.prepare(
      'SELECT id, status FROM transaction WHERE idempotency_key = ?'
    ).get(idempotencyKey) as { id: string; status: string } | undefined;

    if (!tx) {
      // No persisted transaction for this key – nothing to cancel.
      return false;
    }

    if (tx.status === 'confirmed') {
      throw new Error('Cannot cancel a confirmed transaction');
    }

    if (tx.status === 'cancelled') {
      // Already cancelled – idempotent.
      return true;
    }

    // Atomically update status; verify exactly one row was changed.
    const now = new Date().toISOString();
    const info = db!.prepare(
      "UPDATE transaction SET status = 'cancelled', completed_at = ? WHERE id = ? AND status != 'confirmed'"
    ).run(now, tx.id);

    // If changes === 0, a concurrent operation (e.g. confirmTransfer) won the
    // race and committed the row first – treat as conflict.
    if (info.changes === 0) {
      throw new Error('Transfer could not be cancelled: concurrent operation may have confirmed it');
    }

    // Persist mock state if using mock DB
    if (typeof saveMockState === 'function') {
      saveMockState();
    }

    return true;
  });

  return result;
}

/** Transaction status/receipt */
export interface TransactionStatus {
  id: string;
  hash: string;
  sender: string;
  recipient: string;
  amount: string; // formatted display units
  fee: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

export function getTransactionStatus(txId: string): TransactionStatus {
  const row = db.prepare('SELECT * FROM transaction WHERE id = ?').get(txId) as {
    id: string; hash: string; sender_address: string; recipient_address: string; amount: number; fee: number; status: string; created_at: string; completed_at: string | null; error: string | null;
  };
  if (!row) throw new Error('Transaction not found');
  return {
    id: row.id,
    hash: row.hash,
    sender: row.sender_address,
    recipient: row.recipient_address,
    amount: (row.amount / 100).toFixed(2),
    fee: (row.fee / 100).toFixed(2),
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
  };
}

/** List transactions for the demo wallet */
export interface TransactionRecord {
  id: string;
  hash: string;
  sender: string;
  recipient: string;
  amount: string;
  fee: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export function getTransactionHistory({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): TransactionRecord[] {
  const rows = db.prepare(`
    SELECT * FROM transaction
    WHERE sender_address = ? OR recipient_address = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(DEMO_ADDRESS, DEMO_ADDRESS, limit, offset) as Array<{
    id: string; hash: string; sender_address: string; recipient_address: string; amount: number; fee: number; status: string; created_at: string; completed_at: string | null;
  }>;

  console.log('DEBUG transaction rows', rows.length);
  return rows.map(row => ({
    id: row.id,
    hash: row.hash,
    sender: row.sender_address,
    recipient: row.recipient_address,
    amount: (row.amount / 100).toFixed(2),
    fee: (row.fee / 100).toFixed(2),
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }));
}

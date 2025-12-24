import { app } from "electron";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const BetterSqlite3 =
  require("better-sqlite3") as typeof import("better-sqlite3");

export type TransactionType = "income" | "expense";

export interface DbCategory {
  id: number;
  name: string;
  colorCode: string | null;
  icon: string | null;
}

export interface DbLedgerPeriod {
  id: number;
  year: number;
  month: number;
}

export interface DbTransaction {
  id: number;
  ledgerPeriodId: number;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  notes: string | null;
  categoryId: number | null;
  categoryName: string | null;
}

let db: import("better-sqlite3").Database | null = null;

export function getDbFilePath() {
  return path.join(app.getPath("userData"), "onefinance.db");
}

function assertInt(name: string, value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
}

function assertNonEmptyString(name: string, value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
}

export function initDb() {
  if (db) return db;

  const dbPath = getDbFilePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new BetterSqlite3(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_years (
      year INTEGER PRIMARY KEY,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ledger_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(year, month),
      FOREIGN KEY (year) REFERENCES ledger_years(year) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      colorCode TEXT NULL,
      icon TEXT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerPeriodId INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense')),
      notes TEXT NULL,
      categoryId INTEGER NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ledgerPeriodId) REFERENCES ledger_periods(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_ledgerPeriodId ON transactions(ledgerPeriodId);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
  `);

  const seedDefaults = db.prepare(
    `INSERT OR IGNORE INTO categories (name, colorCode, icon)
       VALUES (@name, @colorCode, @icon)`
  );

  const defaults: Array<Pick<DbCategory, "name" | "colorCode" | "icon">> = [
    { name: "Food", colorCode: null, icon: null },
    { name: "Rent", colorCode: null, icon: null },
    { name: "Utilities", colorCode: null, icon: null },
    { name: "Entertainment", colorCode: null, icon: null },
    { name: "Salary", colorCode: null, icon: null },
    { name: "Other", colorCode: null, icon: null },
  ];

  const tx = db.transaction(() => {
    for (const row of defaults) seedDefaults.run(row);
  });
  tx();

  return db;
}

export function listTree(): Array<{ year: number; months: DbLedgerPeriod[] }> {
  const database = initDb();

  const years = database
    .prepare("SELECT year FROM ledger_years ORDER BY year DESC")
    .all() as Array<{ year: number }>;

  const months = database
    .prepare(
      "SELECT id, year, month FROM ledger_periods ORDER BY year DESC, month ASC"
    )
    .all() as DbLedgerPeriod[];

  const monthsByYear = new Map<number, DbLedgerPeriod[]>();
  for (const m of months) {
    const list = monthsByYear.get(m.year);
    if (list) list.push(m);
    else monthsByYear.set(m.year, [m]);
  }

  return years.map((y) => ({
    year: y.year,
    months: monthsByYear.get(y.year) ?? [],
  }));
}

export function createYear(year: number) {
  assertInt("year", year);
  if (year < 1900 || year > 3000) throw new Error("year out of range");

  const database = initDb();
  database
    .prepare("INSERT OR IGNORE INTO ledger_years (year) VALUES (?)")
    .run(year);
  return { year };
}

export function createMonth(year: number, month: number): DbLedgerPeriod {
  assertInt("year", year);
  assertInt("month", month);
  if (month < 1 || month > 12) throw new Error("month must be 1-12");

  const database = initDb();
  database
    .prepare("INSERT OR IGNORE INTO ledger_years (year) VALUES (?)")
    .run(year);

  database
    .prepare("INSERT OR IGNORE INTO ledger_periods (year, month) VALUES (?, ?)")
    .run(year, month);

  const row = database
    .prepare(
      "SELECT id, year, month FROM ledger_periods WHERE year = ? AND month = ?"
    )
    .get(year, month) as DbLedgerPeriod | undefined;

  if (!row) throw new Error("failed to create month");
  return row;
}

export function listCategories(): DbCategory[] {
  const database = initDb();
  return database
    .prepare(
      "SELECT id, name, colorCode, icon FROM categories ORDER BY name ASC"
    )
    .all() as DbCategory[];
}

export function createCategory(input: {
  name: string;
  colorCode?: string | null;
  icon?: string | null;
}) {
  const name = input.name?.trim();
  assertNonEmptyString("name", name);

  const database = initDb();
  const stmt = database.prepare(
    "INSERT INTO categories (name, colorCode, icon) VALUES (@name, @colorCode, @icon)"
  );
  const info = stmt.run({
    name,
    colorCode: input.colorCode ?? null,
    icon: input.icon ?? null,
  });
  return {
    id: Number(info.lastInsertRowid),
    name,
    colorCode: input.colorCode ?? null,
    icon: input.icon ?? null,
  };
}

export function updateCategory(input: {
  id: number;
  name: string;
  colorCode?: string | null;
  icon?: string | null;
}) {
  assertInt("id", input.id);
  const name = input.name?.trim();
  assertNonEmptyString("name", name);

  const database = initDb();
  database
    .prepare(
      "UPDATE categories SET name = @name, colorCode = @colorCode, icon = @icon WHERE id = @id"
    )
    .run({
      id: input.id,
      name,
      colorCode: input.colorCode ?? null,
      icon: input.icon ?? null,
    });

  return {
    id: input.id,
    name,
    colorCode: input.colorCode ?? null,
    icon: input.icon ?? null,
  };
}

export function deleteCategory(id: number) {
  assertInt("id", id);
  const database = initDb();
  database.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return { ok: true };
}

export function listTransactions(ledgerPeriodId: number): DbTransaction[] {
  assertInt("ledgerPeriodId", ledgerPeriodId);

  const database = initDb();
  return database
    .prepare(
      `SELECT 
        t.id,
        t.ledgerPeriodId,
        t.title,
        t.amount,
        t.date,
        t.type,
        t.notes,
        t.categoryId,
        c.name AS categoryName
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.categoryId
      WHERE t.ledgerPeriodId = ?
      ORDER BY t.date DESC, t.id DESC`
    )
    .all(ledgerPeriodId) as DbTransaction[];
}

export function createTransaction(input: {
  ledgerPeriodId: number;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  notes?: string | null;
  categoryId?: number | null;
}) {
  assertInt("ledgerPeriodId", input.ledgerPeriodId);
  assertNonEmptyString("title", input.title);
  if (typeof input.amount !== "number" || !Number.isFinite(input.amount))
    throw new Error("amount must be a number");
  assertNonEmptyString("date", input.date);
  if (input.type !== "income" && input.type !== "expense")
    throw new Error("invalid type");
  if (input.categoryId != null) assertInt("categoryId", input.categoryId);

  const database = initDb();
  const info = database
    .prepare(
      `INSERT INTO transactions (ledgerPeriodId, title, amount, date, type, notes, categoryId)
       VALUES (@ledgerPeriodId, @title, @amount, @date, @type, @notes, @categoryId)`
    )
    .run({
      ledgerPeriodId: input.ledgerPeriodId,
      title: input.title.trim(),
      amount: input.amount,
      date: input.date,
      type: input.type,
      notes: input.notes ?? null,
      categoryId: input.categoryId ?? null,
    });

  return { id: Number(info.lastInsertRowid) };
}

export function updateTransaction(input: {
  id: number;
  ledgerPeriodId: number;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  notes?: string | null;
  categoryId?: number | null;
}) {
  assertInt("id", input.id);
  assertInt("ledgerPeriodId", input.ledgerPeriodId);
  assertNonEmptyString("title", input.title);
  if (typeof input.amount !== "number" || !Number.isFinite(input.amount))
    throw new Error("amount must be a number");
  assertNonEmptyString("date", input.date);
  if (input.type !== "income" && input.type !== "expense")
    throw new Error("invalid type");
  if (input.categoryId != null) assertInt("categoryId", input.categoryId);

  const database = initDb();
  database
    .prepare(
      `UPDATE transactions
       SET ledgerPeriodId = @ledgerPeriodId,
           title = @title,
           amount = @amount,
           date = @date,
           type = @type,
           notes = @notes,
           categoryId = @categoryId
       WHERE id = @id`
    )
    .run({
      id: input.id,
      ledgerPeriodId: input.ledgerPeriodId,
      title: input.title.trim(),
      amount: input.amount,
      date: input.date,
      type: input.type,
      notes: input.notes ?? null,
      categoryId: input.categoryId ?? null,
    });

  return { ok: true };
}

export function deleteTransaction(id: number) {
  assertInt("id", id);
  const database = initDb();
  database.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  return { ok: true };
}

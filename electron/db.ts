import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { Account, AccountType } from "@/types";

// Use createRequire for native module (better-sqlite3)
const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

// Database file path - stored in user data directory
export const dbPath = path.join(app.getPath("userData"), "one-finance.db");
export const dbDir = app.getPath("userData");

// Database instance - will be initialized lazily
let _db: ReturnType<typeof Database> | null = null;

/**
 * Get or create the database instance
 */
export function getDb(): ReturnType<typeof Database> {
  if (!_db) {
    // Ensure the directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    _db = new Database(dbPath);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

/**
 * Close the database connection and reset the instance
 */
export function closeDb(): void {
  if (_db) {
    try {
      _db.close();
    } catch (e) {
      console.error("[DB] Error closing database:", e);
    }
    _db = null;
  }
}

// Export db as a getter for backward compatibility
export const db = new Proxy({} as ReturnType<typeof Database>, {
  get(_target, prop) {
    return getDb()[prop];
  },
});

/**
 * Initialize the database schema
 * Creates all tables if they don't exist
 */
export function initializeDatabase(): void {
  // Ledger Years - Primary key is the year itself
  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_years (
      year INTEGER PRIMARY KEY
    )
  `);

  // Ledger Periods - Links to a year, represents a month
  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
      FOREIGN KEY (year) REFERENCES ledger_years(year) ON DELETE CASCADE,
      UNIQUE (year, month)
    )
  `);

  // Categories - For organizing transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      colorCode TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT NOT NULL DEFAULT 'pi-tag'
    )
  `);

  // Account Type
  db.exec(`
    CREATE TABLE IF NOT EXISTS accountType (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL
    )
  `);

  // Accounts
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountName TEXT NOT NULL,
      institutionName TEXT,
      startingBalance REAL NOT NULL,
      accountTypeId INTEGER,
      isDefault BOOLEAN NOT NULL,
      FOREIGN KEY (accountTypeId) REFERENCES accountType(id) ON DELETE SET NULL
    )
  `);

  // Transactions - The main data
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerPeriodId INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      notes TEXT,
      categoryId INTEGER,
      accountId INTEGER,
      FOREIGN KEY (ledgerPeriodId) REFERENCES ledger_periods(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `);

  // Seed default categories if none exist
  const categoryCount = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .get() as { count: number };
  if (categoryCount.count === 0) {
    seedDefaultCategories();
  }

  // Seed default account types if none exist
  const accountTypesCount = db
    .prepare("SELECT COUNT(*) as count FROM accountType")
    .get() as { count: number };
  if (accountTypesCount.count === 0) {
    seedDefaultAccountData();
  }

  // MIGRATION: Check if accountId exists in transactions (for existing installs)
  try {
    const tableInfo = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
    const hasAccountId = tableInfo.some((col) => col.name === 'accountId');
    
    if (!hasAccountId) {
      console.log("[DB] Migrating: Adding accountId to transactions table");
      // We can't easily add a FK constraint via ALTER TABLE in SQLite without recreating the table usually, 
      // but for this simple case, just adding the column is the first step.
      // However, SQLite supports ADD COLUMN with REFERENCES in newer versions.
      // If it fails, we might need a more complex migration, but let's try the simple one.
      db.prepare("ALTER TABLE transactions ADD COLUMN accountId INTEGER REFERENCES accounts(id) ON DELETE SET NULL").run();
      // Index creation is handled below
    }
  } catch (error) {
    console.error("[DB] Migration error:", error);
  }

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_ledger_period ON transactions(ledgerPeriodId);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(accountId);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_ledger_periods_year ON ledger_periods(year);
  `);

  console.log(`[DB] Database initialized at: ${dbPath}`);
}

/**
 * Seed default categories
 */
function seedDefaultCategories(): void {
  const defaultCategories = [
    { name: "Salary", colorCode: "#22c55e", icon: "pi-wallet" },
    { name: "Food & Dining", colorCode: "#f97316", icon: "pi-shopping-cart" },
    { name: "Transportation", colorCode: "#3b82f6", icon: "pi-car" },
    { name: "Entertainment", colorCode: "#a855f7", icon: "pi-ticket" },
    { name: "Shopping", colorCode: "#ec4899", icon: "pi-shopping-bag" },
    { name: "Bills & Utilities", colorCode: "#eab308", icon: "pi-bolt" },
    { name: "Healthcare", colorCode: "#14b8a6", icon: "pi-heart" },
    { name: "Other", colorCode: "#6b7280", icon: "pi-ellipsis-h" },
  ];

  const insert = db.prepare(
    "INSERT INTO categories (name, colorCode, icon) VALUES (?, ?, ?)"
  );
  for (const cat of defaultCategories) {
    insert.run(cat.name, cat.colorCode, cat.icon);
  }
  console.log("[DB] Default categories seeded");
}

function seedDefaultAccountData(): void{
  
  const defaultAccountTypes = [
    {type: "Cash"},
    {type: "Chequing"},
    {type: "Savings"},
  ];

  const defaultAccounts = [
    {accountName: "One Finance", institutionName: null, startingBalance: 0, accountTypeId: 0, isDefault: true},
  ];

  const insertAccountType = db.prepare(
    "INSERT INTO accountType (type) VALUES (?)"
  );

  let result = null;
  for (const accType of defaultAccountTypes){
    result = insertAccountType.run(accType.type);
  }

  const id = result?.lastInsertRowid ?? 0; 

  const insertAccount = db.prepare(
    "INSERT INTO accounts (accountName, institutionName, startingBalance, accountTypeId, isDefault) VALUES (?,?,?,?,?)"
  );

  for (const acc of defaultAccounts){
    insertAccount.run(acc.accountName, acc.institutionName, acc.startingBalance, id, Number(acc.isDefault));
  }
  console.log("Account Data Seeded")
}

// ============================================
// LEDGER YEARS OPERATIONS
// ============================================

export function getLedgerYears(): number[] {
  const rows = db
    .prepare("SELECT year FROM ledger_years ORDER BY year DESC")
    .all() as { year: number }[];
  return rows.map((r) => r.year);
}

export function createLedgerYear(year: number): number {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO ledger_years (year) VALUES (?)"
  );
  stmt.run(year);
  return year;
}

export function deleteLedgerYear(year: number): boolean {
  // This will cascade delete all periods and their transactions due to FK constraints
  const stmt = db.prepare("DELETE FROM ledger_years WHERE year = ?");
  const result = stmt.run(year);
  return result.changes > 0;
}

// ============================================
// LEDGER PERIODS OPERATIONS
// ============================================

export interface LedgerPeriod {
  id: number;
  year: number;
  month: number;
}

export function getLedgerPeriods(year?: number): LedgerPeriod[] {
  if (year) {
    return db
      .prepare("SELECT * FROM ledger_periods WHERE year = ? ORDER BY month")
      .all(year) as LedgerPeriod[];
  }
  return db
    .prepare("SELECT * FROM ledger_periods ORDER BY year DESC, month DESC")
    .all() as LedgerPeriod[];
}

export function getLedgerPeriodByYearMonth(
  year: number,
  month: number
): LedgerPeriod | undefined {
  return db
    .prepare("SELECT * FROM ledger_periods WHERE year = ? AND month = ?")
    .get(year, month) as LedgerPeriod | undefined;
}

export function createLedgerPeriod(year: number, month: number): LedgerPeriod {
  // Ensure the year exists
  createLedgerYear(year);

  // Check if period already exists
  const existing = getLedgerPeriodByYearMonth(year, month);
  if (existing) return existing;

  const stmt = db.prepare(
    "INSERT INTO ledger_periods (year, month) VALUES (?, ?)"
  );
  const result = stmt.run(year, month);

  return {
    id: result.lastInsertRowid as number,
    year,
    month,
  };
}

export function getOrCreateCurrentPeriod(): LedgerPeriod {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Ensure year exists
  createLedgerYear(year);

  // Create all 12 months for the year if they don't exist
  for (let m = 1; m <= 12; m++) {
    const existing = getLedgerPeriodByYearMonth(year, m);
    if (!existing) {
      db.prepare("INSERT INTO ledger_periods (year, month) VALUES (?, ?)").run(
        year,
        m
      );
    }
  }

  // Return the current month's period
  return getLedgerPeriodByYearMonth(year, month) as LedgerPeriod;
}

// ============================================
// ACCOUNT OPERATIONS
// ============================================

export function getAccounts(): Account[]{
  return db.prepare("SELECT * FROM accounts ORDER BY accountName").all() as Account[];
}

export function getAccountTypes(): AccountType[]{
  return db.prepare("SELECT * FROM accountType ORDER BY type").all() as AccountType[];
}

export function getAccountById(id: number): Account | undefined{
  return db.prepare("SELECT  * FROM accounts WHERE id = ?").get(id) as Account | undefined;
}

export function getAccountTypeById(id: number): AccountType | undefined{
  return db.prepare("SELECT  * FROM accountType WHERE id = ?").get(id) as AccountType | undefined;
}

export function insertAccount(account: Account): void{

  if (account.isDefault){
    resetDefault();
  }

  const insert = db.prepare("INSERT INTO accounts (accountName, institutionName, startingBalance, accountTypeId, isDefault) VALUES (?,?,?,?,?)");
  insert.run(account.accountName, account.institutionName, account.startingBalance, account.accountTypeId, Number(account.isDefault));
}

export function insertAccountType(accountType: AccountType): void{
  const insert = db.prepare("INSERT INTO accountType (type) VALUES (?)");
  insert.run(accountType.type);
}

export function resetDefault(): void {
  db.prepare("UPDATE accounts SET isDefault = false WHERE isDefault = true").run();
}

export function editAccount(account: Account): void {

  try{

    const accountInDatabase = getAccountById(account.id);

    if(accountInDatabase === undefined){
      throw new Error("Account being edited not found in database")
    }

    if (account.isDefault){
      resetDefault();
    }

    db.prepare(`
      UPDATE accounts
      SET
        accountName = ?,
        institutionName = ?,
        startingBalance = ?,
        accountTypeId = ?,
        isDefault = ?
      WHERE id = ?
    `).run(
      account.accountName,
      account.institutionName,
      account.startingBalance,
      account.accountTypeId,
      account.isDefault ? 1 : 0, 
      account.id
    );
  } catch(e){
    console.log(e);
  }
}

export function editAccountType(accountType: AccountType): void{
  db.prepare(`
    UPDATE accountType
    SET
      type = ?,
    WHERE id = ?
  `).run(
    accountType.type,
    accountType.id
  );
}

export function deleteAccountById(
  accountId: number,
  strategy: "transfer" | "delete",
  transferToAccountId?: number
): void {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === accountId);

  if (account === undefined) return;

  // Requirement: An account will always exist.
  if (accounts.length <= 1) {
    throw new Error("Cannot delete the only remaining account.");
  }

  if (strategy === "transfer") {
    if (!transferToAccountId) {
      throw new Error("Transfer target account ID is required.");
    }
    // Transfer transactions
    db.prepare("UPDATE transactions SET accountId = ? WHERE accountId = ?").run(
      transferToAccountId,
      accountId
    );
  } else {
    // Delete transactions associated with this account
    db.prepare("DELETE FROM transactions WHERE accountId = ?").run(accountId);
  }

  // Now delete the account
  db.prepare("DELETE FROM accounts WHERE id = ?").run(accountId);

  // If we deleted the default account, ensure a new default is set
  if (account.isDefault) {
    if (strategy === "transfer" && transferToAccountId) {
      const target = accounts.find((a) => a.id === transferToAccountId);
      if (target) {
        target.isDefault = true;
        editAccount(target);
      }
    } else {
      // Pick first available
      const nextDefault = getAccounts()[0];
      if (nextDefault) {
        nextDefault.isDefault = true;
        editAccount(nextDefault);
      }
    }
  }
}

export function deleteAccount(account: Account): void {

  db.prepare("DELETE FROM accountType WHERE id = ?").run(account.id);



}




// ============================================
// CATEGORIES OPERATIONS
// ============================================

export interface Category {
  id: number;
  name: string;
  colorCode: string;
  icon: string;
}

export function getCategories(): Category[] {
  return db
    .prepare("SELECT * FROM categories ORDER BY name")
    .all() as Category[];
}

export function getCategoryById(id: number): Category | undefined {
  return db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as
    | Category
    | undefined;
}

export function createCategory(
  name: string,
  colorCode: string,
  icon: string
): Category {
  const stmt = db.prepare(
    "INSERT INTO categories (name, colorCode, icon) VALUES (?, ?, ?)"
  );
  const result = stmt.run(name, colorCode, icon);

  return {
    id: result.lastInsertRowid as number,
    name,
    colorCode,
    icon,
  };
}

export function updateCategory(
  id: number,
  name: string,
  colorCode: string,
  icon: string
): Category | undefined {
  const stmt = db.prepare(
    "UPDATE categories SET name = ?, colorCode = ?, icon = ? WHERE id = ?"
  );
  stmt.run(name, colorCode, icon, id);
  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const stmt = db.prepare("DELETE FROM categories WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============================================
// TRANSACTIONS OPERATIONS
// ============================================

export interface Transaction {
  id: number;
  ledgerPeriodId: number;
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  notes: string | null;
  categoryId: number | null;
  accountId: number | null;
}

export interface TransactionWithCategory extends Transaction {
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
}

export interface CreateTransactionInput {
  ledgerPeriodId: number;
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  notes?: string;
  categoryId?: number;
  accountId?: number;
}

export interface SearchOptions {
  text?: string;
  categoryIds?: number[];
  accountIds?: number[];
  fromDate?: string | null;
  toDate?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  type?: "income" | "expense" | null;
}

export function searchTransactions(
  options: SearchOptions,
  limit: number = 50
): TransactionWithCategory[] {
  const { text = "", categoryIds = [], accountIds = [], fromDate, toDate, minAmount, maxAmount, type } = options;
  const searchTerm = `%${text.trim()}%`;

  let sql = `
    SELECT 
      t.*,
      c.name as categoryName,
      c.colorCode as categoryColor,
      c.icon as categoryIcon
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    WHERE 1=1
  `;
  
  const params: (string | number)[] = [];

  // Add type filter
  if (type) {
    sql += " AND t.type = ?";
    params.push(type);
  }

  // Add category filters
  if (categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => "?").join(",");
    sql += ` AND t.categoryId IN (${placeholders})`;
    params.push(...categoryIds);
  }

  // Add account filters
  if (accountIds.length > 0) {
    const placeholders = accountIds.map(() => "?").join(",");
    sql += ` AND t.accountId IN (${placeholders})`;
    params.push(...accountIds);
  }

  // Add date filters
  if (fromDate) {
    if (toDate) {
      sql += " AND t.date BETWEEN ? AND ?";
      params.push(fromDate, toDate);
    } else {
      // From date to today
      const today = new Date().toISOString().split('T')[0];
      sql += " AND t.date BETWEEN ? AND ?";
      params.push(fromDate, today);
    }
  }

  // Add amount filters
  if (minAmount !== undefined && minAmount !== null) {
    sql += " AND t.amount >= ?";
    params.push(minAmount);
  }
  if (maxAmount !== undefined && maxAmount !== null) {
    sql += " AND t.amount <= ?";
    params.push(maxAmount);
  }

  // Add text search
  if (text.trim().length > 0) {
    sql += ` AND (
      t.title LIKE ? 
      OR COALESCE(t.notes, '') LIKE ?
      OR COALESCE(c.name, '') LIKE ?
    )`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += " ORDER BY t.date DESC, t.id DESC LIMIT ?";
  params.push(limit);

  return db.prepare(sql).all(...params) as TransactionWithCategory[];
}

export function getTransactions(
  ledgerPeriodId?: number | null,
  limit?: number
): TransactionWithCategory[] {
  const baseQuery = `
    SELECT 
      t.*,
      c.name as categoryName,
      c.colorCode as categoryColor,
      c.icon as categoryIcon
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
  `;

  let query = baseQuery;
  const params: (number | string)[] = [];

  if (ledgerPeriodId) {
    query += " WHERE t.ledgerPeriodId = ?";
    params.push(ledgerPeriodId);
  }

  query += " ORDER BY t.date DESC, t.id DESC";

  if (limit) {
    query += " LIMIT ?";
    params.push(limit);
  }

  return db.prepare(query).all(...params) as TransactionWithCategory[];
}

export function getTransactionById(
  id: number
): TransactionWithCategory | undefined {
  return db
    .prepare(
      `
    SELECT 
      t.*,
      c.name as categoryName,
      c.colorCode as categoryColor,
      c.icon as categoryIcon
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    WHERE t.id = ?
  `
    )
    .get(id) as TransactionWithCategory | undefined;
}

export function createTransaction(
  input: CreateTransactionInput
): TransactionWithCategory {
  const stmt = db.prepare(`
    INSERT INTO transactions (ledgerPeriodId, title, amount, date, type, notes, categoryId, accountId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.ledgerPeriodId,
    input.title,
    input.amount,
    input.date,
    input.type,
    input.notes || null,
    input.categoryId || null,
    input.accountId || null
  );

  return getTransactionById(result.lastInsertRowid as number)!;
}

export function updateTransaction(
  id: number,
  input: Partial<CreateTransactionInput>
): TransactionWithCategory | undefined {
  const current = getTransactionById(id);
  if (!current) return undefined;

  const stmt = db.prepare(`
    UPDATE transactions 
    SET ledgerPeriodId = ?, title = ?, amount = ?, date = ?, type = ?, notes = ?, categoryId = ?, accountId = ?
    WHERE id = ?
  `);

  stmt.run(
    input.ledgerPeriodId ?? current.ledgerPeriodId,
    input.title ?? current.title,
    input.amount ?? current.amount,
    input.date ?? current.date,
    input.type ?? current.type,
    input.notes !== undefined ? input.notes : current.notes,
    input.categoryId !== undefined ? input.categoryId : current.categoryId,
    input.accountId !== undefined ? input.accountId : current.accountId,
    id
  );

  return getTransactionById(id);
}

export function deleteTransaction(id: number): boolean {
  const stmt = db.prepare("DELETE FROM transactions WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============================================
// DASHBOARD / SUMMARY OPERATIONS
// ============================================

export interface PeriodSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export function getPeriodSummary(
  ledgerPeriodId: number | null
): PeriodSummary {
  let query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpenses,
      COUNT(*) as transactionCount
    FROM transactions
  `;

  const params: (number | string)[] = [];

  if (ledgerPeriodId !== null) {
    query += " WHERE ledgerPeriodId = ?";
    params.push(ledgerPeriodId);
  }

  const result = db.prepare(query).get(...params) as {
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
  };

  return {
    ...result,
    balance: result.totalIncome - result.totalExpenses,
  };
}

export interface CategoryBreakdown {
  categoryId: number | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  count: number;
}

export function getCategoryBreakdown(
  ledgerPeriodId: number | null,
  type: "income" | "expense"
): CategoryBreakdown[] {
  let query = `
    SELECT 
      t.categoryId,
      COALESCE(c.name, 'Uncategorized') as categoryName,
      COALESCE(c.colorCode, '#6b7280') as categoryColor,
      COALESCE(c.icon, 'pi-question') as categoryIcon,
      SUM(t.amount) as total,
      COUNT(*) as count
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    WHERE t.type = ?
  `;

  const params: (number | string)[] = [type];

  if (ledgerPeriodId !== null) {
    query += " AND t.ledgerPeriodId = ?";
    params.push(ledgerPeriodId);
  }

  query += `
    GROUP BY t.categoryId
    ORDER BY total DESC
  `;

  return db.prepare(query).all(...params) as CategoryBreakdown[];
}

// Export the database instance for advanced operations if needed
export default db;
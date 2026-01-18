import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { Account, AccountType, Category, CreateTransactionInput, LedgerMonth, SearchOptions, Transaction, TransactionWithCategory, MonthlyTrend, DailyTransactionSum } from "@/types";

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
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      notes TEXT,
      categoryId INTEGER,
      accountId INTEGER NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
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

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(accountId);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
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

export function deleteAllDataFromTables(): void{
  const tables = [
    "transactions",
    "accounts",
    "accountType",
    "categories",
    "ledger_years"
  ];
  for (const table of tables){
    db.prepare(`DELETE FROM ${table}`).run();
  }
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

export function createLedgerYearWithId(year: number, id: number): number {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO ledger_years (id, year) VALUES (?,?)"
  );
  stmt.run(id, year);
  return year;
}

export function deleteLedgerYear(year: number, deleteTransactions: boolean = false): boolean {
  const database = getDb();

  const deleteOp = database.transaction(() => {
    if (deleteTransactions) {
      // Delete transactions for that year (dates starting with "YYYY-")
      database.prepare("DELETE FROM transactions WHERE date LIKE ?").run(`${year}-%`);
    }
    // Delete the year from ledger_years
    database.prepare("DELETE FROM ledger_years WHERE year = ?").run(year);
  });

  try {
    deleteOp();
    return true;
  } catch (error) {
    console.error("Delete year failed:", error);
    return false;
  }
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

export function insertAccount(account: Account): number | null{

  try {
    if (account.isDefault){
      resetDefault();
    }
  
    const insert = db.prepare("INSERT INTO accounts (accountName, institutionName, startingBalance, accountTypeId, isDefault) VALUES (?,?,?,?,?)");
    const result = insert.run(account.accountName, account.institutionName, account.startingBalance, account.accountTypeId, Number(account.isDefault));

    return Number(result.lastInsertRowid);
  } catch {
    return null;
  }
}

export function insertAccountType(accountType: AccountType): number | null {
  try {
    const result = db
      .prepare("INSERT INTO accountType (type) VALUES (?)")
      .run(accountType.type);

    return Number(result.lastInsertRowid);
  } catch {
    return null;
  }
}

export async function resetDefault(): Promise<void> {
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

export function insertCategoryWithId(category: Category): void{
  const insert = db.prepare("INSERT INTO categories (id, name, colorCode, icon) VALUES (?,?,?,?)");
  insert.run(category.id, category.name, category.colorCode, category.icon);
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

export function searchTransactions(
  options: SearchOptions,
  limit?: number
): TransactionWithCategory[] {
  const { text = "", categoryIds = [], accountIds = [], fromDate, toDate, minAmount, maxAmount, type, sortOrder = 'desc' } = options;
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

  const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY t.date ${validSortOrder}, t.id DESC`;

  if (limit) {
    sql += " LIMIT ?";
    params.push(limit);
  }

  return db.prepare(sql).all(...params) as TransactionWithCategory[];
}

export function getTransactions(
  ledgerMonth?: LedgerMonth,
  limit?: number,
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

  if (ledgerMonth) {
    // Filter by year and month
    // SQLite strftime('%Y', date) returns 'YYYY', strftime('%m', date) returns 'MM'
    query += " WHERE strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ?";
    // Ensure month is padded (e.g. 1 -> '01')
    const monthStr = ledgerMonth.month.toString().padStart(2, '0');
    params.push(ledgerMonth.year.toString(), monthStr);
  }

  query += " ORDER BY t.date DESC, t.id DESC";

  if (limit) {
    query += " LIMIT ?";
    params.push(limit);
  }

  return db.prepare(query).all(...params) as TransactionWithCategory[];
}

export function getMonthlyTrends(year: number): MonthlyTrend[] {
  const query = `
    SELECT 
      strftime('%m', date) as monthStr,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses
    FROM transactions 
    WHERE strftime('%Y', date) = ?
    GROUP BY monthStr
    ORDER BY monthStr
  `;

  const rows = db.prepare(query).all(year.toString()) as { monthStr: string, totalIncome: number, totalExpenses: number }[];

  // Fill in missing months and format
  const trends: MonthlyTrend[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthStr = m.toString().padStart(2, '0');
    const row = rows.find(r => r.monthStr === monthStr);
    const income = row ? row.totalIncome : 0;
    const expense = row ? row.totalExpenses : 0;
    
    trends.push({
      month: m,
      year: year,
      totalIncome: income,
      totalExpenses: expense,
      balance: income - expense
    });
  }
  
  return trends;
}

export function getDailyTransactionSum(year: number, month: number, type: 'income' | 'expense'): DailyTransactionSum[] {
  const query = `
    SELECT 
      strftime('%d', date) as dayStr,
      SUM(amount) as total
    FROM transactions 
    WHERE strftime('%Y', date) = ? 
      AND strftime('%m', date) = ? 
      AND type = ?
    GROUP BY dayStr
    ORDER BY dayStr
  `;

  const monthStr = month.toString().padStart(2, '0');
  const rows = db.prepare(query).all(year.toString(), monthStr, type) as { dayStr: string, total: number }[];

  return rows.map(r => ({
    day: parseInt(r.dayStr, 10),
    total: r.total
  }));
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
    INSERT INTO transactions (title, amount, date, type, notes, categoryId, accountId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.title,
    input.amount,
    input.date,
    input.type,
    input.notes || null,
    input.categoryId || null,
    input.accountId
  );

  return getTransactionById(result.lastInsertRowid as number)!;
}

export function insertTransactionWithId(transaction: Transaction): void{
  const insert = db.prepare(`
    INSERT INTO transactions (id, ledgerPeriodId, title, amount, date, type, notes, categoryId, accountId)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  insert.run(
    transaction.id,
    transaction.ledgerPeriodId,
    transaction.title,
    transaction.amount,
    transaction.date,
    transaction.type,
    transaction.notes,
    transaction.categoryId,
    transaction.accountId
  );
}

export function updateTransaction(
  id: number,
  input: Partial<CreateTransactionInput>
): TransactionWithCategory | undefined {
  const current = getTransactionById(id);
  if (!current) return undefined;

  const stmt = db.prepare(`
    UPDATE transactions 
    SET title = ?, amount = ?, date = ?, type = ?, notes = ?, categoryId = ?, accountId = ?
    WHERE id = ?
  `);

  stmt.run(
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

export function getRollingMonthlyTrends(): MonthlyTrend[] {
  const now = new Date();
  
  // 13 months inclusive: Current Month back to Same Month Last Year
  // Start Date: 1st of (Current Month - 12)
  const startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  // End Date: Last day of Current Month
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const toSqlDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const startStr = toSqlDate(startDate);
  const endStr = toSqlDate(endDate);

  const query = `
    SELECT 
      strftime('%Y', date) as yearStr,
      strftime('%m', date) as monthStr,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses
    FROM transactions 
    WHERE date >= ? AND date <= ?
    GROUP BY yearStr, monthStr
    ORDER BY yearStr, monthStr
  `;
  
  const rows = db.prepare(query).all(startStr, endStr) as { yearStr: string, monthStr: string, totalIncome: number, totalExpenses: number }[];
  
  const trends: MonthlyTrend[] = [];
  const ptr = new Date(startDate);
  
  // Loop 13 times
  for (let i = 0; i < 13; i++) {
     const y = ptr.getFullYear();
     const m = ptr.getMonth() + 1;
     const yearStr = y.toString();
     const monthStr = m.toString().padStart(2, '0');
     
     const row = rows.find(r => r.yearStr === yearStr && r.monthStr === monthStr);
     
     trends.push({
         year: y,
         month: m,
         totalIncome: row ? row.totalIncome : 0,
         totalExpenses: row ? row.totalExpenses : 0,
         balance: row ? row.totalIncome - row.totalExpenses : 0
     });
     
     ptr.setMonth(ptr.getMonth() + 1);
  }
  
  return trends;
}

export function getTotalMonthSpend(year: number, month: number): number {
    const query = `
        SELECT SUM(amount) as total
        FROM transactions
        WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ? AND type = 'expense'
    `;
    const monthStr = month.toString().padStart(2, '0');
    const result = db.prepare(query).get(year.toString(), monthStr) as { total: number };
    return result.total || 0;
}

export function getNetWorthTrend(): { month: number, year: number, balance: number }[] {
    // 1. Get sum of all starting balances
    const accounts = getAccounts();
    const initialBalance = accounts.reduce((sum, acc) => sum + acc.startingBalance, 0);

    // 2. Get monthly net changes (income - expense) for all time
    const query = `
        SELECT 
            strftime('%Y', date) as yearStr,
            strftime('%m', date) as monthStr,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as netChange
        FROM transactions 
        GROUP BY yearStr, monthStr
        ORDER BY yearStr ASC, monthStr ASC
    `;
    
    const rows = db.prepare(query).all() as { yearStr: string, monthStr: string, netChange: number }[];
    
    // 3. Calculate cumulative balance
    const trends: { month: number, year: number, balance: number }[] = [];
    let runningBalance = initialBalance;
    
    for (const row of rows) {
        runningBalance += row.netChange;
        trends.push({
            year: parseInt(row.yearStr),
            month: parseInt(row.monthStr),
            balance: runningBalance
        });
    }
    
    return trends;
}

// Export the database instance for advanced operations if needed
export default db;
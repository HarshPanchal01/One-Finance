import { Account, AccountType } from "@/types";
import { ipcRenderer, contextBridge } from "electron";

// Type definitions for our database operations
export interface LedgerPeriod {
  id: number;
  year: number;
  month: number;
}

export interface Category {
  id: number;
  name: string;
  colorCode: string;
  icon: string;
}

export interface Transaction {
  id: number;
  ledgerPeriodId: number;
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  notes: string | null;
  categoryId: number | null;
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
}

export interface PeriodSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  categoryId: number | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  count: number;
}

// The API exposed to the renderer process
const electronAPI = {
  // ============================================
  // LEDGER YEARS
  // ============================================
  getLedgerYears: (): Promise<number[]> =>
    ipcRenderer.invoke("db:getLedgerYears"),

  createLedgerYear: (year: number): Promise<number> =>
    ipcRenderer.invoke("db:createLedgerYear", year),

  deleteLedgerYear: (year: number): Promise<boolean> =>
    ipcRenderer.invoke("db:deleteLedgerYear", year),

  // ============================================
  // LEDGER PERIODS
  // ============================================
  getLedgerPeriods: (year?: number): Promise<LedgerPeriod[]> =>
    ipcRenderer.invoke("db:getLedgerPeriods", year),

  getLedgerPeriodByYearMonth: (
    year: number,
    month: number
  ): Promise<LedgerPeriod | undefined> =>
    ipcRenderer.invoke("db:getLedgerPeriodByYearMonth", year, month),

  createLedgerPeriod: (year: number, month: number): Promise<LedgerPeriod> =>
    ipcRenderer.invoke("db:createLedgerPeriod", year, month),

  getOrCreateCurrentPeriod: (): Promise<LedgerPeriod> =>
    ipcRenderer.invoke("db:getOrCreateCurrentPeriod"),

  // ============================================
  // CATEGORIES
  // ============================================
  getCategories: (): Promise<Category[]> =>
    ipcRenderer.invoke("db:getCategories"),

  getCategoryById: (id: number): Promise<Category | undefined> =>
    ipcRenderer.invoke("db:getCategoryById", id),

  createCategory: (
    name: string,
    colorCode: string,
    icon: string
  ): Promise<Category> =>
    ipcRenderer.invoke("db:createCategory", name, colorCode, icon),

  updateCategory: (
    id: number,
    name: string,
    colorCode: string,
    icon: string
  ): Promise<Category | undefined> =>
    ipcRenderer.invoke("db:updateCategory", id, name, colorCode, icon),

  deleteCategory: (id: number): Promise<boolean> =>
    ipcRenderer.invoke("db:deleteCategory", id),

  // ============================================
  // ACCOUNTS
  // ============================================

  getAccounts: (): Promise<Account[]> => ipcRenderer.invoke("db:getAccounts"),
  getAccountTypes: (): Promise<AccountType[]> => ipcRenderer.invoke("db:getAccountTypes"),
  getAccountById: (id: number): Promise<Account | undefined> => ipcRenderer.invoke("db:getTransactions", id),
  getAccountTypeById: (id: number): Promise<AccountType | undefined> => ipcRenderer.invoke("db:getAccountTypeById", id),
  insertAccount: (account: Account): Promise<void> => ipcRenderer.invoke("db:insertAccount", account),
  insertAccountType: (accountType: AccountType): Promise<void> => ipcRenderer.invoke("db:insertAccountType", accountType),
  resetDefault: (): Promise<void> => ipcRenderer.invoke("db:resetDefault"),
  editAccount: (account: Account): Promise<Account | undefined> => ipcRenderer.invoke("db:editAccount", account),
  editAccountType: (accountType: AccountType): Promise<AccountType | undefined> => ipcRenderer.invoke("db:editAccountType", accountType),
  deleteAccountByAccountId: (id: number): Promise<boolean> => ipcRenderer.invoke("db:deleteAccountByAccountId", id),
  deleteAccountTypeById: (id: number): Promise<boolean> => ipcRenderer.invoke("db:deleteAccountTypeById", id),

  // ============================================
  // TRANSACTIONS
  // ============================================
  getTransactions: (
    ledgerPeriodId?: number | null,
    limit?: number
  ): Promise<TransactionWithCategory[]> =>
    ipcRenderer.invoke("db:getTransactions", ledgerPeriodId, limit),

  getTransactionById: (
    id: number
  ): Promise<TransactionWithCategory | undefined> =>
    ipcRenderer.invoke("db:getTransactionById", id),

  createTransaction: (
    input: CreateTransactionInput
  ): Promise<TransactionWithCategory> =>
    ipcRenderer.invoke("db:createTransaction", input),

  updateTransaction: (
    id: number,
    input: Partial<CreateTransactionInput>
  ): Promise<TransactionWithCategory | undefined> =>
    ipcRenderer.invoke("db:updateTransaction", id, input),

  deleteTransaction: (id: number): Promise<boolean> =>
    ipcRenderer.invoke("db:deleteTransaction", id),

  // ============================================
  // SUMMARY / DASHBOARD
  // ============================================
  getPeriodSummary: (ledgerPeriodId: number | null): Promise<PeriodSummary> =>
    ipcRenderer.invoke("db:getPeriodSummary", ledgerPeriodId),

  getCategoryBreakdown: (
    ledgerPeriodId: number | null,
    type: "income" | "expense"
  ): Promise<CategoryBreakdown[]> =>
    ipcRenderer.invoke("db:getCategoryBreakdown", ledgerPeriodId, type),

  // ============================================
  // SYSTEM OPERATIONS
  // ============================================
  getDbPath: (): Promise<string> => ipcRenderer.invoke("system:getDbPath"),

  openDbLocation: (): Promise<void> =>
    ipcRenderer.invoke("system:openDbLocation"),

  deleteDatabase: (): Promise<boolean> =>
    ipcRenderer.invoke("system:deleteDatabase"),

  // ============================================
  // GENERIC IPC (for future use)
  // ============================================
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.off(channel, callback);
  },
};

// Expose the API to the renderer
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// Type declaration for the window object
export type ElectronAPI = typeof electronAPI;

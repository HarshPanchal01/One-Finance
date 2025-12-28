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

export interface SearchOptions {
  text?: string;
  categoryIds?: number[];
  fromDate?: string | null;
  toDate?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  type?: "income" | "expense" | null;
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

  searchTransactions: (
    options: SearchOptions,
    limit?: number
  ): Promise<TransactionWithCategory[]> =>
    ipcRenderer.invoke("db:searchTransactions", options, limit),

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

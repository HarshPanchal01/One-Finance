import { Account, AccountType, Category, CreateTransactionInput, LedgerMonth, LedgerYear, SearchOptions, TransactionWithCategory } from "@/types";
import { ipcRenderer, contextBridge } from "electron";

// The API exposed to the renderer process
const electronAPI = {
  // ============================================
  // LEDGER YEARS
  // ============================================
  getLedgerYears: (): Promise<number[]> =>
    ipcRenderer.invoke("db:getLedgerYears"),

  createLedgerYear: (year: number): Promise<number> =>
    ipcRenderer.invoke("db:createLedgerYear", year),

  deleteLedgerYear: (year: number, deleteTransactions: boolean = false): Promise<boolean> =>
    ipcRenderer.invoke("db:deleteLedgerYear", year, deleteTransactions),

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
  insertAccount: (account: Account): Promise<number | null> => ipcRenderer.invoke("db:insertAccount", account),
  insertAccountType: (accountType: AccountType): Promise<number | null> => ipcRenderer.invoke("db:insertAccountType", accountType),
  resetDefault: (): Promise<void> => ipcRenderer.invoke("db:resetDefault"),
  editAccount: (account: Account): Promise<Account | undefined> => ipcRenderer.invoke("db:editAccount", account),
  editAccountType: (accountType: AccountType): Promise<AccountType | undefined> => ipcRenderer.invoke("db:editAccountType", accountType),
  deleteAccountById: (id: number, strategy: 'transfer' | 'delete', transferToAccountId?: number): Promise<boolean> => ipcRenderer.invoke("db:deleteAccountById", id, strategy, transferToAccountId),
  deleteAccountTypeById: (id: number): Promise<boolean> => ipcRenderer.invoke("db:deleteAccountTypeById", id),

  // ============================================
  // TRANSACTIONS
  // ============================================
  getTransactions: (
    ledgerMonth?: LedgerMonth | null,
    limit?: number
  ): Promise<TransactionWithCategory[]> =>
    ipcRenderer.invoke("db:getTransactions", ledgerMonth, limit),

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
  // SYSTEM OPERATIONS
  // ============================================

  deleteAllDataFromTables: (): Promise<void> => ipcRenderer.invoke("db:deleteAllDataFromTables"),

  getDbPath: (): Promise<string> => ipcRenderer.invoke("system:getDbPath"),

  openDbLocation: (): Promise<void> =>
    ipcRenderer.invoke("system:openDbLocation"),

  deleteDatabase: (): Promise<boolean> =>
    ipcRenderer.invoke("system:deleteDatabase"),

  exportDatabase: (payload : {data: string, defaultName?: string}): Promise<{success:boolean}> =>
    ipcRenderer.invoke("save-file", payload),

  importDatabase: () : Promise<{success: boolean, filepath? : string, data? : {
    accounts?: Account[],
    transactions?: TransactionWithCategory[],
    categories?: Category[],
    accountTypes?: AccountType[],
    ledgerYears?: number[],
  }}> =>
    ipcRenderer.invoke("import-file"),

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

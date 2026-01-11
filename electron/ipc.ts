import { ipcMain, shell } from "electron";
import fs from "node:fs";
import {
  // Ledger Years
  getLedgerYears,
  createLedgerYear,
  deleteLedgerYear,

  // Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  // Transactions
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  searchTransactions,

  // Types

  // DB paths and instance
  dbPath,
  closeDb,
  getAccounts,
  getAccountTypes,
  deleteAccountById,
  insertAccount,
  editAccount,
  insertAccountType,
  deleteAllDataFromTables,
} from "./db";
import { Account, AccountType, CreateTransactionInput, LedgerMonth, SearchOptions } from "@/types";

/**
 * Register all IPC handlers for database operations
 * Call this once in main.ts after app is ready
 */
export function registerIpcHandlers(): void {
  // ============================================
  // LEDGER YEARS HANDLERS
  // ============================================

  ipcMain.handle("db:getLedgerYears", async () => {
    return getLedgerYears();
  });

  ipcMain.handle("db:createLedgerYear", async (_event, year: number) => {
    return createLedgerYear(year);
  });

  ipcMain.handle("db:deleteLedgerYear", async (_event, year: number, deleteTransactions: boolean) => {
    return deleteLedgerYear(year, deleteTransactions);
  });

  // ============================================
  // ACCOUNTS HANDLERS
  // ============================================

  ipcMain.handle("db:getAccounts", async () =>{
    return getAccounts();
  });

  ipcMain.handle("db:getAccountTypes", async () =>{
    return getAccountTypes();
  });

  ipcMain.handle("db:deleteAccountById", async (_event, id: number, strategy: 'transfer' | 'delete', transferToAccountId?: number) =>{
    return deleteAccountById(id, strategy, transferToAccountId);
  });

  ipcMain.handle("db:insertAccount", async (_event, account: Account) => {
    return insertAccount(account);
  });

  ipcMain.handle("db:insertAccountType", async (_event, accountType: AccountType) => {
    return insertAccountType(accountType);
  });

  ipcMain.handle("db:editAccount", async (_event, account: Account) => {
    return editAccount(account);
  });

  // ============================================
  // CATEGORIES HANDLERS
  // ============================================

  ipcMain.handle("db:getCategories", async () => {
    return getCategories();
  });

  ipcMain.handle("db:getCategoryById", async (_event, id: number) => {
    return getCategoryById(id);
  });

  ipcMain.handle(
    "db:createCategory",
    async (_event, name: string, colorCode: string, icon: string) => {
      return createCategory(name, colorCode, icon);
    }
  );

  ipcMain.handle(
    "db:updateCategory",
    async (
      _event,
      id: number,
      name: string,
      colorCode: string,
      icon: string
    ) => {
      return updateCategory(id, name, colorCode, icon);
    }
  );

  ipcMain.handle("db:deleteCategory", async (_event, id: number) => {
    return deleteCategory(id);
  });

  // ============================================
  // TRANSACTIONS HANDLERS
  // ============================================

  ipcMain.handle(
    "db:getTransactions",
    async (_event, ledgerMonth?: LedgerMonth, limit?: number) => {
      return getTransactions(ledgerMonth, limit);
    }
  );

  ipcMain.handle("db:getTransactionById", async (_event, id: number) => {
    return getTransactionById(id);
  });

  ipcMain.handle(
    "db:createTransaction",
    async (_event, input: CreateTransactionInput) => {
      return createTransaction(input);
    }
  );

  ipcMain.handle(
    "db:updateTransaction",
    async (_event, id: number, input: Partial<CreateTransactionInput>) => {
      return updateTransaction(id, input);
    }
  );

  ipcMain.handle("db:deleteTransaction", async (_event, id: number) => {
    return deleteTransaction(id);
  });

  ipcMain.handle(
    "db:searchTransactions",
    async (_event, options: SearchOptions, limit?: number) => {
      return searchTransactions(options, limit);
    }
  );

  // ============================================
  // SYSTEM HANDLERS
  // ============================================

  ipcMain.handle("db:deleteAllDataFromTables", async () => {
    return deleteAllDataFromTables();
  });

  ipcMain.handle("system:getDbPath", async () => {
    return dbPath;
  });

  ipcMain.handle("system:openDbLocation", async () => {
    shell.showItemInFolder(dbPath);
  });

  ipcMain.handle("system:deleteDatabase", async () => {
    try {
      // Close the database connection first
      closeDb();

      // Delete the database file and related files
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
      if (fs.existsSync(dbPath + "-wal")) {
        fs.unlinkSync(dbPath + "-wal");
      }
      if (fs.existsSync(dbPath + "-shm")) {
        fs.unlinkSync(dbPath + "-shm");
      }

      console.log("[IPC] Database deleted.");
      return true;
    } catch (error) {
      console.error("[IPC] Failed to delete database:", error);
      return false;
    }
  });

  console.log("[IPC] All database handlers registered");
}

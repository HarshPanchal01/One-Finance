import { ipcMain, shell } from "electron";
import fs from "node:fs";
import {
  // Ledger Years
  getLedgerYears,
  createLedgerYear,
  deleteLedgerYear,
  // Ledger Periods
  getLedgerPeriods,
  getLedgerPeriodByYearMonth,
  createLedgerPeriod,
  getOrCreateCurrentPeriod,
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
  // Summary
  getPeriodSummary,
  getCategoryBreakdown,
  // Types
  type CreateTransactionInput,
  // DB paths and instance
  dbPath,
  closeDb,
} from "./db";

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

  ipcMain.handle("db:deleteLedgerYear", async (_event, year: number) => {
    return deleteLedgerYear(year);
  });

  // ============================================
  // LEDGER PERIODS HANDLERS
  // ============================================

  ipcMain.handle("db:getLedgerPeriods", async (_event, year?: number) => {
    return getLedgerPeriods(year);
  });

  ipcMain.handle(
    "db:getLedgerPeriodByYearMonth",
    async (_event, year: number, month: number) => {
      return getLedgerPeriodByYearMonth(year, month);
    }
  );

  ipcMain.handle(
    "db:createLedgerPeriod",
    async (_event, year: number, month: number) => {
      return createLedgerPeriod(year, month);
    }
  );

  ipcMain.handle("db:getOrCreateCurrentPeriod", async () => {
    return getOrCreateCurrentPeriod();
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
    async (_event, ledgerPeriodId?: number) => {
      return getTransactions(ledgerPeriodId);
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

  // ============================================
  // SUMMARY / DASHBOARD HANDLERS
  // ============================================

  ipcMain.handle(
    "db:getPeriodSummary",
    async (_event, ledgerPeriodId: number) => {
      return getPeriodSummary(ledgerPeriodId);
    }
  );

  ipcMain.handle(
    "db:getCategoryBreakdown",
    async (_event, ledgerPeriodId: number, type: "income" | "expense") => {
      return getCategoryBreakdown(ledgerPeriodId, type);
    }
  );

  // ============================================
  // SYSTEM HANDLERS
  // ============================================

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

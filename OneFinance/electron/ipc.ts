import { app, ipcMain } from "electron";
import {
  createCategory,
  createMonth,
  createTransaction,
  createYear,
  deleteCategory,
  deleteTransaction,
  getDbFilePath,
  listCategories,
  listTransactions,
  listTree,
  updateCategory,
  updateTransaction,
} from "./db";

function wrap<T>(
  fn: () => T
): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: fn() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export function registerIpcHandlers() {
  ipcMain.handle("app:getPaths", () =>
    wrap(() => ({
      userDataPath: app.getPath("userData"),
      dbFilePath: getDbFilePath(),
    }))
  );

  ipcMain.handle("ledger:listTree", () => wrap(() => listTree()));
  ipcMain.handle("ledger:createYear", (_event, year: number) =>
    wrap(() => createYear(year))
  );
  ipcMain.handle("ledger:createMonth", (_event, year: number, month: number) =>
    wrap(() => createMonth(year, month))
  );

  ipcMain.handle("categories:list", () => wrap(() => listCategories()));
  ipcMain.handle("categories:create", (_event, input) =>
    wrap(() => createCategory(input))
  );
  ipcMain.handle("categories:update", (_event, input) =>
    wrap(() => updateCategory(input))
  );
  ipcMain.handle("categories:delete", (_event, id: number) =>
    wrap(() => deleteCategory(id))
  );

  ipcMain.handle("transactions:list", (_event, ledgerPeriodId: number) =>
    wrap(() => listTransactions(ledgerPeriodId))
  );
  ipcMain.handle("transactions:create", (_event, input) =>
    wrap(() => createTransaction(input))
  );
  ipcMain.handle("transactions:update", (_event, input) =>
    wrap(() => updateTransaction(input))
  );
  ipcMain.handle("transactions:delete", (_event, id: number) =>
    wrap(() => deleteTransaction(id))
  );
}

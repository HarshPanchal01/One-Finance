import { app, ipcMain, shell } from "electron";
import path from "node:path";
import {
  createCategory,
  createMonth,
  createTransaction,
  createYear,
  deleteDbFile,
  deleteCategory,
  deleteYear,
  deleteTransaction,
  getDbFilePath,
  getSummary,
  listCategories,
  listRecentTransactions,
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
  ipcMain.handle("app:getInfo", () =>
    wrap(() => ({
      name: app.getName(),
      version: app.getVersion(),
      userDataPath: app.getPath("userData"),
      dbFilePath: getDbFilePath(),
    }))
  );

  ipcMain.handle("app:openDbFolder", () =>
    wrap(() => {
      const folder = path.dirname(getDbFilePath());
      void shell.openPath(folder);
      return { ok: true };
    })
  );

  ipcMain.handle("app:deleteDb", () =>
    wrap(() => {
      deleteDbFile();
      // In dev, relaunching breaks the electron-vite dev server session and can
      // result in a white window. Only relaunch for packaged apps.
      if (app.isPackaged) {
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 100);
      }
      return { ok: true };
    })
  );

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
  ipcMain.handle("ledger:deleteYear", (_event, year: number) =>
    wrap(() => deleteYear(year))
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
  ipcMain.handle("transactions:summary", () => wrap(() => getSummary()));
  ipcMain.handle("transactions:recent", (_event, limit?: number) =>
    wrap(() => listRecentTransactions(typeof limit === "number" ? limit : 8))
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

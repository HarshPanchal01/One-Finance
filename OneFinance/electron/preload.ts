import { ipcRenderer, contextBridge } from "electron";

type IpcOk<T> = { ok: true; data: T };
type IpcErr = { ok: false; error: string };

async function invokeOrThrow<T>(
  channel: string,
  ...args: unknown[]
): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, ...args)) as
    | IpcOk<T>
    | IpcErr;
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

contextBridge.exposeInMainWorld("oneFinance", {
  app: {
    getPaths: () => invokeOrThrow("app:getPaths"),
  },
  ledger: {
    listTree: () => invokeOrThrow("ledger:listTree"),
    createYear: (year: number) => invokeOrThrow("ledger:createYear", year),
    createMonth: (year: number, month: number) =>
      invokeOrThrow("ledger:createMonth", year, month),
  },
  categories: {
    list: () => invokeOrThrow("categories:list"),
    create: (input: {
      name: string;
      colorCode?: string | null;
      icon?: string | null;
    }) => invokeOrThrow("categories:create", input),
    update: (input: {
      id: number;
      name: string;
      colorCode?: string | null;
      icon?: string | null;
    }) => invokeOrThrow("categories:update", input),
    delete: (id: number) => invokeOrThrow("categories:delete", id),
  },
  transactions: {
    list: (ledgerPeriodId: number) =>
      invokeOrThrow("transactions:list", ledgerPeriodId),
    create: (input: {
      ledgerPeriodId: number;
      title: string;
      amount: number;
      date: string;
      type: "income" | "expense";
      notes?: string | null;
      categoryId?: number | null;
    }) => invokeOrThrow("transactions:create", input),
    update: (input: {
      id: number;
      ledgerPeriodId: number;
      title: string;
      amount: number;
      date: string;
      type: "income" | "expense";
      notes?: string | null;
      categoryId?: number | null;
    }) => invokeOrThrow("transactions:update", input),
    delete: (id: number) => invokeOrThrow("transactions:delete", id),
  },
});

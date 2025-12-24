/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  oneFinance: {
    app: {
      getPaths: () => Promise<{ userDataPath: string; dbFilePath: string }>;
    };
    ledger: {
      listTree: () => Promise<
        Array<{
          year: number;
          months: Array<{ id: number; year: number; month: number }>;
        }>
      >;
      createYear: (year: number) => Promise<{ year: number }>;
      createMonth: (
        year: number,
        month: number
      ) => Promise<{ id: number; year: number; month: number }>;
    };
    categories: {
      list: () => Promise<
        Array<{
          id: number;
          name: string;
          colorCode: string | null;
          icon: string | null;
        }>
      >;
      create: (input: {
        name: string;
        colorCode?: string | null;
        icon?: string | null;
      }) => Promise<{
        id: number;
        name: string;
        colorCode: string | null;
        icon: string | null;
      }>;
      update: (input: {
        id: number;
        name: string;
        colorCode?: string | null;
        icon?: string | null;
      }) => Promise<{
        id: number;
        name: string;
        colorCode: string | null;
        icon: string | null;
      }>;
      delete: (id: number) => Promise<{ ok: true }>;
    };
    transactions: {
      list: (ledgerPeriodId: number) => Promise<
        Array<{
          id: number;
          ledgerPeriodId: number;
          title: string;
          amount: number;
          date: string;
          type: "income" | "expense";
          notes: string | null;
          categoryId: number | null;
          categoryName: string | null;
        }>
      >;
      create: (input: {
        ledgerPeriodId: number;
        title: string;
        amount: number;
        date: string;
        type: "income" | "expense";
        notes?: string | null;
        categoryId?: number | null;
      }) => Promise<{ id: number }>;
      update: (input: {
        id: number;
        ledgerPeriodId: number;
        title: string;
        amount: number;
        date: string;
        type: "income" | "expense";
        notes?: string | null;
        categoryId?: number | null;
      }) => Promise<{ ok: true }>;
      delete: (id: number) => Promise<{ ok: true }>;
    };
  };
}

import type { Category, LedgerYearNode, Transaction } from "../types";

export const oneFinanceApi = {
  app: {
    getPaths: () => window.oneFinance.app.getPaths(),
  },
  ledger: {
    listTree: (): Promise<LedgerYearNode[]> =>
      window.oneFinance.ledger.listTree(),
    createYear: (year: number) => window.oneFinance.ledger.createYear(year),
    createMonth: (year: number, month: number) =>
      window.oneFinance.ledger.createMonth(year, month),
  },
  categories: {
    list: (): Promise<Category[]> => window.oneFinance.categories.list(),
    create: (input: { name: string }) =>
      window.oneFinance.categories.create(input),
    update: (input: { id: number; name: string }) =>
      window.oneFinance.categories.update(input),
    delete: (id: number) => window.oneFinance.categories.delete(id),
  },
  transactions: {
    list: (ledgerPeriodId: number): Promise<Transaction[]> =>
      window.oneFinance.transactions.list(ledgerPeriodId),
    create: (input: {
      ledgerPeriodId: number;
      title: string;
      amount: number;
      date: string;
      type: "income" | "expense";
      notes?: string | null;
      categoryId?: number | null;
    }) => window.oneFinance.transactions.create(input),
    update: (input: {
      id: number;
      ledgerPeriodId: number;
      title: string;
      amount: number;
      date: string;
      type: "income" | "expense";
      notes?: string | null;
      categoryId?: number | null;
    }) => window.oneFinance.transactions.update(input),
    delete: (id: number) => window.oneFinance.transactions.delete(id),
  },
};

export type TransactionType = "income" | "expense";

export interface LedgerPeriod {
  id: number;
  year: number;
  month: number;
}

export interface LedgerYearNode {
  year: number;
  months: LedgerPeriod[];
}

export interface Category {
  id: number;
  name: string;
  colorCode: string | null;
  icon: string | null;
}

export interface Transaction {
  id: number;
  ledgerPeriodId: number;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  notes: string | null;
  categoryId: number | null;
  categoryName: string | null;
}

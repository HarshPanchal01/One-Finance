export interface LedgerMonth{
  month: number;
  year: number;
}

export interface Category {
  id: number;
  name: string;
  colorCode: string;
  icon: string;
}

export interface AccountType{
  id: number
  type: string
}

export interface Account{
  id: number
  accountName: string
  institutionName?: string
  startingBalance: number
  balance?: number
  accountTypeId: number
  isDefault: boolean
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
  accountId: number;
}

export interface TransactionWithCategory extends Transaction {
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
}

export interface CreateTransactionInput {
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  notes?: string
  categoryId?: number
  accountId: number
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
  accountIds?: number[];
  fromDate?: string | null;
  toDate?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  type?: "income" | "expense" | null;
}

// Utility Functions

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

export function getMonthName(month: number): string {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1] || "";
}
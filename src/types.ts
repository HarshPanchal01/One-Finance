// ============================================
// Shared Types for One Finance
// These mirror the types in electron/preload.ts
// ============================================

export interface LedgerPeriod {
  id: number
  year: number
  month: number
}

export interface Category {
  id: number
  name: string
  colorCode: string
  icon: string
}

export interface Transaction {
  id: number
  ledgerPeriodId: number
  title: string
  amount: number
  date: string
  type: 'income' | 'expense'
  notes: string | null
  categoryId: number | null
}

export interface TransactionWithCategory extends Transaction {
  categoryName: string | null
  categoryColor: string | null
  categoryIcon: string | null
}

export interface CreateTransactionInput {
  ledgerPeriodId: number
  title: string
  amount: number
  date: string
  type: 'income' | 'expense'
  notes?: string
  categoryId?: number
}

export interface PeriodSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
}

export interface SearchOptions {
  text?: string;
  categoryIds?: number[];
  fromDate?: string | null;
  toDate?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  type?: "income" | "expense" | null;
}

export interface CategoryBreakdown {
  categoryId: number | null
  categoryName: string
  categoryColor: string
  categoryIcon: string
  total: number
  count: number
}

// Helper type for month names
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

export type MonthName = typeof MONTH_NAMES[number]

// Format helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function getMonthName(month: number): MonthName {
  return MONTH_NAMES[month - 1]
}

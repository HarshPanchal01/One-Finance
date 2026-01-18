import { Account, AccountType, Category, TransactionWithCategory, CategoryBreakdown } from "@/types";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}

export function isValidHexColor(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

export function verifyImportData(data: {
  accounts?: Account[],
  transactions?: TransactionWithCategory[],
  categories?: Category[],
  accountTypes?: AccountType[],
  ledgerYears?: number[]
}): boolean {
  try {
    const accounts = data.accounts;
    const transactions = data.transactions;
    const categories = data.categories;
    const accountTypes = data.accountTypes;
    const ledgerYears = data.ledgerYears;

    if (accounts == undefined || transactions == undefined || categories == undefined || accountTypes == undefined || ledgerYears == undefined) {
      return false;
    }

    let forEachResult = true;

    accounts.forEach((value) => {
      // Accounts essentials
      if (value.accountName == undefined || value.accountTypeId == undefined || value.id == undefined || value.startingBalance == undefined || value.isDefault == undefined) {
        forEachResult = false;
        return;
      }

      // Check if account type id is values
      if (accountTypes.find((accountTypeValue) => accountTypeValue.id === value.accountTypeId) == undefined) {
        forEachResult = false;
        return;
      }
    });

    transactions.forEach((value) => {
      // Check for transaction essentials
      if (
        value.id == undefined ||
        value.title == undefined ||
        value.amount == undefined ||
        value.date == undefined ||
        value.type == undefined ||
        value.accountId == undefined
      ) {
        forEachResult = false;
        return;
      }

      // Check if category provided in transaction is valid
      if (value.categoryId != undefined) {
        if (value.categoryName == undefined || value.categoryColor == undefined || value.categoryIcon == undefined) {
          forEachResult = false;
          return;
        }
        if (categories.find((categoryValue) => categoryValue.id === value.categoryId) == undefined) {
          forEachResult = false;
          return;
        }
        if (!isValidHexColor(value.categoryColor)) {
          forEachResult = false;
          return;
        }
      }

      // Check if account provided in transaction is valid
      if (accounts.find((accountValue) => accountValue.id === value.accountId) == undefined) {
        forEachResult = false;
        return;
      }
    });

    accountTypes.forEach((value) => {
      if (value.id == undefined || value.type == undefined) {
        forEachResult = false;
        return;
      }
    });

    categories.forEach((value) => {
      if (value.id == undefined || value.name == undefined || value.colorCode == undefined || value.icon == undefined) {
        forEachResult = false;
        return;
      }
      if (!isValidHexColor(value.colorCode)) {
        forEachResult = false;
        return;
      }
    });

    ledgerYears.forEach((value) => {
      if (value == undefined) {
        forEachResult = false;
        return;
      }
    });

    return forEachResult;
  } catch (e) {
    console.log(`Error verifying import data ${e}`);
    return false;
  }
}

export function getDateRange(range: string, transactions?: TransactionWithCategory[], customRange?: DateRange): DateRange {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  
  // Default end date is end of today unless specified otherwise
  endDate.setHours(23, 59, 59, 999);

  if ((range === 'custom' || range === 'custom_edit') && customRange) {
    startDate = new Date(customRange.startDate);
    endDate = new Date(customRange.endDate);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'last3Months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'last6Months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'lastYear') {
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear() - 1, 11, 31);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'thisYear') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'ytd') {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else if (range === 'allTime') {
    startDate = new Date(0); 
    
    if (transactions && transactions.length > 0) {
      const newestTx = transactions[0];
      const oldestTx = transactions[transactions.length - 1];
      
      const [oy, om, od] = oldestTx.date.split('-').map(Number);
      startDate = new Date(oy, om - 1, od);

      const [ny, nm, nd] = newestTx.date.split('-').map(Number);
      const potentialEndDate = new Date(ny, nm - 1, nd);
      
      if (potentialEndDate > now) {
        endDate = potentialEndDate;
      }
      // Ensure endDate covers the full day of the last transaction
      endDate.setHours(23, 59, 59, 999);
    }
  }

  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate };
}

export function getMetricsForRange(range: string, transactions: TransactionWithCategory[], customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(range, transactions, customRange);
  
  // Calculate total days in range for average calculation
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  let daysDivisor = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (daysDivisor === 0) daysDivisor = 1;

  const filtered = transactions.filter(t => {
    const [y, m, d] = t.date.split('-').map(Number);
    const tDate = new Date(y, m - 1, d);
    return tDate >= startDate && tDate <= endDate;
  });

  const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, days: daysDivisor };
}

export function getExpenseBreakdownForRange(range: string, transactions: TransactionWithCategory[], customRange?: DateRange): CategoryBreakdown[] {
  const { startDate, endDate } = getDateRange(range, transactions, customRange);

  const filtered = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const [y, m, d] = t.date.split('-').map(Number);
    const tDate = new Date(y, m - 1, d);
    return tDate >= startDate && tDate <= endDate;
  });

  const breakdownMap = new Map<number, CategoryBreakdown>();

  for (const t of filtered) {
    const catId = t.categoryId || 0;
    const entry = breakdownMap.get(catId);
    if (entry) {
      entry.total += t.amount;
      entry.count += 1;
    } else {
      breakdownMap.set(catId, {
        categoryId: t.categoryId,
        categoryName: t.categoryName || 'Uncategorized',
        categoryColor: t.categoryColor || '#9ca3af',
        categoryIcon: t.categoryIcon || 'pi-tag',
        total: t.amount,
        count: 1
      });
    }
  }

  return Array.from(breakdownMap.values()).sort((a, b) => b.total - a.total);
}

function formatCustomDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const y = date.getFullYear();
  const m = months[date.getMonth()];
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}-${y}`;
}

export function getTimeRangeLabel(range: string, customRange?: DateRange): string {
  switch (range) {
    case 'thisMonth': return 'this month';
    case 'last3Months': return 'last 3 months';
    case 'last6Months': return 'last 6 months';
    case 'lastYear': return 'last year';
    case 'thisYear': return 'this year (projected)';
    case 'ytd': return 'last 12 months (YTD)';
    case 'allTime': return 'all time history';
    case 'custom':
    case 'custom_edit': 
      if (customRange) {
        return `custom range (${formatCustomDate(customRange.startDate)} to ${formatCustomDate(customRange.endDate)})`;
      }
      return 'custom range';
    default: return '';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCustomRangeObj(dateRange: any): DateRange | undefined {
  if (Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
    return { startDate: dateRange[0], endDate: dateRange[1] };
  }
  return undefined;
}

export function calculateSavingsRate(income: number, expense: number): number {
  if (income === 0) return 0;
  return ((income - expense) / income) * 100;
}

export function calculateAvgDailySpend(expense: number, days: number): number {
  if (days === 0) return 0;
  return expense / days;
}

export function calculateNetCashFlow(income: number, expense: number): number {
  return income - expense;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPacingLabel(date: any, defaultLabel: string): string {
  if (!date) return defaultLabel;
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function getMonthStr(date: Date): string {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
}
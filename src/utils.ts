import { Account, AccountType, Category, TransactionWithCategory, CategoryBreakdown } from "@/types";

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

export function getMetricsForRange(range: string, transactions: TransactionWithCategory[]) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let daysDivisor = 1;

  if (range === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    daysDivisor = endDate.getDate();
  } else if (range === 'last3Months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    daysDivisor = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (range === 'last6Months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    daysDivisor = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (range === 'lastYear') {
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear() - 1, 11, 31);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    daysDivisor = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (range === 'thisYear') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
    // Calculate days in current year
    const startNextYear = new Date(now.getFullYear() + 1, 0, 1);
    daysDivisor = Math.ceil((startNextYear.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  } else if (range === 'ytd') {
    // User defined YTD as Rolling Year (e.g. Feb 2026 to Feb 2025)
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    daysDivisor = 365;
  } else if (range === 'allTime') {
    if (transactions.length === 0) return { income: 0, expense: 0, days: 1 };
    // Assuming transactions are sorted descending (newest first)
    const oldestTx = transactions[transactions.length - 1];
    const newestTx = transactions[0];
    
    startDate = new Date(oldestTx.date);
    const potentialEndDate = new Date(newestTx.date);
    
    // If newest transaction is in the future compared to now, extend endDate
    if (potentialEndDate > now) {
      endDate = potentialEndDate;
    }
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    daysDivisor = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysDivisor === 0) daysDivisor = 1;
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const filtered = transactions.filter(t => {
    const [y, m, d] = t.date.split('-').map(Number);
    const tDate = new Date(y, m - 1, d);
    return tDate >= startDate && tDate <= endDate;
  });

  const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, days: daysDivisor };
}

export function getExpenseBreakdownForRange(range: string, transactions: TransactionWithCategory[]): CategoryBreakdown[] {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (range === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (range === 'last3Months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (range === 'last6Months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (range === 'lastYear') {
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear() - 1, 11, 31);
  } else if (range === 'thisYear') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  } else if (range === 'ytd') {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else if (range === 'allTime') {
    if (transactions.length === 0) return [];
    const oldestTx = transactions[transactions.length - 1];
    startDate = new Date(oldestTx.date);
    
    const newestTx = transactions[0];
    const potentialEndDate = new Date(newestTx.date);
    if (potentialEndDate > now) {
      endDate = potentialEndDate;
    }
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

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

export function getTimeRangeLabel(range: string): string {
  switch (range) {
    case 'thisMonth': return 'this month';
    case 'last3Months': return 'last 3 months';
    case 'last6Months': return 'last 6 months';
    case 'lastYear': return 'last year';
    case 'thisYear': return 'this year (projected)';
    case 'ytd': return 'last 12 months (YTD)';
    case 'allTime': return 'all time history';
    default: return '';
  }
}
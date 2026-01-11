import { Account, AccountType, Category, TransactionWithCategory } from "@/types";

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
}): boolean 
{

  try{
    const accounts = data.accounts;
    const transactions = data.transactions;
    const categories = data.categories;
    const accountTypes = data.accountTypes;
    const ledgerYears = data.ledgerYears;

    if (accounts == undefined || transactions == undefined || categories == undefined || accountTypes == undefined || ledgerYears == undefined){
      return false
    }

    let forEachResult = true;
    
    accounts.forEach((value) => {

      // Accounts essentials
      if (value.accountName == undefined || value.accountTypeId == undefined || value.id == undefined || value.startingBalance == undefined || value.isDefault == undefined){
        forEachResult = false;
        return;
      }

      // Check if account type id is values
      if (accountTypes.find((accountTypeValue) => accountTypeValue.id === value.accountTypeId) == undefined){
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
      ){
        forEachResult = false;
        return;
      }

      // Check if category provided in transaction is valid
      if (value.categoryId != undefined){
        if (value.categoryName == undefined || value.categoryColor == undefined || value.categoryIcon == undefined){
          forEachResult = false;
          return;
        }
        if (categories.find((categoryValue) => categoryValue.id === value.categoryId) == undefined){
          forEachResult = false;
          return;
        }
        if (!isValidHexColor(value.categoryColor)){
          forEachResult = false;
          return;
        }
      }

      // Check if account provided in transaction is valid
      if (accounts.find((accountValue) => accountValue.id === value.accountId) == undefined){
        forEachResult = false;
        return;
      }

    });

    accountTypes.forEach((value) => {
      if (value.id == undefined || value.type == undefined){
        forEachResult = false;
        return;
      }
    });

    categories.forEach((value) => {
      if (value.id == undefined || value.name == undefined || value.colorCode == undefined || value.icon == undefined){
        forEachResult = false;
        return;
      }
      if (!isValidHexColor(value.colorCode)){
        forEachResult = false;
        return;
      }
    });

    ledgerYears.forEach((value) => {
      if (value == undefined){
        forEachResult = false;
        return;
      }
    });

    return forEachResult;
  } catch(e){
    console.log(`Error verifying import data ${e}`)
    return false;
  }
}

export function getMetricsForRange(range: string, transactions: TransactionWithCategory[]) {
  const now = new Date();
  let startDate = new Date();
  let daysDivisor = 1;

  if (range === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      daysDivisor = now.getDate();
  } else if (range === 'last3Months') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 90);
      daysDivisor = 90;
  } else if (range === 'last6Months') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 180);
      daysDivisor = 180;
  } else if (range === 'lastYear') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 365);
      daysDivisor = 365;
  } else if (range === 'allTime') {
      if (transactions.length === 0) return { income: 0, expense: 0, days: 1 };
      const lastTx = transactions[transactions.length - 1];
      const firstDateStr = lastTx.date;
      startDate = new Date(firstDateStr);
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      daysDivisor = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (daysDivisor === 0) daysDivisor = 1;
  }

  startDate.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 999);

  const filtered = transactions.filter(t => {
      const [y, m, d] = t.date.split('-').map(Number);
      const tDate = new Date(y, m - 1, d);
      return tDate >= startDate && tDate <= now;
  });

  const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, days: daysDivisor };
}

export function getTimeRangeLabel(range: string): string {
    switch(range) {
        case 'thisMonth': return 'elapsed days (Month)';
        case 'last3Months': return 'last 3 months';
        case 'last6Months': return 'last 6 months';
        case 'lastYear': return 'last year';
        case 'allTime': return 'all time history';
        default: return '';
    }
}
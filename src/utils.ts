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


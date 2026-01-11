import { defineStore } from "pinia";
import { ref, computed, toRaw } from "vue";
import type {
  Category,
  Account,
  AccountType,
  TransactionWithCategory,
  CreateTransactionInput,
  PeriodSummary,
  CategoryBreakdown,
  SearchOptions,
  MonthlyTrend,
  DailyTransactionSum,
  LedgerMonth,
} from "@/types";

export const useFinanceStore = defineStore("finance", () => {
  // ============================================
  // STATE
  // ============================================

  // Current period selection
  const currentLedgerMonth = ref<LedgerMonth | null>(null);
  const selectedYear = ref<number | null>(null);
  const ledgerYears = ref<number[]>([]);
  const ledgerMonths = ref<LedgerMonth[]>([]);

  // Categories
  const categories = ref<Category[]>([]);

  // Accounts
  const accounts = ref<Account[]>([]);

  // AccountTypes
  const accountTypes = ref<AccountType[]>([]);

  // Transactions for current period (or Global if null)
  const transactions = ref<TransactionWithCategory[]>([]);
  // Global recent transactions (always Global)
  const recentTransactions = ref<TransactionWithCategory[]>([]);
  // Search results
  const searchResults = ref<TransactionWithCategory[]>([]);
  const isSearching = ref(false);

  // Summary data - always have default values
  const periodSummary = ref<PeriodSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0,
  });
  const incomeBreakdown = ref<CategoryBreakdown[]>([]);
  const expenseBreakdown = ref<CategoryBreakdown[]>([]);
  const monthlyTrends = ref<MonthlyTrend[]>([]);
  const pacingTrends = ref<{
    currentMonth: DailyTransactionSum[];
    previousAverage: DailyTransactionSum[];
  }>({ currentMonth: [], previousAverage: [] });

  // Loading states - separate for initial load vs period changes
  const isLoading = ref(true); // Initial load
  const isChangingPeriod = ref(false); // Period changes (doesn't hide UI)
  const error = ref<string | null>(null);

  // ============================================
  // GETTERS (Computed)
  // ============================================

  const hasCurrentPeriod = computed(() => currentLedgerMonth.value !== null);

  const incomeTransactions = computed(() =>
    transactions.value.filter((t) => t.type === "income")
  );

  const expenseTransactions = computed(() =>
    transactions.value.filter((t) => t.type === "expense")
  );

  // ============================================
  // ACTIONS - Initialization
  // ============================================

  async function initialize() {
    console.log("[Store] initialize() called");
    isLoading.value = true;
    error.value = null;

    try {
      // Load categories first (they're always needed)
      await fetchCategories();
      console.log("[Store] Categories loaded:", categories.value.length);

      // Load accounts they are always needed
      await fetchAccounts();
      await fetchAccountTypes();

      console.log("[Store] Accounts loaded:", accounts.value.length);
      console.log("[Store] AccountTypes loaded:", accountTypes.value.length);

      // Load years and periods
      ledgerYears.value = await window.electronAPI.getLedgerYears();

      //const ledgerPeriodsList: LedgerPeriod[] = [];
      for (const year of ledgerYears.value) {
        createLedgerPeriodSync(year);
      }

      //ledgerPeriods.value = ledgerPeriodsList;

      console.log(
        "[Store] Years:",
        ledgerYears.value,
        "Periods:",
        ledgerMonths.value.length
      );

      // Default to Global View (no current period)
      await clearPeriod();

    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to initialize";
      console.error("[Store] Initialization error:", e);
    } finally {
      isLoading.value = false;
      console.log(
        "[Store] Initialization complete, isLoading:",
        isLoading.value
      );
    }
  }

  // ============================================
  // ACTIONS - Period Management
  // ============================================

  function createLedgerPeriodSync(year: number){
    for (let month = 1; month <= 12; month++) {
      const period = {month, year};

      //Prevents duplicates when rebuilding UI (UI bug when running developer mode, not sure if it happens in production though)
      if (ledgerMonths.value.filter((value) => value.month === month && value.year === year).length > 0){
        continue;
      }

      ledgerMonths.value.push(period);
    }
  }

  function deleteLedgerPeriodsByYearSync(year: number){
    ledgerMonths.value = ledgerMonths.value.filter((item) => item.year !== year);
  }


  function fetchTransactionsForPeriodSync(year: number, month: number){
    transactions.value = transactions.value.filter((value) => {
      const strDate = value.date;
      const dateList = strDate.split("-");
      const dateYear = Number(dateList.at(0));
      const dateMonth = Number(dateList.at(1));

      return dateMonth === month && dateYear === year;
    });
  }

  function fetchPeriodSummarySync(){
    // periodSummary
    // incomeBreakdown
    // expenseBreakdown

    const transactionsByIncome = toRaw(transactions.value).filter((value) => value.type === "income");
    const transactionsByExpense = toRaw(transactions.value).filter((value) => value.type === "expense");

    const transactionsIncomeSum = transactionsByIncome.reduce((sum, currentValue) => sum + currentValue.amount, 0);
    const transactionsExpenseSum = transactionsByExpense.reduce((sum, currentValue) => sum + currentValue.amount, 0);

    const incomeCategoryBreakdown = new Map<number, CategoryBreakdown>();
    const expenseCategoryBreakdown = new Map<number, CategoryBreakdown>();

    for(const income of transactionsByIncome){

      const entry = incomeCategoryBreakdown.get(income.id);

      if (entry !== undefined) {
        entry.count += 1;
        entry.total += income.amount;
      } 
      else{

        if (income.categoryId == undefined || income.categoryName == undefined || income.categoryColor == undefined || income.categoryIcon == undefined) {continue}

        incomeCategoryBreakdown.set(income.categoryId, 
          { categoryId: income.categoryId,
            categoryName: income.categoryName,
            categoryColor: income.categoryColor,
            categoryIcon: income.categoryIcon,
            total: income.amount,
            count: 1
        });
      }
    }


    for(const expense of transactionsByExpense){


      if (expense.categoryId == undefined) {
        continue
      }

      const entry = expenseCategoryBreakdown.get(expense.categoryId);
      if (entry != undefined) {
        entry.count += 1;
        entry.total += expense.amount;

        expenseCategoryBreakdown.set(expense.categoryId, entry);
      }
      else {

        if (expense.categoryId == undefined || expense.categoryName == undefined || expense.categoryColor == undefined || expense.categoryIcon == undefined) {
          continue
        }

        expenseCategoryBreakdown.set(expense.categoryId, 
          { categoryId: expense.categoryId,
            categoryName: expense.categoryName,
            categoryColor: expense.categoryColor,
            categoryIcon: expense.categoryIcon,
            total: expense.amount,
            count: 1
        });
      }
    }

    periodSummary.value.balance = transactionsIncomeSum - transactionsExpenseSum;
    periodSummary.value.totalExpenses = transactionsExpenseSum;
    periodSummary.value.totalIncome = transactionsIncomeSum;

    incomeBreakdown.value = Array.from(incomeCategoryBreakdown.values());
    expenseBreakdown.value = Array.from(expenseCategoryBreakdown.values());


  }

  async function createYear(year: number) {
    await window.electronAPI.createLedgerYear(year);
    createLedgerPeriodSync(year);
    // Auto-create all 12 months for the year
    ledgerYears.value = await window.electronAPI.getLedgerYears();
  }

  async function deleteYear(year: number, deleteTransactions: boolean = false) {
    await window.electronAPI.deleteLedgerYear(year, deleteTransactions);
    deleteLedgerPeriodsByYearSync(year);
    ledgerYears.value = await window.electronAPI.getLedgerYears();
    //ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();

    // If deleted current period's year, reset to Global
    if (currentLedgerMonth.value?.year === year) {
      await clearPeriod();
    }
  }

  async function selectYear(year: number) {
    console.log(`[Store] selectYear called: ${year}`);
    isChangingPeriod.value = true;
    error.value = null;

    try {
      currentLedgerMonth.value = null;
      selectedYear.value = year;

      // Fetch data for the selected year
      await fetchTransactions(null, year);
      fetchPeriodSummarySync();
      await fetchMonthlyTrends(year);

      console.log(`[Store] Year data fetched`);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to select year";
      console.error("[Store] Select year error:", e);
    } finally {
      isChangingPeriod.value = false;
    }
  }

  async function selectPeriod(year: number, month: number) {
    console.log(`[Store] selectPeriod called: ${year}-${month}`);
    isChangingPeriod.value = true;
    error.value = null;

    try {
      currentLedgerMonth.value = {year: year, month: month};
      console.log(`[Store] currentPeriod set to:`, currentLedgerMonth.value);

      // Refresh periods list in case a new one was created
      //ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();

      // Fetch data for the selected period
      if (currentLedgerMonth.value) {
        fetchTransactionsForPeriodSync(year, month);
        fetchPeriodSummarySync();
      }

      console.log(`[Store] Period data fetched`);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to select period";
      console.error("[Store] Select period error:", e);
    } finally {
      isChangingPeriod.value = false;
    }
  }

  async function clearPeriod() {
    console.log("[Store] clearPeriod called (Global Mode)");
    isChangingPeriod.value = true;
    currentLedgerMonth.value = null;
    selectedYear.value = null;

    try {
      // Fetch Global Data
      await fetchRecentTransactions(5); // Ensure recent list is up to date
      await fetchTransactions(); // All transactions
      await fetchPeriodSummarySync(); // Global summary
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to load global data";
      console.error("[Store] Clear period error:", e);
    } finally {
      isChangingPeriod.value = false;
    }
  }

  // ============================================
  // ACTIONS - Accounts
  // ============================================

  async function fetchAccounts(){
    const accountsRaw = await window.electronAPI.getAccounts();
    const transactionsRaw = await window.electronAPI.getTransactions();

    accountsRaw.forEach(account => {
      const accountTransactions = transactionsRaw.filter(t => t.accountId === account.id);
      const transactionSum = accountTransactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
      }, 0);
      account.balance = account.startingBalance + transactionSum;
    });

    accounts.value = accountsRaw;

  }

  async function fetchAccountTypes(){
    accountTypes.value = await window.electronAPI.getAccountTypes();
  }

  async function addAccount(account: Account): Promise<number|null>{
    return await window.electronAPI.insertAccount(account);
  }

  async function addAccountType(accountType: AccountType): Promise<number|null>{
    return await window.electronAPI.insertAccountType(accountType);
  }

  async function editAccount(account: Account){
    await window.electronAPI.editAccount(account);
  }

  async function removeAccount(id: number, strategy: 'transfer' | 'delete', transferToAccountId?: number){
    await window.electronAPI.deleteAccountById(id, strategy, transferToAccountId);
  }

  // ============================================
  // ACTIONS - Categories
  // ============================================

  async function fetchCategories() {
    categories.value = await window.electronAPI.getCategories();
  }

  async function addCategory(name: string, colorCode: string, icon: string) {
    const newCategory = await window.electronAPI.createCategory(
      name,
      colorCode,
      icon
    );
    categories.value.push(newCategory);
    return newCategory;
  }

  async function editCategory(
    id: number,
    name: string,
    colorCode: string,
    icon: string
  ) {
    const updated = await window.electronAPI.updateCategory(
      id,
      name,
      colorCode,
      icon
    );
    if (updated) {
      const index = categories.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        categories.value[index] = updated;
      }
    }
    return updated;
  }

  async function removeCategory(id: number) {
    const success = await window.electronAPI.deleteCategory(id);
    if (success) {
      categories.value = categories.value.filter((c) => c.id !== id);
    }
    return success;
  }

  // ============================================
  // ACTIONS - Transactions
  // ============================================

  async function fetchTransactions(ledgerMonth?: LedgerMonth | null, yearOnly?: number) {

    let result = await window.electronAPI.getTransactions(ledgerMonth);

    if (yearOnly && !ledgerMonth) {
      result = result.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === yearOnly;
      });
    }

    console.log(`[Store] Fetched ${result.length} transactions`);

    transactions.value = result;
  }

  async function fetchRecentTransactions(limit: number) {
    recentTransactions.value = await window.electronAPI.getTransactions(
      null,
      limit
    );
  }

  async function addTransaction(transaction: CreateTransactionInput
    
  ) {

    const newTransaction = await window.electronAPI.createTransaction(
      transaction,
    );

    const targetPeriodDate = transaction.date.split("-");
    const targetPeriodMonth = Number(targetPeriodDate.at(1));


    // Refresh Data
    await fetchRecentTransactions(5);

    // Only update main list if it matches current filter (Global or Specific Period)
    if (!currentLedgerMonth.value || currentLedgerMonth.value.month === targetPeriodMonth) {
        // Add to front if valid
        transactions.value.unshift(newTransaction);
        // Refresh summary
        fetchPeriodSummarySync();
    }

    return newTransaction;
  }

  async function editTransaction(
    id: number,
    input: Partial<CreateTransactionInput>
  ) {
    // If date is changing, we MUST ensure the ledgerPeriodId is updated to match
    const updateInput = { ...input };
    
    // Logic for ledgerPeriodId is removed as it's no longer manually managed or required in input

    const updated = await window.electronAPI.updateTransaction(id, updateInput);
    if (updated) {
      const index = transactions.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        // If the date changed such that it moves out of the current view (if period specific),
        // we might want to remove it. But for simplicity, we just update it in place or re-fetch.
        // Re-fetching is safer.
        if (currentLedgerMonth.value) {
            // Check if it still belongs?
            // Easier to just re-fetch the list to be safe
             await fetchTransactions(toRaw(currentLedgerMonth.value));
        } else {
             // Global mode, just update
             transactions.value[index] = updated;
        }
      }
      await fetchRecentTransactions(5); // Update dashboard list
      await fetchPeriodSummarySync(); // Refresh summary
    }
    return updated;
  }

  async function removeTransaction(id: number) {
    const success = await window.electronAPI.deleteTransaction(id);
    if (success) {
      transactions.value = transactions.value.filter((t) => t.id !== id);
      await fetchRecentTransactions(5); // Update dashboard list
      await fetchPeriodSummarySync(); // Refresh summary
      
      // Also remove from search results if present
      if (isSearching.value) {
        searchResults.value = searchResults.value.filter((t) => t.id !== id);
      }
      // Refresh trends
      const yearToRefresh = currentLedgerMonth.value ? currentLedgerMonth.value.year : (selectedYear.value || new Date().getFullYear());
      await fetchMonthlyTrends(yearToRefresh);
    }
    return success;
  }

  async function searchTransactions(options: SearchOptions) {
    // If no criteria provided, clear search
    const hasCriteria = 
      (options.text && options.text.trim()) || 
      (options.categoryIds && options.categoryIds.length > 0) ||
      (options.accountIds && options.accountIds.length > 0) ||
      options.fromDate || 
      options.toDate ||
      options.minAmount ||
      options.maxAmount ||
      options.type;

    if (!hasCriteria) {
      isSearching.value = false;
      searchResults.value = [];
      return;
    }
    
    isSearching.value = true;
    try {
      searchResults.value = await window.electronAPI.searchTransactions(options);
    } catch (e) {
      console.error("[Store] Search error:", e);
      error.value = "Failed to search transactions";
    }
  }

  function clearSearch() {
    isSearching.value = false;
    searchResults.value = [];
  }

  // ============================================
  // ACTIONS - Summary / Dashboard
  // ============================================

  // async function fetchPeriodSummary() {
  //   const periodId = currentPeriod.value?.id || null; // null = Global

  //   const summary = await window.electronAPI.getPeriodSummary(periodId);

  //   periodSummary.value = summary || {
  //     totalIncome: 0,
  //     totalExpenses: 0,
  //     balance: 0,
  //     transactionCount: 0,
  //   };

  //   incomeBreakdown.value = await window.electronAPI.getCategoryBreakdown(
  //     periodId,
  //     "income"
  //   );
  //   expenseBreakdown.value = await window.electronAPI.getCategoryBreakdown(
  //     periodId,
  //     "expense"
  //   );
  // }

  async function fetchMonthlyTrends(year: number) {
    try {
      monthlyTrends.value = await window.electronAPI.getMonthlyTrends(year);
    } catch (e) {
      console.error("[Store] Failed to fetch monthly trends:", e);
      // Don't break the UI, just empty trends
      monthlyTrends.value = [];
    }
  }

  async function fetchPacingTrends() {
    try {
      // Determine the reference month/year
      let year, month;
      if (currentLedgerMonth.value) {
        year = currentLedgerMonth.value.year;
        month = currentLedgerMonth.value.month;
      } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
      }

      // 1. Fetch Current Month Daily Spend
      const currentMonthData = await window.electronAPI.getDailyTransactionSum(year, month, 'expense');

      // 2. Fetch Previous 3 Months and Calculate Average
      // We need to handle year rollover (e.g., if current is Jan, previous is Dec of last year)
      const previousMonthsData: DailyTransactionSum[][] = [];
      
      for (let i = 1; i <= 3; i++) {
        let pMonth = month - i;
        let pYear = year;
        if (pMonth <= 0) {
          pMonth += 12;
          pYear -= 1;
        }
        const pData = await window.electronAPI.getDailyTransactionSum(pYear, pMonth, 'expense');
        previousMonthsData.push(pData);
      }

      // Calculate Average for each day (1-31)
      const avgData: DailyTransactionSum[] = [];
      for (let day = 1; day <= 31; day++) {
        let totalSum = 0;
        let count = 0;
        
        for (const pMonthData of previousMonthsData) {
          // Find day in this month's data
          // Since getDailyTransactionSum returns cumulative? No, currently it returns daily sum.
          // Wait, the pacing chart is usually cumulative. 
          // The DB function returns DAILY SUM.
          // We should calculate cumulative here or in the DB.
          // Let's calculate cumulative here.
          
          const dayData = pMonthData.find(d => d.day === day);
          if (dayData) {
             totalSum += dayData.total;
             count++;
          } else {
             // If day doesn't exist (e.g. 31st in Feb, or just no spend), it counts as 0 spend?
             // If the month ended (e.g. Feb 28), we shouldn't count it for day 29, 30, 31?
             // For simplicity, we treat 0 spend as 0.
             // But for short months, we shouldn't dilute the average?
             // Standard approach: Divide by 'count' only if the month actually has that day?
             // Or just assume 0. Let's assume 0 for simplicity of "average daily burn".
             totalSum += 0;
             count++; 
          }
        }
        
        // Actually, logic is simpler: Just sum all and divide by 3 (or number of valid months)
        if (count > 0) {
           avgData.push({ day, total: totalSum / 3 }); // Hardcoded 3 months average
        }
      }

      // Convert to Cumulative
      const toCumulative = (data: DailyTransactionSum[]) => {
        let runningTotal = 0;
        return data.map(d => {
          runningTotal += d.total;
          return { day: d.day, total: runningTotal };
        });
      };
      
      // We need to make sure the 'currentMonthData' has entries for days with 0 spend if we want a smooth line?
      // Or just map the existing ones. Chart.js can handle sparse data if x-axis is linear.
      // But for cumulative, we need all days up to today (or end of month).
      
      const fillDays = (data: DailyTransactionSum[]) => {
          const filled: DailyTransactionSum[] = [];
          for (let d = 1; d <= 31; d++) {
              const existing = data.find(item => item.day === d);
              filled.push(existing || { day: d, total: 0 });
          }
          return filled;
      }

      pacingTrends.value = {
        currentMonth: toCumulative(fillDays(currentMonthData)),
        previousAverage: toCumulative(avgData)
      };

    } catch (e) {
      console.error("[Store] Failed to fetch pacing trends:", e);
      pacingTrends.value = { currentMonth: [], previousAverage: [] };
    }
  }
  // ==================================
  // SETTINGS ACTIONS
  // ==================================

  async function importDatabaseData(data: {
    accounts?: Account[],
    transactions?: TransactionWithCategory[],
    categories?: Category[],
    accountTypes?: AccountType[],
    ledgerYears?: number[]
  }, skipDuplicates: boolean): Promise<boolean> {

    const importAccounts = data.accounts!;
    const importTransactions = data.transactions!;
    const importCategories = data.categories!;
    const importAccountTypes = data.accountTypes!;
    const importLedgerYears = data.ledgerYears!;

    const accountTypeIdMap = new Map<number, number>();
    const categoryTypeIdMap = new Map<number, number>();
    const accountIdMap = new Map<number, number>();

    try {
      for (const accountType of importAccountTypes){

        // Check for existing account type
        const existing = accountTypes.value.find((at) => at.type === accountType.type);
        if (existing){
          accountTypeIdMap.set(accountType.id, existing.id);
          console.log(`Skipping inserting existing account type ${accountType.type}`);
          continue;
        }
    
        const result = await addAccountType(accountType);

        console.log(`Inserting account type ${accountType.type} resulted in id ${result}`);
    
        if (result == null){
          throw new Error("Resulting Id from inserting of account type is null");
        }
    
        accountTypeIdMap.set(accountType.id, result);
      }
    
      for (const account of importAccounts){

        // Check for existing account
        const existing = accounts.value.find((a) => a.accountName === account.accountName && a.institutionName === account.institutionName);
        if (existing){
          accountIdMap.set(account.id, existing.id);
          console.log(`Skipping inserting existing account ${account.accountName}`);
          continue;
        }
    
        const accountTypeId = accountTypeIdMap.get(account.accountTypeId);
    
        if (accountTypeId == undefined){
          throw new Error("Account type id mapping not found for account id: " + account.id);
        }
    
        account.accountTypeId = accountTypeId;
    
        const result = await addAccount(account);

        console.log(`Inserting account ${account.accountName} resulted in id ${result}`);
    
        if (result == null){
          throw new Error("Resulting Id from inserting of account is null");
        }
    
        accountIdMap.set(account.id, result);
    
      }
    
      for (const category of importCategories){

        // Check for existing category
        const existing = categories.value.find((c) => c.name === category.name);
        if (existing){
          categoryTypeIdMap.set(category.id, existing.id);
          console.log(`Skipping inserting existing category ${category.name}`);
          continue;
        }
    
        const result = await addCategory(category.name, category.colorCode, category.icon);

        console.log(`Inserting category ${category.name} resulted in id ${result.id}`);
    
        if (result == null){
          throw new Error("Resulting Id from inserting of category is null");
        }
    
        categoryTypeIdMap.set(category.id, result.id);
    
      }
    
      for (const ledgerYear of importLedgerYears){

        // Check for existing ledger year
        const existing = ledgerYears.value.find((ly) => ly === ledgerYear);
        if (existing){
          console.log(`Skipping inserting existing ledger year ${ledgerYear}`);
          continue;
        }
    
        await createYear(ledgerYear);

        console.log(`Inserting ledger year ${ledgerYear} completed`);
      }
    
      for (const transaction of importTransactions){

          if (skipDuplicates){
            // Check for existing transaction
            const existing = transactions.value.find((t) => t.title === transaction.title && t.amount === transaction.amount && t.date === transaction.date);
            if (existing){
              console.log(`Skipping inserting existing transaction ${transaction.title}`);
              continue;
            }
          }
    
          if (transaction.categoryId != undefined){
            const mappedCategoryId = categoryTypeIdMap.get(transaction.categoryId);
    
            if (mappedCategoryId == undefined){
              throw new Error("Category id mapping not found for transaction id: " + transaction.id);
            }
    
            transaction.categoryId = mappedCategoryId;
          }
    
          const mappedAccountId = accountIdMap.get(transaction.accountId);
    
          if (mappedAccountId == undefined){
            throw new Error("Account id mapping not found for transaction id: " + transaction.id);
          }
    
          transaction.accountId = mappedAccountId;
    
          await addTransaction({
              title: transaction.title,
              amount: transaction.amount,
              date: transaction.date,
              type: transaction.type,
              categoryId: transaction.categoryId ?? undefined,
              accountId: transaction.accountId!,
              notes: transaction.notes || undefined,
            }
          );
          console.log(`Inserting transaction ${transaction.title} completed`);
      }
    }
   catch (error) {
      console.log(error);
      return false;
    }

    return true;
  }

  async function deleteAllDataFromTables(){
    await window.electronAPI.deleteAllDataFromTables();
    accounts.value = [];
    categories.value = [];
    transactions.value = [];
    accountTypes.value = [];
    ledgerMonths.value = [];
    ledgerYears.value = [];
  }

  // ============================================
  // RETURN STORE 
  // ============================================

  return {
    // State
    currentLedgerMonth,
    selectedYear,
    ledgerYears,
    ledgerMonths,
    categories,
    accounts,
    accountTypes,
    transactions,
    recentTransactions,
    searchResults,
    isSearching,
    periodSummary,
    incomeBreakdown,
    expenseBreakdown,
    monthlyTrends,
    pacingTrends,
    isLoading,
    isChangingPeriod,
    error,

    // Getters
    hasCurrentPeriod,
    incomeTransactions,
    expenseTransactions,

    // Actions
    initialize,
    createYear,
    deleteYear,
    selectPeriod,
    selectYear,
    clearPeriod,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
    fetchTransactions,
    fetchRecentTransactions,
    fetchPeriodSummarySync,
    fetchMonthlyTrends,
    fetchPacingTrends,
    addTransaction,
    editTransaction,
    removeTransaction,
    searchTransactions,
    clearSearch,
    fetchAccounts,
    fetchAccountTypes,
    removeAccount,
    addAccount,
    addAccountType,
    editAccount,
    deleteAllDataFromTables,
    importDatabaseData,
  };
});

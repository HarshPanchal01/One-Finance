import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  LedgerPeriod,
  Category,
  Account,
  AccountType,
  TransactionWithCategory,
  CreateTransactionInput,
  PeriodSummary,
  CategoryBreakdown,
  SearchOptions,
} from "../types";


export const useFinanceStore = defineStore("finance", () => {
  // ============================================
  // STATE
  // ============================================

  // Current period selection
  const currentPeriod = ref<LedgerPeriod | null>(null);
  const ledgerYears = ref<number[]>([]);
  const ledgerPeriods = ref<LedgerPeriod[]>([]);

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

  // Loading states - separate for initial load vs period changes
  const isLoading = ref(true); // Initial load
  const isChangingPeriod = ref(false); // Period changes (doesn't hide UI)
  const error = ref<string | null>(null);

  // ============================================
  // GETTERS (Computed)
  // ============================================

  const hasCurrentPeriod = computed(() => currentPeriod.value !== null);

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
        ledgerPeriods.value.length
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
      const id = 0;
      const period = {id, year, month};
      ledgerPeriods.value.push(period);
    }
  }

  function deleteLedgerPeriodsByYearSync(year: number){
    ledgerPeriods.value = ledgerPeriods.value.filter((item) => item.year !== year);
  }


  function fetchTransactionsForPeriodSync(year: number, month: number){
    transactions.value = transactions.value.filter((value) => {
      const strDate = value.date;
      const dateList = strDate.split("-");
      const dateYear = dateList.at(0);
      const dateMonth = dateList.at(1);

      return dateMonth === month.toString() && dateYear === year.toString();
    });
  }

  function fetchPeriodSummarySync(){
    // periodSummary
    // incomeBreakdown
    // expenseBreakdown

    const transactionsByIncome = transactions.value.filter((value) => value.type==="income");
    const transactionsByExpense = transactions.value.filter((value) => value.type==="expense");

    const transactionsIncomeSum = transactionsByIncome.reduce((sum, currentValue) => sum + currentValue.amount,0);
    const transactionsExpenseSum = transactionsByIncome.reduce((sum, currentValue) => sum + currentValue.amount, 0);

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

      const entry = expenseCategoryBreakdown.get(expense.id);
      if (entry !== undefined) {
        entry.count += 1;
        entry.total += expense.amount;
      }
      else{
        if (expense.categoryId == undefined || expense.categoryName == undefined || expense.categoryColor == undefined || expense.categoryIcon == undefined) {continue}
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
    ledgerPeriods.value;
  }

  async function deleteYear(year: number) {
    await window.electronAPI.deleteLedgerYear(year);
    deleteLedgerPeriodsByYearSync(year);
    ledgerYears.value = await window.electronAPI.getLedgerYears();
    //ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();

    // If deleted current period's year, reset to Global
    if (currentPeriod.value?.year === year) {
      await clearPeriod();
    }
  }

  async function selectPeriod(year: number, month: number) {
    console.log(`[Store] selectPeriod called: ${year}-${month}`);
    isChangingPeriod.value = true;
    error.value = null;

    try {
      currentPeriod.value = {id: 0, year: year, month: month};
      console.log(`[Store] currentPeriod set to:`, currentPeriod.value);

      // Refresh periods list in case a new one was created
      //ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();

      // Fetch data for the selected period
      if (currentPeriod.value) {
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
    currentPeriod.value = null;

    try {
      // Fetch Global Data
      await fetchRecentTransactions(5); // Ensure recent list is up to date
      await fetchTransactions(null); // All transactions
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

  async function addAccount(account: Account){
    await window.electronAPI.insertAccount(account);
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

  async function fetchTransactions(periodId?: number | null) {
    transactions.value = await window.electronAPI.getTransactions(periodId);
  }

  async function fetchRecentTransactions(limit: number) {
    recentTransactions.value = await window.electronAPI.getTransactions(
      null,
      limit
    );
  }

  async function addTransaction(
    
  ) {

    const newTransaction = await window.electronAPI.createTransaction({
      ...input,
      ledgerPeriodId: targetPeriodId,
    });

    // Refresh Data
    await fetchRecentTransactions(5);

    // Only update main list if it matches current filter (Global or Specific Period)
    if (!currentPeriod.value || currentPeriod.value.id === targetPeriodId) {
        // Add to front if valid
        transactions.value.unshift(newTransaction);
        // Refresh summary
        await fetchPeriodSummarySync();
    }

    return newTransaction;
  }

  async function editTransaction(
    id: number,
    input: Partial<CreateTransactionInput>
  ) {
    const updated = await window.electronAPI.updateTransaction(id, input);
    if (updated) {
      const index = transactions.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        // If the date changed such that it moves out of the current view (if period specific),
        // we might want to remove it. But for simplicity, we just update it in place or re-fetch.
        // Re-fetching is safer.
        if (currentPeriod.value) {
            // Check if it still belongs?
            // Easier to just re-fetch the list to be safe
             await fetchTransactions(currentPeriod.value.id);
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

  // ============================================
  // RETURN STORE
  // ============================================

  return {
    // State
    currentPeriod,
    ledgerYears,
    ledgerPeriods,
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
    clearPeriod,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
    fetchTransactions,
    fetchRecentTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    searchTransactions,
    clearSearch,
    fetchAccounts,
    fetchAccountTypes,
    removeAccount,
    addAccount,
    editAccount,
  };
});

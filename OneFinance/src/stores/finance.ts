import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  LedgerPeriod,
  Category,
  TransactionWithCategory,
  CreateTransactionInput,
  PeriodSummary,
  CategoryBreakdown,
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

  // Transactions for current period
  const transactions = ref<TransactionWithCategory[]>([]);

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

      // Get or create the current period
      currentPeriod.value = await window.electronAPI.getOrCreateCurrentPeriod();
      console.log("[Store] Current period:", currentPeriod.value);

      // Load years and periods
      ledgerYears.value = await window.electronAPI.getLedgerYears();
      ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();
      console.log(
        "[Store] Years:",
        ledgerYears.value,
        "Periods:",
        ledgerPeriods.value.length
      );

      // Load transactions and summary for current period
      if (currentPeriod.value) {
        await fetchTransactions();
        await fetchPeriodSummary();
        console.log(
          "[Store] Initial data loaded - transactions:",
          transactions.value.length
        );
      }
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

  async function createYear(year: number) {
    await window.electronAPI.createLedgerYear(year);
    // Auto-create all 12 months for the year
    for (let month = 1; month <= 12; month++) {
      await window.electronAPI.createLedgerPeriod(year, month);
    }
    ledgerYears.value = await window.electronAPI.getLedgerYears();
    ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();
  }

  async function deleteYear(year: number) {
    await window.electronAPI.deleteLedgerYear(year);
    ledgerYears.value = await window.electronAPI.getLedgerYears();
    ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();

    // If deleted current period's year, reset
    if (currentPeriod.value?.year === year) {
      currentPeriod.value = await window.electronAPI.getOrCreateCurrentPeriod();
      await fetchTransactions();
      await fetchPeriodSummary();
    }
  }

  async function selectPeriod(year: number, month: number) {
    console.log(`[Store] selectPeriod called: ${year}-${month}`);
    isChangingPeriod.value = true;
    error.value = null;

    try {
      currentPeriod.value = await window.electronAPI.createLedgerPeriod(
        year,
        month
      );
      console.log(`[Store] currentPeriod set to:`, currentPeriod.value);

      // Refresh periods list in case a new one was created
      ledgerPeriods.value = await window.electronAPI.getLedgerPeriods();
      await fetchTransactions();
      console.log(
        `[Store] Transactions fetched: ${transactions.value.length} items`
      );
      await fetchPeriodSummary();
      console.log(`[Store] Summary fetched:`, periodSummary.value);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to select period";
      console.error("[Store] Select period error:", e);
    } finally {
      isChangingPeriod.value = false;
    }
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

  async function fetchTransactions() {
    if (!currentPeriod.value) return;
    transactions.value = await window.electronAPI.getTransactions(
      currentPeriod.value.id
    );
  }

  async function addTransaction(
    input: Omit<CreateTransactionInput, "ledgerPeriodId">
  ) {
    if (!currentPeriod.value) {
      throw new Error("No period selected");
    }

    const newTransaction = await window.electronAPI.createTransaction({
      ...input,
      ledgerPeriodId: currentPeriod.value.id,
    });

    transactions.value.unshift(newTransaction);
    await fetchPeriodSummary(); // Refresh summary
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
        transactions.value[index] = updated;
      }
      await fetchPeriodSummary(); // Refresh summary
    }
    return updated;
  }

  async function removeTransaction(id: number) {
    const success = await window.electronAPI.deleteTransaction(id);
    if (success) {
      transactions.value = transactions.value.filter((t) => t.id !== id);
      await fetchPeriodSummary(); // Refresh summary
    }
    return success;
  }

  // ============================================
  // ACTIONS - Summary / Dashboard
  // ============================================

  async function fetchPeriodSummary() {
    if (!currentPeriod.value) {
      // Reset to defaults
      periodSummary.value = {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
      };
      incomeBreakdown.value = [];
      expenseBreakdown.value = [];
      return;
    }

    const summary = await window.electronAPI.getPeriodSummary(
      currentPeriod.value.id
    );
    periodSummary.value = summary || {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
    };
    incomeBreakdown.value = await window.electronAPI.getCategoryBreakdown(
      currentPeriod.value.id,
      "income"
    );
    expenseBreakdown.value = await window.electronAPI.getCategoryBreakdown(
      currentPeriod.value.id,
      "expense"
    );
  }

  // ============================================
  // RETURN STORE
  // ============================================

  return {
    // State
    currentPeriod,
    ledgerYears,
    ledgerPeriods,
    categories,
    transactions,
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
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
    fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    fetchPeriodSummary,
  };
});

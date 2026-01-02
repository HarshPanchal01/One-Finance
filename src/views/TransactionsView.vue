<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useFinanceStore } from "../stores/finance";
import { formatCurrency } from "../types";
import type { Transaction, TransactionWithCategory } from "../types";
import TransactionItem from "../components/TransactionItem.vue";
import TransactionModal from "../components/TransactionModal.vue";

const store = useFinanceStore();

onMounted(() => {
  // If a period is already selected (from Sidebar), fetch for that period.
  // If not (Global Mode), fetch all.
  const periodId = store.currentPeriod?.id || null;
  store.fetchTransactions(periodId);
});

// Reactively update when period changes
watch(
  () => store.currentPeriod,
  async (newPeriod) => {
    const periodId = newPeriod?.id || null;
    await store.fetchTransactions(periodId);
  }
);

// Modal state
const showModal = ref(false);
const editingTransaction = ref<Transaction | null>(null);

// Filter state
const searchQuery = ref("");
const filterType = ref<"all" | "income" | "expense">("all");

// Filtered transactions
const filteredTransactions = computed(() => {
  // If searching globally, use search results as base
  let result = store.isSearching ? store.searchResults : store.transactions;

  // Filter by type
  if (filterType.value !== "all") {
    result = result.filter((t) => t.type === filterType.value);
  }

  return result;
});

// Summary for filtered transactions
const filteredSummary = computed(() => {
  const income = filteredTransactions.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = filteredTransactions.value
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expenses, balance: income - expenses };
});

// Open create modal
function openCreateModal() {
  editingTransaction.value = null;
  showModal.value = true;
}

// Open edit modal
function openEditModal(transaction: TransactionWithCategory) {
  editingTransaction.value = transaction;
  showModal.value = true;
}

// Delete transaction
async function deleteTransaction(id: number) {
  if (confirm("Delete this transaction? This cannot be undone.")) {
    await store.removeTransaction(id);
  }
}

// Close modal
function closeModal() {
  showModal.value = false;
  editingTransaction.value = null;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with actions -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ store.isSearching ? 'Search Results' : 'Transactions' }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <span v-if="store.isSearching">Global Search</span>
          <span v-else-if="store.currentPeriod">
            {{ store.currentPeriod.month }}/{{ store.currentPeriod.year }}
          </span>
          <span v-else>All Transactions</span>
          ({{ filteredTransactions.length }})
        </p>
      </div>

      <button
        v-if="!store.isSearching"
        class="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        @click="openCreateModal"
      >
        <i class="pi pi-plus mr-2" />
        Add Transaction
      </button>
    </div>

    <!-- Summary Bar -->
    <div class="grid grid-cols-3 gap-4">
      <!-- ... (keep summary cards) ... -->
      <div class="card p-4 text-center">
        <p
          class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          Income
        </p>
        <p class="text-lg font-bold text-income">
          {{ formatCurrency(filteredSummary.income) }}
        </p>
      </div>
      <div class="card p-4 text-center">
        <p
          class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          Expenses
        </p>
        <p class="text-lg font-bold text-expense">
          {{ formatCurrency(filteredSummary.expenses) }}
        </p>
      </div>
      <div class="card p-4 text-center">
        <p
          class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          Balance
        </p>
        <p
          class="text-lg font-bold"
          :class="filteredSummary.balance >= 0 ? 'text-income' : 'text-expense'"
        >
          {{ formatCurrency(filteredSummary.balance) }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search Input Removed (Using TopBar) -->

        <!-- Type Filter -->
        <div
          class="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 w-full sm:w-auto"
        >
          <button
            :class="[
              'flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-colors',
              filterType === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600',
            ]"
            @click="filterType = 'all'"
          >
            All
          </button>
          <button
            :class="[
              'flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600',
              filterType === 'income'
                ? 'bg-income text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600',
            ]"
            @click="filterType = 'income'"
          >
            Income
          </button>
          <button
            :class="[
              'flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600',
              filterType === 'expense'
                ? 'bg-expense text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600',
            ]"
            @click="filterType = 'expense'"
          >
            Expenses
          </button>
        </div>
      </div>
    </div>

    <!-- Transaction List -->
    <div class="card p-4">
      <div
        v-if="filteredTransactions.length === 0"
        class="text-center py-12 text-gray-500 dark:text-gray-400"
      >
        <i
          class="pi pi-inbox text-5xl text-gray-300 dark:text-gray-600 mb-4"
        />
        <p class="text-lg">
          No transactions found
        </p>
        <p class="text-sm mt-1">
          {{
            searchQuery || filterType !== "all"
              ? "Try adjusting your filters"
              : "Add your first transaction to get started!"
          }}
        </p>
      </div>

      <div
        v-else
        class="space-y-2"
      >
        <TransactionItem
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          :transaction="transaction"
          @edit="openEditModal"
          @delete="deleteTransaction"
        />
      </div>
    </div>

    <!-- Transaction Modal -->
    <TransactionModal
      :visible="showModal"
      :transaction="editingTransaction"
      :default-year="store.currentPeriod?.year"
      :default-month="store.currentPeriod?.month"
      @close="closeModal"
      @saved="closeModal"
    />
  </div>
</template>

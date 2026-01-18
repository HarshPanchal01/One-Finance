<script setup lang="ts">
import { computed, onMounted, toRaw } from "vue";
import { useFinanceStore } from "@/stores/finance";
import { formatCurrency } from "@/utils";
import TransactionItem from "@/components/TransactionItem.vue";
import TransactionModal from "@/components/TransactionModal.vue";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import { useTransactionActions } from "@/composables/useTransactionActions";

const store = useFinanceStore();

const emit = defineEmits<{
  (e: "request-edit-account", id: number): void;
}>();

const {
  showModal,
  editingTransaction,
  confirmModal,
  openCreateModal,
  openEditModal,
  deleteTransaction,
  closeModal
} = useTransactionActions();

// Silence unused variable warning for template ref
void confirmModal;

onMounted(() => {
  // If a period is already selected (from Sidebar), fetch for that period.
  // If not (Global Mode), fetch all.
  const ledgerMonth = toRaw(store.currentLedgerMonth) ?? undefined;
  
  if (ledgerMonth) {
    store.fetchTransactions(ledgerMonth);
  } else if (store.selectedYear) {
    store.fetchTransactions(null, store.selectedYear);
  } else {
    store.fetchTransactions();
  }
});

// Filtered transactions
const filteredTransactions = computed(() => {
  // If searching globally, use search results as base
  return store.isSearching ? store.searchResults : store.transactions;
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

// Navigate to account edit
function goToAccount(accountId: number) {
  emit("request-edit-account", accountId);
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
          <span v-else-if="store.currentLedgerMonth">
            {{ store.currentLedgerMonth?.month }}/{{ store.currentLedgerMonth?.year }}
          </span>
          <span v-else-if="store.selectedYear">
            {{ store.selectedYear }} (All Months)
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
            store.isSearching
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
          @edit-account="goToAccount"
        />
      </div>
    </div>

    <!-- Transaction Modal -->
    <TransactionModal
      :visible="showModal"
      :transaction="editingTransaction"
      :default-year="store.currentLedgerMonth?.year"
      :default-month="store.currentLedgerMonth?.month"
      @close="closeModal"
      @saved="closeModal"
    />
  </div>

  <ConfirmationModal ref="confirmModal" />
  <ErrorModal ref="errorModal" />
</template>

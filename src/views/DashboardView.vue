<script setup lang="ts">
import { useFinanceStore } from "../stores/finance";
import { formatCurrency } from "../types";

const store = useFinanceStore();

const emit = defineEmits<{
  (e: "addTransaction"): void;
}>();
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <button
        class="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
        @click="emit('addTransaction')"
      >
        <i class="pi pi-plus mr-2" />
        Add Transaction
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Income Card -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Income
            </p>
            <p class="text-2xl font-bold text-income">
              {{ formatCurrency(store.periodSummary.totalIncome) }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-income-light dark:bg-income/20 rounded-full flex items-center justify-center"
          >
            <i class="pi pi-arrow-up text-xl text-income" />
          </div>
        </div>
      </div>

      <!-- Expenses Card -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Expenses
            </p>
            <p class="text-2xl font-bold text-expense">
              {{ formatCurrency(store.periodSummary.totalExpenses) }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-expense-light dark:bg-expense/20 rounded-full flex items-center justify-center"
          >
            <i class="pi pi-arrow-down text-xl text-expense" />
          </div>
        </div>
      </div>

      <!-- Balance Card -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Balance
            </p>
            <p
              class="text-2xl font-bold"
              :class="
                store.periodSummary.balance >= 0
                  ? 'text-income'
                  : 'text-expense'
              "
            >
              {{ formatCurrency(store.periodSummary.balance) }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center"
          >
            <i class="pi pi-wallet text-xl text-primary-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Expense Breakdown -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Expense Breakdown
      </h2>

      <div
        v-if="store.expenseBreakdown.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        <i
          class="pi pi-chart-pie text-4xl text-gray-300 dark:text-gray-600 mb-3"
        />
        <p>No expenses to show</p>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="item in store.expenseBreakdown"
          :key="item.categoryId ?? 'uncategorized'"
          class="flex items-center"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
            :style="{ backgroundColor: item.categoryColor + '20' }"
          >
            <i
              :class="['pi', item.categoryIcon]"
              :style="{ color: item.categoryColor }"
            />
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ item.categoryName }}
              </span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(item.total) }}
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :style="{
                  backgroundColor: item.categoryColor,
                  width: Math.min(100, (item.total / (store.periodSummary.totalExpenses || 1)) * 100) + '%',
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Transactions
      </h2>

      <div
        v-if="store.recentTransactions.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        <i
          class="pi pi-inbox text-4xl text-gray-300 dark:text-gray-600 mb-3"
        />
        <p>No transactions yet</p>
        <p class="text-sm mt-1">
          Add your first transaction to get started!
        </p>
      </div>

      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="transaction in store.recentTransactions"
          :key="transaction.id"
          class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                transaction.type === 'income'
                  ? 'bg-income-light dark:bg-income/20'
                  : 'bg-expense-light dark:bg-expense/20'
              "
            >
              <i
                :class="['pi', transaction.categoryIcon || 'pi-tag']"
                :style="{ color: transaction.categoryColor || '#6b7280' }"
              />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ transaction.title }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ transaction.categoryName || "Uncategorized" }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p
              class="font-semibold"
              :class="
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              "
            >
              {{ transaction.type === "income" ? "+" : "-" }}{{ formatCurrency(transaction.amount) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ transaction.date }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

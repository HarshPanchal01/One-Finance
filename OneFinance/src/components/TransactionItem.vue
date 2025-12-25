<script setup lang="ts">
import { computed } from "vue";
import type { TransactionWithCategory } from "../types";
import { formatCurrency, formatDate } from "../types";

const props = defineProps<{
  transaction: TransactionWithCategory;
}>();

const emit = defineEmits<{
  edit: [transaction: TransactionWithCategory];
  delete: [id: number];
}>();

const isIncome = computed(() => props.transaction.type === "income");
</script>

<template>
  <div
    class="group flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  >
    <div class="flex items-center space-x-3">
      <!-- Category Icon -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center"
        :class="
          isIncome
            ? 'bg-income-light dark:bg-income/20'
            : 'bg-expense-light dark:bg-expense/20'
        "
      >
        <i
          :class="['pi', transaction.categoryIcon || 'pi-tag']"
          :style="{ color: transaction.categoryColor || '#6b7280' }"
        />
      </div>

      <!-- Details -->
      <div>
        <p class="font-medium text-gray-900 dark:text-white">
          {{ transaction.title }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ transaction.categoryName || "Uncategorized" }}
          <span class="mx-1">•</span>
          {{ formatDate(transaction.date) }}
        </p>
      </div>
    </div>

    <div class="flex items-center space-x-3">
      <!-- Amount -->
      <div class="text-right">
        <p
          class="font-semibold"
          :class="isIncome ? 'text-income' : 'text-expense'"
        >
          {{ isIncome ? "+" : "-" }}{{ formatCurrency(transaction.amount) }}
        </p>
      </div>

      <!-- Actions -->
      <div class="hidden group-hover:flex items-center space-x-1">
        <button
          class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary-500 transition-colors"
          title="Edit"
          @click="emit('edit', transaction)"
        >
          <i class="pi pi-pencil text-sm" />
        </button>
        <button
          class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-expense transition-colors"
          title="Delete"
          @click="emit('delete', transaction.id)"
        >
          <i class="pi pi-trash text-sm" />
        </button>
      </div>
    </div>
  </div>
</template>

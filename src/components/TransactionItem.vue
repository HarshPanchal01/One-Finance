<script setup lang="ts">
import { computed } from "vue";
import type { TransactionWithCategory } from "../types";
import { formatCurrency, formatDate } from "../types";
import { useFinanceStore } from "../stores/finance";

const props = defineProps<{
  transaction: TransactionWithCategory;
}>();

const emit = defineEmits<{
  edit: [transaction: TransactionWithCategory];
  delete: [id: number];
  "edit-account": [id: number];
}>();

const store = useFinanceStore();
const isIncome = computed(() => props.transaction.type === "income");

const accountName = computed(() => {
  if (!props.transaction.accountId) return null;
  const account = store.accounts.find((a) => a.id === props.transaction.accountId);
  return account ? account.accountName : null;
});
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
        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span>{{ transaction.categoryName || "Uncategorized" }}</span>
          <span
            v-if="accountName"
            class="mx-0.5"
          >•</span>
          <button
            v-if="accountName"
            class="hover:text-primary-500 hover:underline transition-colors cursor-pointer"
            @click.stop="emit('edit-account', transaction.accountId)"
          >
            {{ accountName }}
          </button>
          <span class="mx-0.5">•</span>
          <span>{{ formatDate(transaction.date) }}</span>
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

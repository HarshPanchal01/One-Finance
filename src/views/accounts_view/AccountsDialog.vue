<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useFinanceStore } from "../../stores/finance";
import type { Transaction } from "../../types";

const props = defineProps<{
  visible: boolean;
  transaction?: Transaction | null;
  defaultYear?: number;
  defaultMonth?: number;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const store = useFinanceStore();

// Form data
const form = ref({
  title: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  type: "expense" as "income" | "expense",
  categoryId: null as number | null,
  notes: "",
});

// Get default date based on current period or today
function getDefaultDate(): string {
  if (props.defaultYear && props.defaultMonth) {
    // Use the 1st of the selected month as default
    const day = new Date().getDate();
    const maxDay = new Date(props.defaultYear, props.defaultMonth, 0).getDate();
    const safeDay = Math.min(day, maxDay);
    return `${props.defaultYear}-${String(props.defaultMonth).padStart(
      2,
      "0"
    )}-${String(safeDay).padStart(2, "0")}`;
  }
  return new Date().toISOString().split("T")[0];
}

// Reset form when modal opens
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.transaction) {
        // Edit mode
        form.value = {
          title: props.transaction.title,
          amount: props.transaction.amount,
          date: props.transaction.date,
          type: props.transaction.type,
          categoryId: props.transaction.categoryId,
          notes: props.transaction.notes || "",
        };
      } else {
        // Create mode - use current period's month/year for date
        form.value = {
          title: "",
          amount: 0,
          date: getDefaultDate(),
          type: "expense",
          categoryId: null,
          notes: "",
        };
      }
    }
  }
);

const isEditing = computed(() => !!props.transaction);

const modalTitle = computed(() =>
  isEditing.value ? "Edit Transaction" : "New Transaction"
);

// Filter categories by type (optional)
const filteredCategories = computed(() => store.categories);

// Validation
const isValid = computed(
  () =>
    form.value.title.trim().length > 0 &&
    form.value.amount > 0 &&
    form.value.date
);

// Save transaction
async function save() {
  if (!isValid.value) return;

  try {
    if (isEditing.value && props.transaction) {
      await store.editTransaction(props.transaction.id, {
        title: form.value.title,
        amount: form.value.amount,
        date: form.value.date,
        type: form.value.type,
        categoryId: form.value.categoryId ?? undefined,
        notes: form.value.notes || undefined,
      });
    } else {
      await store.addTransaction({
        title: form.value.title,
        amount: form.value.amount,
        date: form.value.date,
        type: form.value.type,
        categoryId: form.value.categoryId ?? undefined,
        notes: form.value.notes || undefined,
      });
    }
    emit("saved");
    emit("close");
  } catch (error) {
    console.error("Failed to save transaction:", error);
  }
}

function close() {
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        @click="close"
      />

      <!-- Modal -->
      <div
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4"
        @click.stop
        @mousedown.stop
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ modalTitle }}
          </h3>
          <button
            class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            @click="close"
          >
            <i class="pi pi-times" />
          </button>
        </div>

        <!-- Form -->
        <div class="p-6 space-y-4">
          <!-- Type Toggle -->
          <div
            class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <button
              :class="[
                'flex-1 py-2 text-sm font-medium transition-colors',
                form.type === 'expense'
                  ? 'bg-expense text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600',
              ]"
              @click="form.type = 'expense'"
            >
              <i class="pi pi-arrow-down mr-2" />
              Expense
            </button>
            <button
              :class="[
                'flex-1 py-2 text-sm font-medium transition-colors',
                form.type === 'income'
                  ? 'bg-income text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600',
              ]"
              @click="form.type = 'income'"
            >
              <i class="pi pi-arrow-up mr-2" />
              Income
            </button>
          </div>

          <!-- Title -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Title
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="e.g., Grocery shopping"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <!-- Amount -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Amount
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              >$</span>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Date -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Date
            </label>
            <input
              v-model="form.date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <!-- Category -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Category
            </label>
            <select
              v-model="form.categoryId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option :value="null">
                No category
              </option>
              <option
                v-for="category in filteredCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notes (optional)
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Add any additional notes..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="close"
          >
            Cancel
          </button>
          <button
            :disabled="!isValid"
            class="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            @click="save"
          >
            {{ isEditing ? "Update" : "Create" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

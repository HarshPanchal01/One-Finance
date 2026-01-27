<script setup lang="ts">
import { AccountType } from '@/types';
import { ref } from 'vue';

const props = defineProps<{
  editingAccountType: AccountType | null;
}>();

const accountTypeForm = ref({
  type: "",
});

const emit = defineEmits<{
  (e: 'closeAccountTypeModal'): void;
  (e: 'saveAccountType', accountTypeForm: { type: string }): void;
}>();


</script>

<template>
<Teleport to="body">
      <div
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/50"
          @click="$emit('closeAccountTypeModal')"
        />

        <div
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ editingAccountType ? "Edit Account Type" : "New Account Type" }}
            </h3>
            <button
              class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              @click="$emit('closeAccountTypeModal')"
            >
              <i class="pi pi-times" />
            </button>
          </div>

          <!-- Form -->
          <div class="p-6 space-y-4">
            <!-- Preview -->
            <div class="flex justify-center">
            </div>

            <!-- Name -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Name
              </label>
              <input
                v-model="accountTypeForm.type"
                type="text"
                placeholder="e.g., Food & Dining"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

          </div>  

          <!-- Footer -->
          <div
            class="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              @click="$emit('closeAccountTypeModal')"
            >
              Cancel
            </button>
            <button
              :disabled="!accountTypeForm.type.trim()"
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              @click="$emit('saveAccountType', accountTypeForm)"
            >
              {{ editingAccountType ? "Update" : "Create" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
</template>
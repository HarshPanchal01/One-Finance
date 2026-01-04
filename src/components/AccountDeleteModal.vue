<script setup lang="ts">
import { ref, computed } from "vue";
import type { Account } from "../types";
import { useFinanceStore } from "../stores/finance";

const props = defineProps<{
  visible: boolean;
  account: Account | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", strategy: "transfer" | "delete", transferToAccountId?: number): void;
}>();

const store = useFinanceStore();
const strategy = ref<"transfer" | "delete">("transfer");
const transferToAccountId = ref<number | null>(null);

const availableAccounts = computed(() => {
  if (!props.account) return [];
  return store.accounts.filter((a) => a.id !== props.account!.id);
});

// Select default transfer target when modal opens
const init = () => {
  if (availableAccounts.value.length > 0) {
    const defaultAcc = availableAccounts.value.find((a) => a.isDefault);
    transferToAccountId.value = defaultAcc
      ? defaultAcc.id
      : availableAccounts.value[0].id;
  }
};

// Watch for visibility to init
import { watch } from "vue";
watch(
  () => props.visible,
  (val) => {
    if (val) {
        strategy.value = "transfer"; // Reset to default strategy
        init();
    }
  }
);

function close() {
  emit("close");
}

function confirm() {
  if (strategy.value === "transfer" && !transferToAccountId.value) return;
  
  emit(
    "confirm",
    strategy.value,
    strategy.value === "transfer" ? transferToAccountId.value! : undefined
  );
  close();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && account"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        @click="close"
      />

      <!-- Modal -->
      <div
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
      >
        <div class="mb-4">
          <div
            class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
          >
            <i class="pi pi-exclamation-triangle text-xl text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Account
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You are about to delete <strong>{{ account.accountName }}</strong>.
            What would you like to do with its associated transactions?
          </p>
        </div>

        <!-- Options -->
        <div class="space-y-4 mb-6">
          <!-- Transfer Option -->
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                id="opt-transfer"
                v-model="strategy"
                value="transfer"
                type="radio"
                class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
              />
            </div>
            <div class="ml-3 text-sm">
              <label
                for="opt-transfer"
                class="font-medium text-gray-700 dark:text-gray-300"
              >Transfer transactions</label>
              <p class="text-gray-500 dark:text-gray-400">
                Move all transactions to another account.
              </p>
              
              <!-- Account Selection (only if Transfer is selected) -->
              <div
                v-if="strategy === 'transfer'"
                class="mt-2"
              >
                <select
                  v-model="transferToAccountId"
                  class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option
                    v-for="acc in availableAccounts"
                    :key="acc.id"
                    :value="acc.id"
                  >
                    {{ acc.accountName }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Delete Option -->
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                id="opt-delete"
                v-model="strategy"
                value="delete"
                type="radio"
                class="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
              />
            </div>
            <div class="ml-3 text-sm">
              <label
                for="opt-delete"
                class="font-medium text-gray-700 dark:text-gray-300"
              >Delete transactions</label>
              <p class="text-gray-500 dark:text-gray-400">
                Permanently remove all transactions associated with this account.
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="close"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            @click="confirm"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

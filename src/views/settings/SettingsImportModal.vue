<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg w-96 shadow-lg">
      <h2 class="text-lg font-bold mb-4">
        {{ title }}
      </h2>
      <p class="text-gray-600 mb-4">
        {{ message }}
      </p>

      <!-- Action selection -->
      <div class="mb-4">
        <label class="flex items-center mb-2">
          <input
            type="radio"
            value="replace"
            v-model="selectedAction"
            class="mr-2"
          />
          Replace all existing data
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            value="append"
            v-model="selectedAction"
            class="mr-2"
          />
          Append imported data
        </label>
      </div>

      <!-- Skip duplicates always visible but disabled unless append is selected -->
      <div class="mb-4">
        <label
          class="flex items-center text-gray-400" 
          :class="{'text-gray-900': selectedAction === 'append'}"
        >
          <input
            type="checkbox"
            v-model="skipDuplicates"
            :disabled="selectedAction !== 'append'"
            class="mr-2"
          />
          Skip duplicates when appending
        </label>
      </div>

      <div class="flex justify-end space-x-2">
        <button
          class="px-4 py-2 border rounded hover:bg-gray-100 transition"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isOpen = ref(false);
const title = ref('Confirm');
const message = ref('Are you sure?');
const cancelText = ref('Cancel');
const confirmText = ref('Confirm');

// Track selected action and duplicate option
const selectedAction = ref<'replace' | 'append'>('replace');
const skipDuplicates = ref(true);

let resolveCallback: ((result: { action: 'replace' | 'append'; skipDuplicates: boolean } | null) => void) | null = null;

function openConfirmation(options: {
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
}): Promise<{ action: 'replace' | 'append'; skipDuplicates: boolean } | null> {
  title.value = options.title;
  message.value = options.message;
  cancelText.value = options.cancelText ?? 'Cancel';
  confirmText.value = options.confirmText ?? 'Confirm';
  selectedAction.value = 'replace';
  skipDuplicates.value = true;
  isOpen.value = true;

  return new Promise((resolve) => {
    resolveCallback = resolve;
  });
}

function handleConfirm() {
  isOpen.value = false;
  if (resolveCallback) {
    resolveCallback({ action: selectedAction.value, skipDuplicates: skipDuplicates.value });
    resolveCallback = null;
  }
}

function handleCancel() {
  isOpen.value = false;
  if (resolveCallback) {
    resolveCallback(null);
    resolveCallback = null;
  }
}

defineExpose({ openConfirmation });
</script>

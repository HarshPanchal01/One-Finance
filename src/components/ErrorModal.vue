<script setup lang="ts">
import { ref } from 'vue';

const isOpen = ref(false);
const title = ref('Error');
const message = ref('Your cannot do this action.');
const confirmText = ref('Okay');

let resolveCallback: ((confirmed: boolean) => void) | null = null;

function openConfirmation(options: {
  title: string;
  message: string;
  confirmText?: string;
}): Promise<boolean> {
  title.value = options.title;
  message.value = options.message;
  confirmText.value = options.confirmText ?? 'Confirm';
  isOpen.value = true;

  return new Promise((resolve) => {
    resolveCallback = resolve;
  });
}

function handleConfirm() {
  isOpen.value = false;
  if (resolveCallback) {
    resolveCallback(true);
    resolveCallback = null;
  }
}

defineExpose({ openConfirmation });
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg w-96 shadow-lg">
      <h2 class="text-lg font-bold mb-4">
        {{ title }}
      </h2>
      <p class="text-gray-600 mb-6">
        {{ message }}
      </p>
      <div class="flex justify-end space-x-2">
        <button
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
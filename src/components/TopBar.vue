<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useFinanceStore } from "../stores/finance";

const store = useFinanceStore();
const searchQuery = ref("");
const searchInput = ref<HTMLInputElement | null>(null);
const highlighter = ref<HTMLDivElement | null>(null);

// Debounce search
let timeout: NodeJS.Timeout;
function handleInput() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    store.searchTransactions(searchQuery.value);
  }, 300);
}

// Clear search when needed
function clear() {
  searchQuery.value = "";
  store.clearSearch();
  searchInput.value?.focus();
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  // Press '/' to focus search
  if (e.key === "/" && document.activeElement !== searchInput.value) {
    e.preventDefault();
    searchInput.value?.focus();
  }
}

// Sync scrolling
function syncScroll(e: Event) {
  if (highlighter.value && e.target instanceof HTMLInputElement) {
    highlighter.value.scrollLeft = e.target.scrollLeft;
  }
}

// Generate highlighted HTML
const highlightedText = computed(() => {
  if (!searchQuery.value) return "";

  // Escape HTML to prevent injection (basic)
  let text = searchQuery.value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight filters
  // Matches "is:", "label:", "category:", "from:", "to:" or "is:value", "label:value" etc.
  text = text.replace(
    /((?:\b(?:is|label|category|from|to):)(?:[\w-]+)?)/gi,
    '<span class="text-primary-500">$1</span>'
  );

  return text;
});

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <!-- 
    ALIGNMENT NOTE: 
    Adjust 'py-4' in the class below to fix the underline alignment with the Sidebar header.
    Try 'py-[1.125rem]' (18px) or 'py-[0.875rem]' (14px) if needed.
  -->
  <div
    class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-[1.050rem] flex items-center justify-center"
  >
    <div class="relative w-full max-w-xl group">
      <!-- Search Icon -->
      <i
        class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
      />

      <!-- Highlighter Layer (Behind Input) -->
      <!-- Must match input styles exactly: font, padding, border, etc. -->
      <div
        ref="highlighter"
        class="absolute inset-0 w-full h-full pl-10 pr-10 py-2 border border-transparent rounded-lg text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 whitespace-pre overflow-hidden pointer-events-none"
        aria-hidden="true"
        v-html="highlightedText"
      ></div>

      <!-- Actual Input (Transparent Text) -->
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search (e.g. 'Lunch', 'is:expense', 'from:2025-01-01')..."
        class="relative z-0 w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-transparent caret-gray-900 dark:caret-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        @input="handleInput"
        @scroll="syncScroll"
      />

      <!-- Clear Button -->
      <button
        v-if="searchQuery"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
        @click="clear"
      >
        <i class="pi pi-times" />
      </button>
    </div>
  </div>
</template>

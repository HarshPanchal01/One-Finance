<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useFinanceStore } from "../stores/finance";
import DatePicker from "primevue/datepicker";

const store = useFinanceStore();
const searchText = ref("");
const searchInput = ref<HTMLInputElement | null>(null);

// Search State
const selectedCategoryIds = ref<number[]>([]);
const dateRange = ref<Date[] | null>(null);
const minAmount = ref<number | null>(null);
const maxAmount = ref<number | null>(null);

// Label Picker State
const showLabelPicker = ref(false);
const labelPickerRef = ref<HTMLDivElement | null>(null);
const labelSearch = ref("");

// Amount Picker State
const showAmountPicker = ref(false);
const amountPickerRef = ref<HTMLDivElement | null>(null);

// Date Picker State
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const datePicker = ref<any>(null); // Use 'any' to avoid type issues with PrimeVue methods

// Helper to check if a category is selected
function isCategorySelected(id: number): boolean {
  return selectedCategoryIds.value.includes(id);
}

// Toggle a category selection
function toggleCategory(id: number) {
  if (selectedCategoryIds.value.includes(id)) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter(cId => cId !== id);
  } else {
    selectedCategoryIds.value.push(id);
  }
}

// Filter categories for the picker list
const pickerCategories = computed(() => {
  const term = labelSearch.value.toLowerCase();
  return store.categories.filter(c => c.name.toLowerCase().includes(term));
});

function toggleDatePicker() {
  const picker = datePicker.value;
  if (!picker) return;

  // Try standard methods if they exist
  if (typeof picker.show === "function") {
    picker.show();
  } else if (typeof picker.showOverlay === "function") {
    picker.showOverlay();
  } else if (typeof picker.onInputClick === "function") {
    // Fallback for some PrimeVue versions
    picker.onInputClick();
  } else {
    // Last resort: try to focus the input element if accessible
    const input = picker.$el.querySelector("input");
    if (input) {
      input.click();
      input.focus();
    }
  }
}

async function handleSearch() {
  // Format dates
  let fromDate: string | null = null;
  let toDate: string | null = null;

  if (dateRange.value && dateRange.value[0]) {
    fromDate = dateRange.value[0].toISOString().split('T')[0];
    if (dateRange.value[1]) {
      toDate = dateRange.value[1].toISOString().split('T')[0];
    }
  }

  await store.searchTransactions({
    text: searchText.value,
    categoryIds: [...selectedCategoryIds.value], // Unwrap proxy to plain array
    fromDate,
    toDate,
    minAmount: minAmount.value,
    maxAmount: maxAmount.value,
    type: null 
  });
}

function clear() {
  searchText.value = "";
  selectedCategoryIds.value = [];
  dateRange.value = null;
  minAmount.value = null;
  maxAmount.value = null;
  store.clearSearch();
  searchInput.value?.focus();
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  // Press '/' to focus search
  if (e.key === "/" && document.activeElement !== searchInput.value && !showLabelPicker.value && !showAmountPicker.value) {
    e.preventDefault();
    searchInput.value?.focus();
    return;
  }

  // Search on Enter
  if (e.key === "Enter" && !showLabelPicker.value && !showAmountPicker.value) {
    handleSearch();
  }
}

// Click outside handler for Pickers
function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (labelPickerRef.value && !labelPickerRef.value.contains(target)) {
    showLabelPicker.value = false;
  }
  if (amountPickerRef.value && !amountPickerRef.value.contains(target)) {
    showAmountPicker.value = false;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("click", handleClickOutside);
  if (store.categories.length === 0) {
    store.fetchCategories();
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-[1.050rem] flex items-center justify-center"
  >
    <div class="relative w-full max-w-xl group flex gap-2">
      <!-- Search Input Container -->
      <div class="relative flex-grow flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
        <!-- Label Picker Button -->
        <div
          ref="labelPickerRef"
          class="relative ml-1"
        >
          <button
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
            title="Filter by Label"
            @click.stop="showLabelPicker = !showLabelPicker"
          >
            <i
              class="pi pi-tags"
              :class="selectedCategoryIds.length > 0 ? 'text-primary-500' : ''"
            />
            <span
              v-if="selectedCategoryIds.length > 0"
              class="text-xs font-bold bg-primary-100 text-primary-700 px-1 rounded"
            >
              {{ selectedCategoryIds.length }}
            </span>
          </button>

          <!-- Label Picker Dropdown -->
          <div
            v-if="showLabelPicker"
            class="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
          >
            <div class="p-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2 px-1">Filter Labels</span>
              <input
                v-model="labelSearch"
                type="text"
                placeholder="Filter labels..."
                class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none transition-all"
                autoFocus
                @click.stop
              />
            </div>
            
            <div class="max-h-60 overflow-y-auto p-1 space-y-0.5">
              <div
                v-if="pickerCategories.length === 0"
                class="px-3 py-2 text-sm text-gray-500 text-center"
              >
                No labels found
              </div>
              <button
                v-for="category in pickerCategories"
                :key="category.id"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click.stop="toggleCategory(category.id)"
              >
                <!-- Checkbox visual -->
                <div 
                  class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  :class="isCategorySelected(category.id) 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'"
                />

                <!-- Icon & Name -->
                <i
                  :class="['pi', category.icon]"
                  :style="{ color: category.colorCode }"
                />
                <span class="text-gray-900 dark:text-white truncate flex-1">{{ category.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Date Picker Button/Popup -->
        <div class="relative ml-1">
          <!-- Hidden DatePicker, triggered by button -->
          <DatePicker 
            ref="datePicker"
            v-model="dateRange" 
            selection-mode="range" 
            :manual-input="false"
            date-format="yy-mm-dd"
            class="absolute opacity-0 w-1 h-1 overflow-hidden"
          />
           
          <button
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
            title="Filter by Date"
            @click="toggleDatePicker"
          >
            <i
              class="pi pi-calendar"
              :class="dateRange ? 'text-primary-500' : ''"
            />
            <span
              v-if="dateRange"
              class="w-2 h-2 rounded-full bg-primary-500 absolute top-1 right-1"
            />
          </button>
        </div>

        <!-- Amount Picker -->
        <div
          ref="amountPickerRef"
          class="relative ml-1"
        >
          <button
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
            title="Filter by Amount"
            @click.stop="showAmountPicker = !showAmountPicker"
          >
            <i
              class="pi pi-dollar"
              :class="(minAmount !== null || maxAmount !== null) ? 'text-primary-500' : ''"
            />
            <span
              v-if="(minAmount !== null || maxAmount !== null)"
              class="w-2 h-2 rounded-full bg-primary-500 absolute top-1 right-1"
            />
          </button>

          <!-- Amount Picker Dropdown -->
          <div
            v-if="showAmountPicker"
            class="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden p-3 space-y-3"
            @click.stop
          >
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min Amount</label>
              <input
                v-model.number="minAmount"
                type="number"
                placeholder="0.00"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Amount</label>
              <input
                v-model.number="maxAmount"
                type="number"
                placeholder="∞"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>
        </div>
        
        <!-- Separator -->
        <div class="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

        <!-- Search Input -->
        <input
          ref="searchInput"
          v-model="searchText"
          type="text"
          placeholder="Search transactions..."
          class="flex-grow py-2 pr-20 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
          @keydown="handleKeydown"
        />

        <!-- Actions (Right) -->
        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          <button
            v-if="searchText || selectedCategoryIds.length > 0 || dateRange || minAmount !== null || maxAmount !== null"
            class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Clear Filters"
            @click="clear"
          >
            <i class="pi pi-times" />
          </button>

          <button
            class="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Search"
            @click="handleSearch"
          >
            <i class="pi pi-search" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

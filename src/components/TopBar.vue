<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useFinanceStore } from "../stores/finance";
import DatePicker from "primevue/datepicker";

const props = defineProps<{
  initialAccountId?: number | null;
}>();

const store = useFinanceStore();
const searchText = ref("");
const searchInput = ref<HTMLInputElement | null>(null);

// Search State
const selectedCategoryIds = ref<number[]>([]);
const selectedAccountIds = ref<number[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateRange = ref<any>(null);
const minAmount = ref<number | null>(null);
const maxAmount = ref<number | null>(null);

// Label Picker State
const showLabelPicker = ref(false);
const labelPickerRef = ref<HTMLDivElement | null>(null);
const labelSearch = ref("");

// Account Picker State
const showAccountPicker = ref(false);
const accountPickerRef = ref<HTMLDivElement | null>(null);
const accountSearch = ref("");

// Amount Picker State
const showAmountPicker = ref(false);
const amountPickerRef = ref<HTMLDivElement | null>(null);

// Date Picker State
interface DatePickerRef {
  show?: () => void;
  showOverlay?: () => void;
  onInputClick?: () => void;
  $el: HTMLElement;
}
const datePicker = ref<DatePickerRef | null>(null);

// Helper to check if a category is selected
function isCategorySelected(id: number): boolean {
  return selectedCategoryIds.value.includes(id);
}

// Toggle a category selection
async function toggleCategory(id: number) {
  if (selectedCategoryIds.value.includes(id)) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter(cId => cId !== id);
  } else {
    selectedCategoryIds.value.push(id);
  }
  await handleSearch();
}

// Helper to check if an account is selected
function isAccountSelected(id: number): boolean {
  return selectedAccountIds.value.includes(id);
}

// Toggle an account selection
async function toggleAccount(id: number) {
  if (selectedAccountIds.value.includes(id)) {
    selectedAccountIds.value = selectedAccountIds.value.filter(aId => aId !== id);
  } else {
    selectedAccountIds.value.push(id);
  }
  await handleSearch();
}

function applyAmountFilter() {
  handleSearch();
  showAmountPicker.value = false;
}

// Filter categories for the picker list
const pickerCategories = computed(() => {
  const term = labelSearch.value.toLowerCase();
  return store.categories.filter(c => c.name.toLowerCase().includes(term));
});

// Filter accounts for the picker list
const pickerAccounts = computed(() => {
  const term = accountSearch.value.toLowerCase();
  return store.accounts.filter(a => a.accountName.toLowerCase().includes(term));
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

// Toggle pickers exclusively
function togglePicker(picker: 'label' | 'account' | 'amount') {
  if (picker === 'label') {
    showLabelPicker.value = !showLabelPicker.value;
    showAccountPicker.value = false;
    showAmountPicker.value = false;
  } else if (picker === 'account') {
    showAccountPicker.value = !showAccountPicker.value;
    showLabelPicker.value = false;
    showAmountPicker.value = false;
  } else if (picker === 'amount') {
    showAmountPicker.value = !showAmountPicker.value;
    showLabelPicker.value = false;
    showAccountPicker.value = false;
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

  // If all accounts are selected, we can optionally send empty array to imply "all" 
  // OR send them all. The backend logic `AND t.accountId IN (...)` requires explicit IDs 
  // if the array is not empty. If it IS empty, the backend logic I wrote earlier:
  // `if (accountIds.length > 0) ...`
  // So if I send [] it means "no filter" -> "all transactions".
  // BUT, "no filter" also includes transactions with NULL accountId (if any).
  // The user wants to filter BY account.
  // If I uncheck one, I want to see transactions from the others.
  // If I uncheck ALL, I probably see none? Or all?
  // Usually in these filters:
  // - All Checked = All shown.
  // - None Checked = None shown (or All shown, depending on UX).
  // Let's stick to: Send the list of selected IDs.
  // If the list is equal to ALL accounts, it's effectively "All Accounts".
  
  await store.searchTransactions({
    text: searchText.value,
    categoryIds: [...selectedCategoryIds.value],
    accountIds: [...selectedAccountIds.value],
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
  selectedAccountIds.value = [];
  dateRange.value = null;
  minAmount.value = null;
  maxAmount.value = null;
  store.clearSearch();
  searchInput.value?.focus();
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  // Press '/' to focus search
  if (e.key === "/" && document.activeElement !== searchInput.value && !showLabelPicker.value && !showAmountPicker.value && !showAccountPicker.value) {
    e.preventDefault();
    searchInput.value?.focus();
    return;
  }

  // Search on Enter
  if (e.key === "Enter" && !showLabelPicker.value && !showAmountPicker.value && !showAccountPicker.value) {
    handleSearch();
  }
}

// Click outside handler for Pickers
function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (labelPickerRef.value && !labelPickerRef.value.contains(target)) {
    showLabelPicker.value = false;
  }
  if (accountPickerRef.value && !accountPickerRef.value.contains(target)) {
    showAccountPicker.value = false;
  }
  if (amountPickerRef.value && !amountPickerRef.value.contains(target)) {
    showAmountPicker.value = false;
  }
}

async function checkInitialAccountId(id?: number | null) {
  if (id) {
    selectedAccountIds.value = [id];
    await handleSearch();
  }
}

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("click", handleClickOutside);
  
  // Ensure data is loaded
  if (store.categories.length === 0) {
    await store.fetchCategories();
  }
  if (store.accounts.length === 0) {
    await store.fetchAccounts();
  }

  checkInitialAccountId(props.initialAccountId);
});

watch(() => props.initialAccountId, (newId) => {
  checkInitialAccountId(newId);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("click", handleClickOutside);
  store.clearSearch();
});
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-[1.050rem] flex items-center justify-center"
  >
    <div class="relative w-full max-w-xl group flex gap-2">
      <!-- Search Input Container -->
      <div class="relative flex-grow flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
        <!-- Account Picker Button -->
        <div
          ref="accountPickerRef"
          class="relative ml-1"
        >
          <button
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
            title="Filter by Account"
            @click.stop="togglePicker('account')"
          >
            <i
              class="pi pi-wallet"
              :class="selectedAccountIds.length > 0 ? 'text-primary-500' : ''"
            />
            <span
              v-if="selectedAccountIds.length > 0"
              class="text-xs font-bold bg-primary-100 text-primary-700 px-1 rounded"
            >
              {{ selectedAccountIds.length }}
            </span>
          </button>

          <!-- Account Picker Dropdown -->
          <div
            v-if="showAccountPicker"
            class="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
          >
            <div class="p-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2 px-1">Filter Accounts</span>
              <input
                v-model="accountSearch"
                type="text"
                placeholder="Filter accounts..."
                class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none transition-all"
                autofocus
                @click.stop
              />
            </div>
            
            <div class="max-h-60 overflow-y-auto p-1 space-y-0.5">
              <div
                v-if="pickerAccounts.length === 0"
                class="px-3 py-2 text-sm text-gray-500 text-center"
              >
                No accounts found
              </div>
              <button
                v-for="account in pickerAccounts"
                :key="account.id"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click.stop="toggleAccount(account.id)"
              >
                <!-- Checkbox visual -->
                <div 
                  class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  :class="isAccountSelected(account.id) 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'"
                />

                <span class="text-gray-900 dark:text-white truncate flex-1">{{ account.accountName }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Label Picker Button -->
        <div
          ref="labelPickerRef"
          class="relative ml-1"
        >
          <button
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
            title="Filter by Label"
            @click.stop="togglePicker('label')"
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
                autofocus
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
            @hide="handleSearch"
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
            @click.stop="togglePicker('amount')"
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
            <button
              class="w-1/2 mx-auto py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded transition-colors"
              @click="applyAmountFilter"
            >
              Apply
            </button>
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
            v-if="searchText || selectedCategoryIds.length > 0 || selectedAccountIds.length > 0 || dateRange || minAmount !== null || maxAmount !== null"
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

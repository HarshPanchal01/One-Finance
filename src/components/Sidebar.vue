<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useFinanceStore } from "@/stores/finance";
import { getMonthName } from "@/utils";
import YearDeleteModal from "@/components/YearDeleteModal.vue";
import logoUrl from "@/assets/logo.png";

const props = defineProps<{
  currentView: string;
}>();

const emit = defineEmits<{
  (e: "navigate", view: string): void;
}>();

const store = useFinanceStore();

// Track expanded years in the tree
const expandedYears = ref<Set<number>>(new Set());

// Context Menu State
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuYear = ref<number | null>(null);

// Modal states
const showAddYearModal = ref(false);
const newYear = ref(new Date().getFullYear());
const showDeleteYearModal = ref(false);
const yearToDelete = ref<number | null>(null);

// Navigation items
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "pi-home" },
  { id: "transactions", label: "Transactions", icon: "pi-list" },
  { id: "insights", label: "Insights", icon: "pi-chart-line" },
  { id: "accounts", label: "Accounts", icon: "pi-wallet" },
  { id: "categories", label: "Labels", icon: "pi-tags" },
  { id: "settings", label: "Settings", icon: "pi-cog" },
];

// Build the tree structure
interface YearNode {
  year: number;
  months: number[];
}

const ledgerTree = computed<YearNode[]>(() => {
  const tree: YearNode[] = [];

  for (const year of store.ledgerYears) {
    const months = store.ledgerMonths
      .filter((p) => p.year === year)
      .map((p) => p.month)
      .sort((a, b) => a - b);

    tree.push({ year, months });
  }

  return tree.sort((a, b) => b.year - a.year);
});

// Auto-expand current year
watch(
  () => store.currentLedgerMonth,
  (period) => {
    if (period) {
      expandedYears.value.add(period.year);
    }
  },
  { immediate: true },
);

// Toggle year expansion
function toggleYear(year: number) {
  if (expandedYears.value.has(year)) {
    expandedYears.value.delete(year);
  } else {
    expandedYears.value.add(year);
  }
}

// Select a period and navigate to transactions
async function selectPeriod(year: number, month: number) {
  await store.selectPeriod(year, month);
  emit("navigate", "transactions");
}

// Handle navigation click
async function handleNavClick(viewId: string) {
  // Always switch to Global View when clicking top-level navigation items
  // This ensures we don't get stuck in a specific month view when going to Dashboard, etc.
  await store.clearPeriod();
  emit("navigate", viewId);
}

// Check if period is selected
function isPeriodSelected(year: number, month: number): boolean {
  // Only highlight if we are effectively viewing transactions for this period
  if (props.currentView !== "transactions") {
    return false;
  }
  return (
    store.currentLedgerMonth?.year === year &&
    store.currentLedgerMonth?.month === month
  );
}

// Add new year
async function addYear() {
  await store.createYear(newYear.value);
  expandedYears.value.add(newYear.value);
  showAddYearModal.value = false;
  newYear.value = new Date().getFullYear();
}

// Delete year
function deleteYear(year: number) {
  yearToDelete.value = year;
  showDeleteYearModal.value = true;
}

// Confirm delete year
async function handleDeleteYearConfirm(deleteTransactions: boolean) {
  if (yearToDelete.value) {
    await store.deleteYear(yearToDelete.value, deleteTransactions);
    expandedYears.value.delete(yearToDelete.value);
  }
  showDeleteYearModal.value = false;
  yearToDelete.value = null;
}

// Open Context Menu
function openContextMenu(event: MouseEvent, year: number) {
  event.preventDefault();
  contextMenuYear.value = year;
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  contextMenuVisible.value = true;

  // Close menu when clicking elsewhere
  const closeMenu = () => {
    contextMenuVisible.value = false;
    document.removeEventListener("click", closeMenu);
  };
  // Use timeout to avoid immediate close
  window.setTimeout(() => document.addEventListener("click", closeMenu), 0);
}

async function viewYearDetails() {
  if (contextMenuYear.value) {
    await store.selectYear(contextMenuYear.value);
    emit("navigate", "transactions");
  }
  contextMenuVisible.value = false;
}

async function requestDeleteYear() {
  contextMenuVisible.value = false;
  if (contextMenuYear.value) {
    await deleteYear(contextMenuYear.value);
  }
}
</script>

<template>
  <aside
    class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
  >
    <!-- App Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-3">
        <img :src="logoUrl" alt="One Finance" class="w-10 h-10 rounded-xl" />
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">
            One Finance
          </h1>
          <p
            v-if="store.currentLedgerMonth"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ getMonthName(store.currentLedgerMonth.month) }}
            {{ store.currentLedgerMonth.year }}
          </p>
          <p
            v-else-if="store.selectedYear"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ store.selectedYear }} (All Months)
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400">
            Global View
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="p-2 border-b border-gray-200 dark:border-gray-700">
      <div class="space-y-1">
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="[
            'w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            currentView === item.id &&
            (!store.currentLedgerMonth || item.id !== 'transactions')
              ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
          ]"
          @click="handleNavClick(item.id)"
        >
          <i :class="['pi mr-3 text-base', item.icon]" />
          {{ item.label }}
        </button>
      </div>
    </nav>

    <!-- Ledger Header -->
    <div
      class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
    >
      <h2
        class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
      >
        Ledger
      </h2>
      <button
        class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors"
        title="Add Year"
        @click="showAddYearModal = true"
      >
        <i class="pi pi-plus text-sm" />
      </button>
    </div>

    <!-- Tree View -->
    <div class="flex-1 overflow-y-auto p-2">
      <!-- Empty State -->
      <div v-if="ledgerTree.length === 0" class="text-center py-8 px-4">
        <i
          class="pi pi-folder-open text-4xl text-gray-300 dark:text-gray-600 mb-3"
        />
        <p class="text-sm text-gray-500 dark:text-gray-400">No years yet</p>
        <button
          class="mt-3 text-sm text-primary-500 hover:text-primary-600 font-medium"
          @click="showAddYearModal = true"
        >
          + Add Year
        </button>
      </div>

      <!-- Year Nodes -->
      <div v-else class="space-y-1">
        <div v-for="yearNode in ledgerTree" :key="yearNode.year">
          <!-- Year Row -->
          <div class="group flex items-center">
            <button
              class="flex-1 flex items-center px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              @click="toggleYear(yearNode.year)"
              @contextmenu="openContextMenu($event, yearNode.year)"
            >
              <i
                :class="[
                  'pi text-xs mr-2 transition-transform text-gray-400',
                  expandedYears.has(yearNode.year)
                    ? 'pi-chevron-down'
                    : 'pi-chevron-right',
                ]"
              />
              <i class="pi pi-folder text-yellow-500 mr-2" />
              <span class="font-medium text-gray-900 dark:text-white">{{
                yearNode.year
              }}</span>
            </button>
          </div>

          <!-- Month Children -->
          <div
            v-if="expandedYears.has(yearNode.year)"
            class="ml-4 space-y-0.5 mt-0.5"
          >
            <button
              v-for="month in yearNode.months"
              :key="month"
              :class="[
                'w-full flex items-center px-2 py-1.5 rounded-lg text-left text-sm transition-colors',
                isPeriodSelected(yearNode.year, month)
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400',
              ]"
              @click="selectPeriod(yearNode.year, month)"
            >
              <i class="pi pi-calendar mr-2 text-xs" />
              {{ getMonthName(month) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Year Modal -->
    <Teleport to="body">
      <div
        v-if="showAddYearModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/50"
          @click="showAddYearModal = false"
        />
        <div
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add Year
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This will create all 12 months automatically.
          </p>
          <input
            v-model.number="newYear"
            type="number"
            min="2000"
            max="2100"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div class="flex justify-end space-x-3 mt-4">
            <button
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              @click="showAddYearModal = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              @click="addYear"
            >
              Add Year
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
        :style="{
          left: `${contextMenuPosition.x}px`,
          top: `${contextMenuPosition.y}px`,
        }"
      >
        <button
          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          @click="viewYearDetails"
        >
          <i class="pi pi-search mr-2" />
          View Year Details
        </button>
        <button
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
          @click="requestDeleteYear"
        >
          <i class="pi pi-trash mr-2" />
          Delete Year
        </button>
      </div>
    </Teleport>

    <YearDeleteModal
      :visible="showDeleteYearModal"
      :year="yearToDelete"
      @close="showDeleteYearModal = false"
      @confirm="handleDeleteYearConfirm"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useFinanceStore } from "./stores/finance";

// Components
import Sidebar from "./components/Sidebar.vue";
import TransactionModal from "./components/TransactionModal.vue";

// Views
import DashboardView from "./views/DashboardView.vue";
import TransactionsView from "./views/TransactionsView.vue";
import CategoriesView from "./views/CategoriesView.vue";
import SettingsView from "./views/SettingsView.vue";

const store = useFinanceStore();

// Current view
type ViewName = "dashboard" | "transactions" | "categories" | "settings";
const currentView = ref<ViewName>("dashboard");

// Quick add transaction modal
const showQuickAddModal = ref(false);

// Navigate to view
function navigateTo(view: string) {
  currentView.value = view as ViewName;

  if (view === "dashboard") {
    // Keep the current period context when going to Dashboard
    // But fetch summary to ensure cards are up to date
    store.fetchPeriodSummary();
  }
  // Transactions logic is handled by Sidebar emitting specific events or store actions
}

// Initialize on mount
onMounted(async () => {
  await store.initialize();

  // Add keyboard shortcuts
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case "n":
        e.preventDefault();
        showQuickAddModal.value = true;
        break;
      case "d":
        e.preventDefault();
        currentView.value = "dashboard";
        break;
      case "t":
        e.preventDefault();
        currentView.value = "transactions";
        break;
      case "g":
        e.preventDefault();
        currentView.value = "categories";
        break;
    }
  }
}
</script>

<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Sidebar -->
    <Sidebar
      :current-view="currentView"
      @navigate="navigateTo"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto p-6">
        <!-- Loading State -->
        <div
          v-if="store.isLoading"
          class="flex items-center justify-center py-12"
        >
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"
          />
        </div>

        <!-- Error State -->
        <div
          v-else-if="store.error"
          class="card p-6 text-center"
        >
          <i class="pi pi-exclamation-circle text-4xl text-expense mb-3" />
          <p class="text-expense">
            {{ store.error }}
          </p>
        </div>

        <!-- Views -->
        <template v-else>
          <DashboardView
            v-if="currentView === 'dashboard'"
            @add-transaction="showQuickAddModal = true"
          />
          <TransactionsView v-else-if="currentView === 'transactions'" />
          <CategoriesView v-else-if="currentView === 'categories'" />
          <SettingsView v-else-if="currentView === 'settings'" />
        </template>
      </main>
    </div>

    <!-- Quick Add Transaction Modal -->
    <TransactionModal
      :visible="showQuickAddModal"
      :default-year="store.currentPeriod?.year"
      :default-month="store.currentPeriod?.month"
      @close="showQuickAddModal = false"
      @saved="showQuickAddModal = false"
    />
  </div>
</template>

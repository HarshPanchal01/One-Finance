<script setup lang="ts">
import { ref, onMounted } from "vue";

const appVersion = "0.0.1";
const dbPath = ref("");

// Keyboard shortcuts
const shortcuts = [
  { keys: ["Ctrl", "N"], description: "New transaction" },
  { keys: ["Ctrl", "D"], description: "Go to Dashboard" },
  { keys: ["Ctrl", "T"], description: "Go to Transactions" },
  { keys: ["Ctrl", "G"], description: "Go to Categories" },
];

// Load DB path on mount
onMounted(async () => {
  dbPath.value = await window.electronAPI.getDbPath();
});

// Open DB location in file manager
async function openDbLocation() {
  await window.electronAPI.openDbLocation();
}

// Delete database (dev only)
async function deleteDatabase() {
  if (
    confirm(
      "⚠️ DELETE DATABASE?\n\nThis will permanently delete all your financial data including:\n- All transactions\n- All categories\n- All ledger periods\n\nThe app will close after deletion. Are you sure?"
    )
  ) {
    const success = await window.electronAPI.deleteDatabase();
    if (success) {
      alert(
        "Database deleted. Please restart the application (run npm run dev)."
      );
      window.close();
    } else {
      alert("Failed to delete database. Please try closing the app first.");
    }
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <!-- App Info -->
    <div class="card p-6">
      <div class="flex items-center space-x-4 mb-4">
        <div
          class="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center"
        >
          <i class="pi pi-dollar text-3xl text-white" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            One Finance
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Version {{ appVersion }}
          </p>
        </div>
      </div>

      <p class="text-gray-600 dark:text-gray-300">
        A local-first personal finance manager. Your data stays on your device,
        giving you complete privacy and control over your financial information.
      </p>
    </div>

    <!-- Keyboard Shortcuts -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-keyboard mr-2" />
        Keyboard Shortcuts
      </h3>

      <div class="space-y-3">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.description"
          class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <span class="text-gray-600 dark:text-gray-300">{{
            shortcut.description
          }}</span>
          <div class="flex items-center space-x-1">
            <kbd
              v-for="key in shortcut.keys"
              :key="key"
              class="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600"
            >
              {{ key }}
            </kbd>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-database mr-2" />
        Data Management
      </h3>

      <div class="space-y-4">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Your data is stored locally in a SQLite database on your computer.
            No data is sent to any external servers.
          </p>
          <p
            class="text-xs text-gray-500 dark:text-gray-500 font-mono break-all"
          >
            {{ dbPath }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="openDbLocation"
          >
            <i class="pi pi-folder-open mr-2" />
            Open DB Location
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <i class="pi pi-download mr-2" />
            Export Data
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <i class="pi pi-upload mr-2" />
            Import Data
          </button>
        </div>
      </div>
    </div>

    <!-- Developer Options -->
    <div class="card p-6 border-2 border-dashed border-expense/30">
      <h3
        class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
      >
        <i class="pi pi-code mr-2 text-expense" />
        Developer Options
        <span
          class="ml-2 px-2 py-0.5 text-xs bg-expense/10 text-expense rounded"
        >DEV</span>
      </h3>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          ⚠️ These options are for development and testing purposes only. Use
          with caution.
        </p>

        <button
          class="inline-flex items-center px-4 py-2 bg-expense/10 border border-expense/30 rounded-lg text-expense hover:bg-expense/20 transition-colors"
          @click="deleteDatabase"
        >
          <i class="pi pi-trash mr-2" />
          Delete Database
        </button>
      </div>
    </div>

    <!-- About -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-info-circle mr-2" />
        About
      </h3>

      <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong class="text-gray-900 dark:text-white">Built with:</strong>
          Vue 3, TypeScript, Tailwind CSS, PrimeVue, Electron
        </p>
        <p>
          <strong class="text-gray-900 dark:text-white">Database:</strong>
          SQLite (better-sqlite3)
        </p>
        <p>
          <strong class="text-gray-900 dark:text-white">License:</strong>
          MIT
        </p>
      </div>
    </div>
  </div>
</template>

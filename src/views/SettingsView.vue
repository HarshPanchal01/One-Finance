<script setup lang="ts">
import { ref, onMounted } from "vue";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import { useFinanceStore } from "@/stores/finance";
import { Account, AccountType, Category, LedgerPeriod, TransactionWithCategory } from "@/types";

const appVersion = "0.0.1";
const dbPath = ref("");
const confirmModal = ref<InstanceType<typeof ConfirmationModal>>();
const errorModal = ref<InstanceType<typeof ErrorModal>>();

const store = useFinanceStore();

// Keyboard shortcuts
const shortcuts = [
  { keys: ["Ctrl", "N"], description: "New transaction" },
  { keys: ["Ctrl", "D"], description: "Go to Dashboard" },
  { keys: ["Ctrl", "T"], description: "Go to Transactions" },
  { keys: ["Ctrl", "Shift", "C"], description: "Go to Categories" },
  { keys: ["Ctrl", "Shift", "A"], description: "Go to Accounts" },
  { keys: ["Ctrl", "Shift", "S"], description: "Go to Settings" },
  { keys: ["/"], description: "Go to Search Bar"}
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
  const confirmed = await confirmModal.value?.openConfirmation({
    title: "⚠️ DELETE DATABASE?",
    message: "This will permanently delete all your financial data including:\n- All transactions\n- All accounts\n- All ledger periods.\n\nThe app will close after deletion. Are you sure?",
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (confirmed) {
    const success = await window.electronAPI.deleteDatabase();
    if (success) {
      await errorModal.value?.openConfirmation({
        title: "Database Deleted",
        message: "Database deleted. Please restart the application (run npm run dev).",
        confirmText: "Okay",
      });
      window.close();
    } else {
      await errorModal.value?.openConfirmation({
        title: "Error",
        message: "Failed to delete database. Please try closing the app first.",
        confirmText: "Okay",
      });
    }
  }
}

async function exportData() {

  const accountsValue = store.accounts;
  const transactionsValue = store.transactions;
  const categoriesValue = store.categories;
  const accountTypesValue = store.accountTypes;
  const ledgerPeriodsValue = store.ledgerPeriods;

  const data = {
    accounts: accountsValue,
    transactions: transactionsValue,
    categories: categoriesValue,
    accountTypes: accountTypesValue,
    ledgerPeriods: ledgerPeriodsValue,
  };


  const timestamp = new Date().toDateString();


  const dataStr = JSON.stringify(data, null, 2);
  
  const result = await window.electronAPI.exportDatabase({
    data: dataStr,
    defaultName: 'One-Finance Export ' + timestamp
  });


  if (!result.success){return}

  await errorModal.value?.openConfirmation({
        title: "Database Exported",
        message: "A JSON file is available with the data at the location",
        confirmText: "Okay",
  });


}

function verifyImportData(data: {
  accounts?: Account[],
  transactions?: TransactionWithCategory[],
  categories?: Category[],
  accountTypes?: AccountType[],
  ledgerPeriods?: LedgerPeriod[]
}): boolean 
{

  const accounts = data.accounts;
  const transactions = data.transactions;
  const categories = data.categories;
  const accountTypes = data.accountTypes;
  const ledgerPeriods = data.ledgerPeriods;

  if (accounts == undefined || transactions == undefined || categories == undefined || accountTypes == undefined || ledgerPeriods == undefined){
    return false
  }

  accounts.forEach((value) => {
    if (value.accountName == undefined || value.accountTypeId == undefined || value.id == undefined || value.startingBalance == undefined || value.isDefault == undefined){
      return false;
    }
  })

  transactions.forEach((value) => {
    if (
      value.id == undefined ||
      value.ledgerPeriodId == undefined ||
      value.title == undefined ||
      value.amount == undefined ||
      value.date == undefined ||
      value.type == undefined ||
      value.notes == undefined ||
      value.categoryId == undefined ||
      value.accountId == undefined ||
      value.categoryName == undefined ||
      value.categoryColor == undefined ||
      value.categoryIcon == undefined
  ){
      return false;
    }
  })

  accountTypes.forEach((value) => {
    if (value.id == undefined || value.type == undefined){
      return false;
    }
  })

  categories.forEach((value) => {
    if (value.id == undefined || value.name == undefined || value.colorCode == undefined || value.icon == undefined){
      return false;
    }
  })

  ledgerPeriods.forEach((value) => {
    if (value.id == undefined || value.month == undefined || value.year == undefined){
      return false;
    }
  })

  return true;
}

async function insertImportData(data: {
  accounts?: Account[],
  transactions?: TransactionWithCategory[],
  categories?: Category[],
  accountTypes?: AccountType[],
  ledgerPeriods?: LedgerPeriod[]
}) {

  
  const accounts = data.accounts!;
  const transactions = data.transactions!;
  const categories = data.categories!;
  const accountTypes = data.accountTypes!;
  const ledgerPeriods = data.ledgerPeriods!;

  console.log(accountTypes);

  for (const accountType of accountTypes){

    if (store.accountTypes.find((value) => value.id === accountType.id) != undefined) {
      console.log("Account type id: %d name: %s already exists, skipping", accountType.id, accountType.type);
      continue
    }

    console.log("Inserting account type id: %d name: %s", accountType.id, accountType.type);
    await store.addAccountType(accountType);
  }

  for (const account of accounts){

    if (store.accounts.find((value) => value.id === account.id) != undefined) {
      continue
    }
    await store.addAccount(account);

  }

  for (const category of categories){

    if (store.categories.find((value) => value.id === category.id || value.id) != undefined) {
      continue
    }

    await store.addCategory(category.name, category.colorCode, category.icon);
  }

  for (const ledgerPeriod of ledgerPeriods){

    if (store.ledgerPeriods.find((value) => value.id === ledgerPeriod.id) != undefined) {
      continue
    }

    await store.createYear(ledgerPeriod.year);
  }

  for (const transaction of transactions){

    if (store.transactions.find((value) => value.id === transaction.id) != undefined) {
      continue
    }

    await store.addTransaction({
        title: transaction.title,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        categoryId: transaction.categoryId ?? undefined,
        accountId: transaction.accountId!,
        notes: transaction.notes || undefined,
      }
    );
  }
}


async function importData() {

  const result = await window.electronAPI.importDatabase();

  if (!result.success || result.data == undefined) {return}

  const verified = verifyImportData(result.data);

  if (!verified) {
    return await errorModal.value?.openConfirmation({
      title: "Import Error",
      message: "The selected file is not a valid One Finance export file.",
      confirmText: "Okay",
    });
  }

  const replace = await confirmModal.value?.openConfirmation({
    title: "Append Data",
    message: "Would you like to append the imported data or replace current data? Appended items that are duplicates will be skipped. Replacing current data is unrecoverable",
    confirmText: "Replace Data",
    cancelText: "Append Data",
  });


  if (replace){

    await store.deleteAllDataFromTables();


    await insertImportData(result.data);


  }
  else{
    
    await insertImportData(result.data);

  }

  
}
</script>

<template>
  <div class="space-y-6 flex-col items-center mt-8 mb-8 mr-32 ml-32">
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
            @click="exportData"
            >
            <i class="pi pi-download mr-2" />
            
            Export Data
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="importData"
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
  <ConfirmationModal ref="confirmModal" />
  <ErrorModal ref="errorModal" />
</template>
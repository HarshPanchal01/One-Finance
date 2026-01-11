<script setup lang="ts">
import { ref, onMounted, toRaw } from "vue";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import { useFinanceStore } from "@/stores/finance";
import { Account, AccountType, Category, TransactionWithCategory } from "@/types";
import NotificationModal from "@/components/NotificationModal.vue";
import SettingsImportModal from "./components/SettingsImportModal.vue";

const appVersion = "0.0.1";
const dbPath = ref("");
const confirmModal = ref<InstanceType<typeof ConfirmationModal>>();
const errorModal = ref<InstanceType<typeof ErrorModal>>();
const notificationModal = ref<InstanceType<typeof NotificationModal>>();
const actionModal = ref<InstanceType<typeof SettingsImportModal>>();

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
      await notificationModal.value?.openConfirmation({
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

  const accountsValue = toRaw(store.accounts);
  const transactionsValue = toRaw(store.transactions);
  const categoriesValue = toRaw(store.categories);
  const accountTypesValue = toRaw(store.accountTypes);
  const ledgerYearsValue = toRaw(store.ledgerYears);

  const data = {
    accounts: accountsValue,
    transactions: transactionsValue,
    categories: categoriesValue,
    accountTypes: accountTypesValue,
    ledgerYears: ledgerYearsValue,
  };


  const timestamp = new Date().toDateString();


  const dataStr = JSON.stringify(data, null, 2);
  
  const result = await window.electronAPI.exportDatabase({
    data: dataStr,
    defaultName: 'One-Finance Export ' + timestamp
  });


  if (!result.success){return}

  await notificationModal.value?.openConfirmation({
        title: "Database Exported",
        message: "A JSON file is available with the data at the location",
        confirmText: "Okay",
  });


}

function isValidHexColor(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

function verifyImportData(data: {
  accounts?: Account[],
  transactions?: TransactionWithCategory[],
  categories?: Category[],
  accountTypes?: AccountType[],
  ledgerYears?: number[]
}): boolean 
{

  try{
    const accounts = data.accounts;
    const transactions = data.transactions;
    const categories = data.categories;
    const accountTypes = data.accountTypes;
    const ledgerYears = data.ledgerYears;

    if (accounts == undefined || transactions == undefined || categories == undefined || accountTypes == undefined || ledgerYears == undefined){
      return false
    }

    let forEachResult = true;
    
    accounts.forEach((value) => {

      // Accounts essentials
      if (value.accountName == undefined || value.accountTypeId == undefined || value.id == undefined || value.startingBalance == undefined || value.isDefault == undefined){
        forEachResult = false;
        return;
      }

      // Check if account type id is values
      if (accountTypes.find((accountTypeValue) => accountTypeValue.id === value.accountTypeId) == undefined){
        forEachResult = false;
        return;
      }
    });

    transactions.forEach((value) => {

      // Check for transaction essentials
      if (
        value.id == undefined ||
        value.title == undefined ||
        value.amount == undefined ||
        value.date == undefined ||
        value.type == undefined ||
        value.accountId == undefined
      ){
        forEachResult = false;
        return;
      }

      // Check if category provided in transaction is valid
      if (value.categoryId != undefined){
        if (value.categoryName == undefined || value.categoryColor == undefined || value.categoryIcon == undefined){
          forEachResult = false;
          return;
        }
        if (categories.find((categoryValue) => categoryValue.id === value.categoryId) == undefined){
          forEachResult = false;
          return;
        }
        if (!isValidHexColor(value.categoryColor)){
          forEachResult = false;
          return;
        }
      }

      // Check if account provided in transaction is valid
      if (accounts.find((accountValue) => accountValue.id === value.accountId) == undefined){
        forEachResult = false;
        return;
      }

    });

    accountTypes.forEach((value) => {
      if (value.id == undefined || value.type == undefined){
        forEachResult = false;
        return;
      }
    });

    categories.forEach((value) => {
      if (value.id == undefined || value.name == undefined || value.colorCode == undefined || value.icon == undefined){
        forEachResult = false;
        return;
      }
      if (!isValidHexColor(value.colorCode)){
        forEachResult = false;
        return;
      }
    });

    ledgerYears.forEach((value) => {
      if (value == undefined){
        forEachResult = false;
        return;
      }
    });

    return forEachResult;
  } catch(e){
    console.log(`Error verifying import data ${e}`)
    return false;
  }
  
}



async function insertImportData(data: {
  accounts?: Account[],
  transactions?: TransactionWithCategory[],
  categories?: Category[],
  accountTypes?: AccountType[],
  ledgerYears?: number[]
}, skipDuplicates: boolean): Promise<boolean> {

  
  const accounts = data.accounts!;
  const transactions = data.transactions!;
  const categories = data.categories!;
  const accountTypes = data.accountTypes!;
  const ledgerYears = data.ledgerYears!;

  // console.log(accounts);
  // console.log(transactions);
  // console.log(accountTypes);

  const accountTypeIdMap = new Map<number, number>();
  const categoryTypeIdMap = new Map<number, number>();
  const accountIdMap = new Map<number, number>();

  
  try {
    for (const accountType of accountTypes){

      if (skipDuplicates){
        // Check for existing account type
        const existing = store.accountTypes.find((at) => at.type === accountType.type);
        if (existing){
          accountTypeIdMap.set(accountType.id, existing.id);
          console.log(`Skipping inserting existing account type ${accountType.type}`);
          continue;
        }
      }
  
      const result = await store.addAccountType(accountType);

      console.log(`Inserting account type ${accountType.type} resulted in id ${result}`);
  
      if (result == null){
        throw new Error("Resulting Id from inserting of account type is null");
      }
  
      accountTypeIdMap.set(accountType.id, result);
    }
  
    for (const account of accounts){

      if (skipDuplicates){
        // Check for existing account
        const existing = store.accounts.find((a) => a.accountName === account.accountName && a.institutionName === account.institutionName);
        if (existing){
          accountIdMap.set(account.id, existing.id);
          console.log(`Skipping inserting existing account ${account.accountName}`);
          continue;
        }
      }
  
      const accountTypeId = accountTypeIdMap.get(account.accountTypeId);
  
      if (accountTypeId == undefined){
        throw new Error("Account type id mapping not found for account id: " + account.id);
      }
  
      account.accountTypeId = accountTypeId;
  
      const result = await store.addAccount(account);

      console.log(`Inserting account ${account.accountName} resulted in id ${result}`);
  
      if (result == null){
        throw new Error("Resulting Id from inserting of account is null");
      }
  
      accountIdMap.set(account.id, result);
  
    }
  
  
  
    for (const category of categories){

      // Check for existing category
      const existing = store.categories.find((c) => c.name === category.name);
      if (existing){
        categoryTypeIdMap.set(category.id, existing.id);
        console.log(`Skipping inserting existing category ${category.name}`);
        continue;
      }
  
      const result = await store.addCategory(category.name, category.colorCode, category.icon);

      console.log(`Inserting category ${category.name} resulted in id ${result}`);
  
      if (result == null){
        throw new Error("Resulting Id from inserting of category is null");
      }
  
      categoryTypeIdMap.set(category.id, result.id);
  
    }
  
  
    for (const ledgerYear of ledgerYears){

        if (skipDuplicates){
          // Check for existing ledger year
          const existing = store.ledgerYears.find((ly) => ly === ledgerYear);
          if (existing){
            console.log(`Skipping inserting existing ledger year ${ledgerYear}`);
            continue;
          }
        }
  
        await store.createYear(ledgerYear);

        console.log(`Inserting ledger year ${ledgerYear} completed`);
    }
  
    for (const transaction of transactions){

        if (skipDuplicates){
          // Check for existing transaction
          const existing = store.transactions.find((t) => t.title === transaction.title && t.amount === transaction.amount && t.date === transaction.date);
          if (existing){
            console.log(`Skipping inserting existing transaction ${transaction.title}`);
            continue;
          }
        }
  
        if (transaction.categoryId != undefined){
          const mappedCategoryId = categoryTypeIdMap.get(transaction.categoryId);
  
          if (mappedCategoryId == undefined){
            throw new Error("Category id mapping not found for transaction id: " + transaction.id);
          }
  
          transaction.categoryId = mappedCategoryId;
        }
  
        const mappedAccountId = accountIdMap.get(transaction.accountId);
  
        if (mappedAccountId == undefined){
          throw new Error("Account id mapping not found for transaction id: " + transaction.id);
        }
  
        transaction.accountId = mappedAccountId;
  
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
        console.log(`Inserting transaction ${transaction.title} completed`);
    }
  }
 catch (error) {
    console.log(error);
    return false;
  }

  return true;
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

  const response = await actionModal.value?.openConfirmation({
    title: "Import Data",
    message: "Choose how you want to import the data:",
  });


  if (response){

    if (response.action === 'replace') {
      await store.deleteAllDataFromTables();
  
      const success = await insertImportData(result.data, false);
  
      if (!success){
        return await errorModal.value?.openConfirmation({
          title: "Import Error",
          message: "An error occurred while importing data.",
          confirmText: "Okay",
        });
      }
    }

    else {
      const success = await insertImportData(result.data, response.skipDuplicates);
  
      if (!success){
        return await errorModal.value?.openConfirmation({
          title: "Import Error",
          message: "An error occurred while importing data.",
          confirmText: "Okay",
        });
      }
    }

  } else {
    return; 
  }

  return await notificationModal.value?.openConfirmation({
        title: "Import Successful",
        message: "Data imported successfully.",
        confirmText: "Okay",
  });
  
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
  <NotificationModal ref="notificationModal" />
  <SettingsImportModal ref="actionModal" />
</template>
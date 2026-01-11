<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 h-14 bg-gray-100">
      <div>
        <h2 class="text-xl font-bold text-gray-900">
          Accounts
        </h2>
        <p class="text-sm text-gray-500">
          <span>All Accounts</span> ({{ store.accounts.length }})
        </p>
      </div>
      <button
        class="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
        @click="openDialog = true"
      >
        <i class="pi pi-plus mr-2" />
        New Account
      </button>
    </header>

    <div class="mt-4 overflow-auto bg-white rounded-lg shadow">
      <AccountListView
        :account-array="state.accountArray"
        :highlighted-id="highlightedId"
        @edit="editAccount"
        @delete="deleteAccount"
        @view-transactions="viewTransactions"
      />
    </div>

    <div
      v-if="openDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h2 class="text-xl font-bold mb-4">
          Add New Account
        </h2>

        <form
          class="space-y-4"
          @submit.prevent="submitForm"
        >
          <div>
            <label class="block text-sm font-medium mb-1">Account Name</label>
            <input
              v-model="form.accountName"
              type="text"
              class="w-full border px-3 py-2 rounded"
              required
              placeholder="Type account name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Institution</label>
            <input
              v-model="form.institutionName"
              type="text"
              class="w-full border px-3 py-2 rounded"
              placeholder="Type institution name"
            />
          </div>
          
          <!-- Amount -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Starting Balance
            </label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              >$</span>
              <input
                v-model.number="form.startingBalance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Account Type</label>
            <select
              v-model="form.accountType"
              class="w-full border px-3 py-2 rounded"
              required
            >
              <option
                v-for="type in state.accountTypeArray"
                :key="type.id"
                :value="type.id"
              >
                {{ type.type }}
              </option>
            </select>
          </div>
          <div class="flex items-center space-x-2">
            <input
              v-model="form.isDefault"
              type="checkbox"
              class="h-4 w-4 appearance-none rounded-md border border-gray-400
                    checked:bg-primary-500 checked:bg-primary-500 hover:bg-primary-300
                    "
            />
            <label
              for="isDefault"
              class="text-sm font-medium"
            >Set as Default</label>
          </div>

          <div class="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              class="px-4 py-2 border rounded hover:bg-gray-100"
              @click="closeDialog"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <AccountDeleteModal
    :visible="showDeleteModal"
    :account="accountToDelete"
    @close="showDeleteModal = false"
    @confirm="handleDeleteConfirm"
  />
  <ErrorModal ref="errorModal" />
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue';
import { useFinanceStore } from '@/stores/finance';
import AccountListView from './components/AccountListView.vue';
import { Account } from '@/types';
import ErrorModal from '@/components/ErrorModal.vue';
import AccountDeleteModal from './components/AccountDeleteModal.vue';

const props = defineProps<{
  highlightAccountId?: number | null;
}>();

const emit = defineEmits<{
  (e: "request-view-transactions", id: number): void;
}>();

const store = useFinanceStore();

//Deep copy because the compiler is stupid and can't handle nested reactives
const accounts = store.accounts.filter(() => true);
const accountsTypeArray = store.accountTypes.filter(() => true);
const errorModal = ref<InstanceType<typeof ErrorModal>>();

const openDialog = ref(false);
const showDeleteModal = ref(false);
const accountToDelete = ref<Account | null>(null);
const highlightedId = ref<number | null>(null);

let isEdit = false;
let accountEditId = 0;

const state = reactive({
  accountArray: accounts,
  accountTypeArray: accountsTypeArray
});

function highlightAccount(id?: number | null) {
  if (id) {
    highlightedId.value = id;
    // Clear highlight after animation
    window.setTimeout(() => {
      highlightedId.value = null;
    }, 2000);
  }
}

onMounted(async () => {
  await store.fetchAccounts();
  await store.fetchAccountTypes();
  state.accountArray = store.accounts;
  highlightAccount(props.highlightAccountId);
});

watch(() => props.highlightAccountId, (newId) => {
  highlightAccount(newId);
});

const form = reactive({
  accountName: '',
  institutionName: '',
  startingBalance: 0,
  accountType: 0,
  isDefault: false
});


function closeDialog() {
  openDialog.value = false;
  isEdit = false;
  accountEditId = 0;
  // Reset form object entirely
  Object.assign(form, {
    accountName: '',
    institutionName: '',
    startingBalance: 0,
    accountType: 0,
    isDefault: false
  });
}

async function submitForm() {

  if(!isEdit){
    store.addAccount({
      id : 0,
      accountName: form.accountName,
      institutionName: form.institutionName,
      startingBalance: form.startingBalance,
      accountTypeId:  form.accountType,
      isDefault: form.isDefault,
    } as Account);
  }
  else{
    store.editAccount({
      id : accountEditId,
      accountName: form.accountName,
      institutionName: form.institutionName,
      startingBalance: form.startingBalance,
      accountTypeId: form.accountType,
      isDefault: form.isDefault} as Account);
  }

  closeDialog();

  await store.fetchAccounts(); 
  state.accountArray = store.accounts.filter(() => true);; 

  console.log(store.accounts);

}

function editAccount(account: Account) {

  openDialog.value = true;
  form.accountName= account.accountName;
  form.institutionName = account.institutionName ?? "";
  form.startingBalance = account.startingBalance;
  form.accountType = account.accountTypeId;
  form.isDefault = Boolean(account.isDefault);
  isEdit = true;
  accountEditId = account.id;
}

function viewTransactions(account: Account) {
  emit("request-view-transactions", account.id);
}

async function deleteAccount(account: Account) {

  if (store.accounts.length <= 1) {
    await errorModal.value?.openConfirmation({
      title: 'Cannot Delete Account',
      message: 'At least one account must exist in the system.',
      confirmText: 'Okay'
    });
    return;
  }
  
  accountToDelete.value = account;
  showDeleteModal.value = true;
}

async function handleDeleteConfirm(strategy: 'transfer' | 'delete', transferToAccountId?: number) {
  if (!accountToDelete.value) return;

  await store.removeAccount(accountToDelete.value.id, strategy, transferToAccountId);
  await store.fetchAccounts();
  state.accountArray = store.accounts.filter(() => true);
  
  showDeleteModal.value = false;
  accountToDelete.value = null;
}
</script>

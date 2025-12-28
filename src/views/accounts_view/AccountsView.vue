<template>
  <div class="h-screen flex flex-col">
  <header class ="flex items-center justify-between px-4 h-14 bg-slate-80 text-white">
    <h1 class="text-lg font-semibold text-black">{{ title }}</h1>
    <button class="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 transition" @click="addAccount">
        {{ buttonText }}
    </button>
  </header>

  <AccountListView
    :account_array="accountArray"
    @select="editAccount"
    class="flex-1 overflow-auto"
    />
  </div>


</template>

<script setup lang="ts">
//import { ref } from 'vue';
//import { useFinanceStore } from '@/stores/finance';
import AccountListView from './components/AccountListView.vue';

const title = 'Accounts';
//const store = useFinanceStore();
const buttonText = "+ New Account"

const accountArray = [
  {id: 1, accountName: "James College Fund", balance: 56748},
  {id: 2, accountName: "James Rainy Day", balance: 5000},
  {id: 3, accountName: "James Savings", balance: 22012}
]

function editAccount(){
  console.log("edit button clicked")
}

function addAccount(){
  console.log("add account button pressed")
}


</script>

<style scoped>
/* optional styles */
</style>
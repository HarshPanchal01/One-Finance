<script setup lang="ts">
//import { Ref } from 'vue';
import { Account } from '@/types';
import AccountListTile from './AccountListTile.vue';

const emit = defineEmits<{
    (e: 'edit', account: Account): void,
    (e: 'delete', account: Account): void,
    (e: 'view-transactions', account: Account): void
}>();

defineProps<{
    accountArray: Array<Account>,
    highlightedId?: number | null
}>();

</script>

<template>
  <div class="divide-y">
    <AccountListTile
      v-for="account in accountArray"
      :key="account.id"
      :account-name="account.accountName"
      :starting-balance="account.startingBalance"
      :balance="account.balance"
      :institution-name="account.institutionName ?? ''"
      :account-type-id="account.accountTypeId"
      :is-default="account.isDefault"
      :is-highlighted="account.id === highlightedId"
      @edit="() => emit('edit', account)"
      @delete="() => emit('delete', account)"
      @view-transactions="() => emit('view-transactions', account)"
    />
  </div>
</template>
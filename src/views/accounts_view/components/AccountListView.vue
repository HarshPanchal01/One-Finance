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
      @edit="() => emit('edit', account)"
      @delete="() => emit('delete', account)"
    />
  </div>
</template>

<script setup lang="ts">
//import { Ref } from 'vue';
import { Account } from '@/types';
import AccountListTile from './AccountListTile.vue';

const emit = defineEmits<{
    (e: 'edit', account: Account): void,
    (e: 'delete', account: Account): void
}>();

defineProps({
    accountArray: Array<Account>
});

</script>

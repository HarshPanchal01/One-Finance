<template>
    <div class="divide-y">
        <AccountListTile v-for="account in accountArray"
        :key="account.id"
        :accountName="account.accountName"
        :startingBalance="account.startingBalance"
        :institutionName="account.institutionName ?? ''"
        :accountTypeId="account.accountTypeId ?? 0"
        :isDefault="account.isDefault"
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
})

</script>

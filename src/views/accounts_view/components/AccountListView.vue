<template>
    <div class="divide-y">
        <AccountListTile v-for="account in accountArray"
        :key="account.id"
        :account_name="account.accountName"
        :account_balance="account.balance"
        @select="$emit('select', account)"
        />
    </div>
</template>

<script setup lang="ts">
//import { Ref } from 'vue';
import AccountListTile from './AccountListTile.vue';

defineProps({
    accountArray: Array<{
        id: number
        accountName: string
        balance: number
    }>
})

</script>

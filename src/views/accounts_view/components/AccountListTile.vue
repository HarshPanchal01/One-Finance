<template>
    <div class="flex items-center justify-between p-4 border-b border-slate-200 hover:bg-slate-50">
        <div>
            <p class="font-medium">{{accountName}}</p>
            <p class="text-sm text-slate-500">{{  balance }}</p>
        </div>

        <button
        @click="$emit('select')"
        class="text-blue-500 hover:underline">
        {{ buttonText }}
        </button>
    </div>
</template>

<script setup>

    const buttonText = "Edit"

    defineProps({
        accountName: String,
        balance: Number,
    })
</script>
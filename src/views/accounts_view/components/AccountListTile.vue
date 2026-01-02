<template>
  <div
    class="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
  >
    <div class="flex flex-col">
      <p class="font-medium text-gray-900">
        {{ props.accountName }}
      </p>
      <p class="text-sm text-gray-500">
        {{ props.institutionName }} • Type: {{ accountType }} 
        <span
          v-if="props.isDefault"
          class="ml-2 px-1.5 py-0.5 text-xs font-semibold text-white bg-primary-500 rounded"
        >Default</span>
      </p>
      <p class="text-sm text-gray-700 mt-1">
        Balance: ${{ props.startingBalance.toLocaleString() }}
      </p>
    </div>

    <div class="flex space-x-2">
      <button
          class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary-500 transition-colors"
          title="Edit"
          @click="handleEditClick"
        >
          <i class="pi pi-pencil text-sm" />
      </button>
      <button
          class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-expense transition-colors"
          title="Delete"
          @click="handleDeleteClick"
        >
          <i class="pi pi-trash text-sm" />
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFinanceStore } from '@/stores/finance'
import { computed } from 'vue';


    interface Props {
        accountName: string
        institutionName: string
        startingBalance: number
        accountTypeId: number
        isDefault: boolean
    }

    const store = useFinanceStore();

    const emits = defineEmits<{
        (e: 'edit'): void,
        (e: 'delete'): void
    }>();

    function handleEditClick() {
        emits('edit');
    }


    function handleDeleteClick() {
        emits('delete');
    }

    const props = defineProps<Props>();

    const accountType = computed(() =>
      props.accountTypeId != null
        ? store.accountTypes.find((t) => t.id === props.accountTypeId)?.type ?? 'N/A'
        : 'N/A'
    );


</script>
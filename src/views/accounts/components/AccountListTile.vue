<script setup lang="ts">
import { useFinanceStore } from '@/stores/finance'
import { computed, ref, watch } from 'vue';


    interface Props {
        accountName: string
        institutionName: string
        startingBalance: number
        balance?: number
        accountTypeId: number
        isDefault: boolean
        isHighlighted?: boolean
    }

    const store = useFinanceStore();
    const tileRef = ref<HTMLElement | null>(null);

    const emits = defineEmits<{
        (e: 'edit'): void,
        (e: 'delete'): void,
        (e: 'view-transactions'): void
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

    watch(() => props.isHighlighted, (newVal) => {
      if (newVal && tileRef.value) {
        tileRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, { immediate: true });

</script>

<template>
  <div
    ref="tileRef"
    class="group flex items-center justify-between p-4 border-b border-gray-200 transition-colors duration-500"
    :class="[
      isHighlighted ? 'bg-primary-100 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    ]"
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
        Balance: ${{ props.balance?.toFixed(2) ?? props.startingBalance.toFixed(2) }}
      </p>
    </div>

    <div class="hidden group-hover:flex space-x-2">
      <button
        class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary-500 transition-colors"
        title="View Transactions"
        @click="emits('view-transactions')"
      >
        <i class="pi pi-list text-sm" />
      </button>
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
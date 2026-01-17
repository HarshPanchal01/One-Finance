<script setup lang="ts">
import { ref } from "vue";
import InsightTimeRangeSelector from "./InsightTimeRangeSelector.vue";
import Popover from "primevue/popover";

defineProps<{
  title: string;
  value: string;
  modelValue: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customRange: any;
  formulaTitle?: string;
  formula?: string;
  calculation?: string;
  valueClass?: string;
  borderClass?: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (e: "update:customRange", value: any): void;
}>();

const op = ref();

const toggle = (event: Event) => {
    op.value.toggle(event);
}
</script>

<template>
  <div
    class="card p-4 flex flex-col justify-between border-l-4 transition-all"
    :class="borderClass"
  >
    <div class="flex justify-between items-start">
      <div class="text-gray-900 dark:text-gray-100 text-sm font-medium flex items-center gap-2">
        {{ title }}
      </div>
      <div>
        <InsightTimeRangeSelector
          :model-value="modelValue"
          :custom-range="customRange"
          @update:model-value="$emit('update:modelValue', $event)"
          @update:custom-range="$emit('update:customRange', $event)"
        />
      </div>
    </div>
    
    <div class="mt-2 flex items-baseline gap-2">
      <div 
        class="text-3xl font-bold transition-all duration-200 cursor-help hover:scale-105 hover:opacity-80 origin-left select-none"
        :class="valueClass"
        @click="toggle"
      >
        {{ value }}
      </div>
    </div>

    <Popover ref="op">
      <div class="p-3 max-w-[280px]">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-info-circle text-primary-500" />
          <span class="font-bold text-sm text-gray-800 dark:text-gray-200">{{ formulaTitle || 'Calculation' }}</span>
        </div>
        <div class="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-700 mb-3">
          <code class="text-xs font-mono text-primary-600 dark:text-primary-400 break-words">
            {{ formula }}
          </code>
        </div>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          {{ calculation }}
        </p>
      </div>
    </Popover>

    <slot name="footer" />
  </div>
</template>

<style scoped>
.card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}
</style>
<script setup lang="ts">
import InsightTimeRangeSelector from "./InsightTimeRangeSelector.vue";

defineProps<{
  title: string;
  value: string;
  modelValue: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customRange: any;
  valueClass?: string;
  borderClass?: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (e: "update:customRange", value: any): void;
}>();
</script>

<template>
  <div
    class="card p-4 flex flex-col justify-between border-l-4"
    :class="borderClass"
  >
    <div class="flex justify-between items-start">
      <div class="text-gray-900 text-sm font-medium">
        {{ title }}
      </div>
      <InsightTimeRangeSelector
        :model-value="modelValue"
        :custom-range="customRange"
        @update:model-value="$emit('update:modelValue', $event)"
        @update:custom-range="$emit('update:customRange', $event)"
      />
    </div>
    <div 
      class="text-3xl font-bold mt-2"
      :class="valueClass"
    >
      {{ value }}
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}
</style>
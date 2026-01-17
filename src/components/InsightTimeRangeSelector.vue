<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { getDateRange } from "@/utils";
import DatePicker from "primevue/datepicker";
import { useFinanceStore } from "@/stores/finance";

const props = defineProps<{
  modelValue: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customRange: any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (e: "update:customRange", value: any): void;
}>();

const store = useFinanceStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tempCustomDate = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const datePickerRef = ref<any>(null);

// Watchers to apply temp date to final when range is complete
watch(tempCustomDate, (val) => {
  if (Array.isArray(val) && val[0] && val[1]) {
    emit("update:customRange", val);
  }
});

// Helper to reliably open DatePicker
function showDatePicker() {
  const picker = datePickerRef.value;
  if (!picker) return;

  if (typeof picker.show === "function") {
    picker.show();
  } else if (typeof picker.showOverlay === "function") {
    picker.showOverlay();
  } else if (typeof picker.onInputClick === "function") {
    // Fallback for some PrimeVue versions
    picker.onInputClick();
  } else {
    // Last resort: try to focus the input element if accessible
    const input = picker.$el?.querySelector("input");
    if (input) {
      input.click();
      input.focus();
    }
  }
}

// Watchers to trigger date pickers when 'custom' is selected
watch(() => props.modelValue, async (newVal, oldVal) => {
  if (newVal === 'custom_edit') {
    tempCustomDate.value = props.customRange;
    await nextTick();
    showDatePicker();
    emit("update:modelValue", 'custom');
  } else if (newVal === 'custom') {
    // Only pre-fill if we don't have a value yet
    // And ensure we don't overwrite if it's already set (unless switching from edit)
    if (!props.customRange && oldVal && oldVal !== 'custom_edit') {
        const { startDate, endDate } = getDateRange(oldVal, store.transactions);
        const range = [startDate, endDate];
        emit("update:customRange", range);
        tempCustomDate.value = range;
    }
    await nextTick();
    showDatePicker();
  }
});
</script>

<template>
  <div class="flex items-center gap-2 relative">
    <DatePicker 
      ref="datePickerRef"
      v-model="tempCustomDate" 
      selection-mode="range" 
      :manual-input="false"
      :hide-on-range-selection="true"
      date-format="yy-mm-dd"
      class="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
    />
    <select 
      :value="modelValue"
      class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer min-w-[8rem] z-10 relative"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="thisMonth">
        This Month
      </option>
      <option value="last3Months">
        Last 3 Months
      </option>
      <option value="last6Months">
        Last 6 Months
      </option>
      <option value="lastYear">
        Last Year
      </option>
      <option value="thisYear">
        This Year
      </option>
      <option value="ytd">
        YTD
      </option>
      <option value="allTime">
        All Time
      </option>
      <option value="custom">
        Custom
      </option>
      <option 
        v-if="modelValue === 'custom'" 
        value="custom_edit"
        class="font-semibold text-primary-600 dark:text-primary-400"
      >
        Change Dates...
      </option>
    </select>
  </div>
</template>
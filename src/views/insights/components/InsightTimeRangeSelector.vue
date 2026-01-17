<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import DatePicker from "primevue/datepicker";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tempCustomDate = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const datePickerRef = ref<any>(null);
const localValue = ref(props.modelValue);

// Sync local value with prop
watch(() => props.modelValue, (val) => {
  localValue.value = val;
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

function onSelectChange(event: Event) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newVal = (event.target as any).value;
  localValue.value = newVal;

  if (newVal === 'custom' || newVal === 'custom_edit') {
    // For custom, only use existing range if available, otherwise start empty.
    // For custom_edit, always use existing range.
    tempCustomDate.value = (newVal === 'custom_edit' || props.customRange) ? props.customRange : null;
    nextTick(() => showDatePicker());
  } else {
    emit("update:modelValue", newVal);
  }
}

function onDatePickerHide() {
  // Check if we have a valid range
  if (Array.isArray(tempCustomDate.value) && tempCustomDate.value[0] && tempCustomDate.value[1]) {
     emit("update:customRange", tempCustomDate.value);
     
     // Now we confirm the switch to custom
     if (localValue.value === 'custom' || localValue.value === 'custom_edit') {
         emit("update:modelValue", 'custom');
         localValue.value = 'custom';
     }
  } else {
     // User cancelled or didn't pick full range
     // Revert local value to parent's value
     localValue.value = props.modelValue;
     tempCustomDate.value = null; 
  }
}
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
      @hide="onDatePickerHide"
    />
    <select 
      :value="localValue"
      class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer min-w-[8rem] z-10 relative"
      @change="onSelectChange"
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
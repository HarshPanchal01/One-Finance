<script setup lang="ts">
import { computed } from "vue";
import AppChart from "@/components/AppChart.vue";
import type { CategoryBreakdown } from "@/types";
import { formatCurrency } from "@/utils";

const props = defineProps<{
  breakdown: CategoryBreakdown[];
}>();

const totalExpenses = computed(() => {
  return props.breakdown.reduce((sum, item) => sum + item.total, 0);
});

const topCategories = computed(() => {
  // Top 10 categories + Others
  const all = [...props.breakdown].sort((a, b) => b.total - a.total);
  const top = all.slice(0, 10);
  const others = all.slice(10);

  const result = top.map((c) => ({
    ...c,
    percentage: totalExpenses.value > 0 ? (c.total / totalExpenses.value) * 100 : 0,
  }));

  if (others.length > 0) {
    const othersTotal = others.reduce((sum, c) => sum + c.total, 0);
    result.push({
      categoryId: null,
      categoryName: "Others",
      categoryColor: "#9ca3af",
      categoryIcon: "pi-ellipsis-h",
      total: othersTotal,
      count: others.reduce((sum, c) => sum + c.count, 0),
      percentage: totalExpenses.value > 0 ? (othersTotal / totalExpenses.value) * 100 : 0,
    });
  }

  return result;
});

const categoryData = computed(() => {
  return {
    labels: topCategories.value.map((c) => c.categoryName),
    datasets: [
      {
        data: topCategories.value.map((c) => c.total),
        backgroundColor: topCategories.value.map((c) => c.categoryColor + '99'), // ~60% opacity
        hoverBackgroundColor: topCategories.value.map((c) => c.categoryColor), // 100% opacity on hover
        borderColor: "#0ea5e999",
        hoverBorderColor: "#0ea5e9",
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };
});

const categoryOptions = {
  layout: {
    padding: 10
  },
  plugins: {
    legend: { display: false },
  },
};
</script>

<template>
  <div class="flex flex-row h-full w-full items-center gap-6">
    <!-- Left Column: Total Text + Chart -->
    <div class="flex flex-col items-center justify-center gap-0 shrink-0">
      <!-- Total Text (Above Chart) -->
      <div class="flex flex-col items-center justify-center mb-1">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase leading-tight">Total</span>
        <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ formatCurrency(totalExpenses) }}</span>
      </div>

      <!-- Chart -->
      <div class="w-60 h-60">
        <AppChart
          type="pie"
          :data="categoryData"
          :options="categoryOptions"
          height="100%"
        />
      </div>
    </div>

    <!-- Custom Legend (Right Side) -->
    <div class="flex-1 overflow-y-auto h-full pr-2 space-y-3 py-2">
      <div
        v-for="cat in topCategories"
        :key="cat.categoryId ?? 'others'"
        class="flex items-center gap-3"
      >
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          :style="{ backgroundColor: cat.categoryColor + '20' }"
        >
          <i
            :class="['pi', cat.categoryIcon]"
            :style="{ color: cat.categoryColor, fontSize: '12px' }"
          />
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
            {{ cat.categoryName }}
          </span>
          <span class="text-[11px] text-gray-400 font-medium">
            {{ cat.percentage.toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

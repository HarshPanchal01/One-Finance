<script setup lang="ts">
import { computed } from "vue";
import { useFinanceStore } from "@/stores/finance";
import { getMonthName } from "@/utils";
import AppChart from "@/components/AppChart.vue";

const store = useFinanceStore();

const chartData = computed(() => {
  const trends = store.monthlyTrends;
  const labels = trends.map((t) => getMonthName(t.month).substring(0, 3));
  const incomeData = trends.map((t) => t.totalIncome);
  const expenseData = trends.map((t) => t.totalExpenses);

  return {
    labels,
    datasets: [
      {
        label: "Income",
        backgroundColor: "#22c55e", // Green
        data: incomeData,
        borderRadius: 4,
      },
      {
        label: "Expenses",
        backgroundColor: "#ef4444", // Red
        data: expenseData,
        borderRadius: 4,
      },
    ],
  };
});

const chartOptions = {
  animation: {
    duration: 1000,
    easing: "easeOutQuart" as const,
  },
  animations: {
    y: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (ctx: any) => {
        if (ctx.chart.scales.y) {
          return ctx.chart.scales.y.getPixelForValue(0);
        }
        return 0;
      },
    },
  },
  plugins: {
    legend: {
      display: false, // Using custom legend in parent
    }
  },
  scales: {
    x: {
      title: { display: true, text: 'Month(s)' }
    },
    y: {
      title: { display: true, text: 'Amount ($)' }
    }
  }
};
</script>

<template>
  <div class="h-full w-full">
    <AppChart
      type="bar"
      :data="chartData"
      :options="chartOptions"
      height="100%"
    />
  </div>
</template>
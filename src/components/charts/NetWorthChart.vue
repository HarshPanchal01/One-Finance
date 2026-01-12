<script setup lang="ts">
import { computed, ref } from "vue";
import { useFinanceStore } from "@/stores/finance";
import AppChart from "@/components/AppChart.vue";
import { getMonthName } from "@/utils";

const props = defineProps<{
  option: string;
}>();

const store = useFinanceStore();

const chartData = computed(() => {
  const trends = store.netWorthTrends;
  let displayTrends = [...trends];

  if (props.option === "YTD") {
    // Show last 13 points (approx 1 year rolling)
    displayTrends = trends.length > 13 ? trends.slice(-13) : trends;
  } else {
    // Show specific year
    const year = parseInt(props.option);
    displayTrends = trends.filter((t) => t.year === year);
  }

  const labels = displayTrends.map((t) => getMonthName(t.month).slice(0, 3));
  const data = displayTrends.map((t) => t.balance);

  return {
    labels,
    datasets: [
      {
        label: "Net Worth",
        data,
        // Dynamic area fill: Green above 0, Red below 0
        fill: {
          target: "origin",
          above: "rgba(34, 197, 94, 0.25)",
          below: "rgba(239, 68, 68, 0.25)",
        },
        borderColor: "#0ea5e9", // Primary Brand Blue
        pointBackgroundColor: "#0ea5e9",
        pointBorderColor: "#0ea5e9",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

// Helper for delay state
const delayed = ref(false);

const chartOptions = computed(() => {
  return {
    animation: {
      onComplete: () => {
        delayed.value = true;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delay: (context: any) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default' && !delayed.value) {
          delay = context.dataIndex * 150 + context.datasetIndex * 100;
        }
        return delay;
      },
    },
    animations: {
      y: {
        duration: 1000,
        easing: "easeOutQuart" as const,
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
      legend: { display: false },
    },
    scales: {
      x: {
        title: { display: true, text: 'Month(s)' }
      },
      y: {
        title: { display: true, text: 'Total Balance ($)' }
      }
    }
  };
});
</script>

<template>
  <AppChart
    type="line"
    :data="chartData"
    :options="chartOptions"
    height="100%"
  />
</template>
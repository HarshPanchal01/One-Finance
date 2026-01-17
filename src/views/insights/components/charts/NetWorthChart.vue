<script setup lang="ts">
import { computed, ref } from "vue";
import { useFinanceStore } from "@/stores/finance";
import AppChart from "@/components/AppChart.vue";
import { getMonthName, toIsoDateString } from "@/utils";

const props = defineProps<{
  option: string;
}>();

const store = useFinanceStore();

const filteredTrends = computed(() => {
  const trends = store.netWorthTrends;
  if (props.option === "YTD") {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return trends.filter(t => {
        const tDate = new Date(t.year, t.month - 1, 1);
        return tDate >= startDate && tDate <= endDate;
    });
  } else {
    const year = parseInt(props.option);
    return trends.filter((t) => t.year === year);
  }
});

const chartData = computed(() => {
  const displayTrends = filteredTrends.value;
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
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: (context: any[]) => {
            const index = context[0].dataIndex;
            const t = filteredTrends.value[index];
            return t ? `${getMonthName(t.month)} ${t.year}` : '';
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Month(s)' }
      },
      y: {
        title: { display: true, text: 'Total Balance ($)' }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onHover: (_event: any, chartElement: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_event as any).native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: (_event: any, elements: any[]) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const t = filteredTrends.value[index];
        
        if (t) {
          // Construct date range for the specific month
          const startDate = new Date(t.year, t.month - 1, 1);
          const endDate = new Date(t.year, t.month, 0); // Last day of month
          
          const filter = {
            fromDate: toIsoDateString(startDate),
            toDate: toIsoDateString(endDate)
          };

          store.setTransactionFilter(filter);
          store.searchTransactions(filter);
        }
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
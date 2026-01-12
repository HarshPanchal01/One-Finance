<script setup lang="ts">
import { computed } from "vue";
import AppChart from "@/components/AppChart.vue";
import type { DailyTransactionSum } from "@/types";

const props = defineProps<{
  seriesA: DailyTransactionSum[];
  seriesB: DailyTransactionSum[];
  labelA: string;
  labelB: string;
}>();

const pacingData = computed(() => {
  const current = props.seriesA;
  const previous = props.seriesB;

  // X Axis labels - Strictly match the length of the data provided
  const maxLength = Math.max(current.length, previous.length);
  const labels = Array.from({length: maxLength}, (_, i) => i + 1);
  
  // Map data to array indices (day-1)
  const currentData = new Array(maxLength).fill(null);
  const prevData = new Array(maxLength).fill(null);

  current.forEach(d => {
      if (d.day >= 1 && d.day <= maxLength) currentData[d.day - 1] = d.total;
  });

  previous.forEach(d => {
      if (d.day >= 1 && d.day <= maxLength) prevData[d.day - 1] = d.total;
  });

  return {
    labels,
    datasets: [
      {
        label: props.labelA,
        data: currentData,
        borderColor: "#0ea5e9", // Primary Brand Blue
        // Dynamic area fill relative to comparison line (dataset 1)
        fill: {
          target: 1,
          above: "rgba(239, 68, 68, 0.25)", // Red if current > comparison
          below: "rgba(34, 197, 94, 0.25)", // Green if current < comparison
        },
        tension: 0.4
      },
      {
        label: props.labelB,
        data: prevData,
        borderColor: "#9ca3af", // Gray
        borderDash: [5, 5],
        tension: 0, // Straight line
        pointRadius: 0
      }
    ]
  };
});

const pacingOptions = computed(() => {
    return {
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                title: { display: true, text: 'Day(s) of Month' }
            },
            y: {
                title: { display: true, text: 'Cumulative Amount ($)' }
            }
        }
    };
});
</script>

<template>
  <AppChart 
    type="line" 
    :data="pacingData" 
    :options="pacingOptions" 
    height="100%" 
  />
</template>
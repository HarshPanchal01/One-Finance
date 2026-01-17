<script setup lang="ts">
import { computed, ref } from "vue";
import AppChart from "@/components/AppChart.vue";
import type { DailyTransactionSum } from "@/types";
import { useFinanceStore } from "@/stores/finance";
import { toIsoDateString } from "@/utils";

const props = defineProps<{
  seriesA: DailyTransactionSum[];
  seriesB: DailyTransactionSum[];
  labelA: string;
  labelB: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dateA?: any; // Date object for Series A
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dateB?: any; // Date object for Series B
}>();

const store = useFinanceStore();

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

  // Detect if Series B is a flat line (Average) or a Curve (Actual Month)
  // Simple heuristic: check if all non-null values are identical
  const validPrevValues = prevData.filter(v => v !== null);
  const isFlatLine = validPrevValues.length > 0 && validPrevValues.every(v => v === validPrevValues[0]);

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
        tension: 0.4,
        pointHoverRadius: 6,
        pointHitRadius: 10
      },
      {
        label: props.labelB,
        data: prevData,
        borderColor: "#9ca3af", // Gray
        borderDash: isFlatLine ? [5, 5] : [], // Dashed for average, solid for actual history
        borderWidth: isFlatLine ? 2 : 2,
        pointRadius: isFlatLine ? 0 : 3, // Hide points for average
        tension: isFlatLine ? 0 : 0.4, // Smooth curve for history, straight for average
        pointHoverRadius: isFlatLine ? 0 : 6,
        pointHitRadius: 10
      }
    ]
  };
});

const delayed = ref(false);

const pacingOptions = computed(() => {
    return {
        animation: {
            onComplete: () => {
                delayed.value = true;
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delay: (context: any) => {
                let delay = 0;
                if (context.type === 'data' && context.mode === 'default' && !delayed.value) {
                    // Faster delay for daily points
                    delay = context.dataIndex * 50 + context.datasetIndex * 100;
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
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: true
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                displayColors: true,
                padding: 10,
                cornerRadius: 8,
                titleFont: { size: 13, weight: 'bold' as const },
                bodyFont: { size: 12 },
                callbacks: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    title: (items: any[]) => {
                        if (items.length === 0) return '';
                        const day = items[0].label;
                        const datasetIndex = items[0].datasetIndex;
                        // Determine which month context to show
                        const dateContext = datasetIndex === 0 ? props.dateA : props.dateB;
                        
                        if (dateContext && dateContext instanceof Date) {
                            return `${dateContext.toLocaleString('default', { month: 'short' })} ${day}, ${dateContext.getFullYear()}`;
                        }
                        return `Day ${day}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Day(s) of Month' }
            },
            y: {
                title: { display: true, text: 'Cumulative Amount ($)' }
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
                const element = elements[0];
                const index = element.index; // 0-based index (Day 1 = 0)
                const datasetIndex = element.datasetIndex;
                
                const targetDate = datasetIndex === 0 ? props.dateA : props.dateB;
                
                if (targetDate && targetDate instanceof Date) {
                    const day = index + 1;
                    const year = targetDate.getFullYear();
                    const month = targetDate.getMonth(); // 0-based
                    
                    // Filter: From start of month to clicked day
                    const fromDate = toIsoDateString(new Date(year, month, 1));
                    const toDate = toIsoDateString(new Date(year, month, day));
                    
                    const filter = {
                        fromDate,
                        toDate,
                        type: 'expense' as const
                    };

                    store.setTransactionFilter(filter);
                    store.searchTransactions(filter); // Trigger search
                    // Store watcher will handle navigation to Transactions view
                }
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

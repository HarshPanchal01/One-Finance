<script setup lang="ts">
import { computed } from "vue";
import Chart from "primevue/chart";
import type { TooltipItem, ChartOptions, ChartData } from "chart.js";

interface Props {
  type: "bar" | "line" | "doughnut" | "pie" | "polarArea" | "radar";
  data: ChartData;
  options?: ChartOptions;
  height?: string;
  currencyFormat?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
  height: "300px",
  currencyFormat: true,
});

const defaultOptions = computed(() => {
  const textColor = "#111827"; // gray-900 (Blackish)
  const gridColor = "#e5e7eb"; // gray-200

  const base: ChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        mode: props.type === 'doughnut' || props.type === 'pie' ? 'nearest' : 'index',
        intersect: false,
        callbacks: {},
      },
    },
    scales: {},
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
  };

  // Add Currency Formatting to Tooltips
  if (props.currencyFormat) {
    base.plugins!.tooltip!.callbacks!.label = function(context: TooltipItem<"bar" | "line" | "doughnut" | "pie" | "polarArea" | "radar">) {
        let label = context.dataset.label || '';
        if (label) {
            label += ': ';
        }
        if (context.parsed.y !== null && context.parsed.y !== undefined) {
             // For Bar/Line charts where data is x/y
            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
        } else if (context.raw !== null && context.raw !== undefined && (props.type === 'doughnut' || props.type === 'pie')) {
            // For Doughnut/Pie where data is just a number in raw
            const val = context.raw as number;
            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
            
            // Calculate percentage
            const meta = context.chart.getDatasetMeta(context.datasetIndex);
            const total = (meta as unknown as { total: number }).total;
            if (total > 0) {
                const percentage = ((val / total) * 100).toFixed(1);
                label += ` (${percentage}%)`;
            }
        }
        return label;
    };
  }

  // Add Scales Configuration (only for cartesian charts)
  if (['bar', 'line'].includes(props.type)) {
    base.scales = {
      x: {
        ticks: {
          color: textColor,
          font: {
            weight: 500,
          },
        },
        grid: {
          display: false,
        },
        title: {
            display: false, // Default to false, components can override
            color: textColor,
            font: {
                weight: 600
            }
        }
      },
      y: {
        ticks: {
          color: textColor,
          callback: function(value: string | number) {
              if (props.currencyFormat) {
                const val = typeof value === 'string' ? parseFloat(value) : value;
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(val);
              }
              return value;
          }
        },
        grid: {
          color: gridColor,
        },
        title: {
            display: false, // Default to false
            color: textColor,
            font: {
                weight: 600
            }
        }
      },
    };
  } else {
      // Clear scales for radial charts to avoid errors if merged improperly
      delete base.scales;
  }

  return base;
});

// Deep merge options (simple version)
const chartOptions = computed(() => {
  const merged = { ...defaultOptions.value, ...props.options };
  
  // Merge plugins deep-ish
  if (props.options.plugins) {
      merged.plugins = { ...defaultOptions.value.plugins, ...props.options.plugins };
  }
  
  // Merge scales deep-ish
  if (props.options.scales && defaultOptions.value.scales) {
      merged.scales = { ...defaultOptions.value.scales, ...props.options.scales };
  }

  return merged;
});
</script>

<template>
  <div :style="{ height: height }">
    <Chart
      :type="type"
      :data="data"
      :options="chartOptions"
      class="h-full"
    />
  </div>
</template>

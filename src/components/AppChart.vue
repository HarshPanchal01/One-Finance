<script setup lang="ts">
import { computed } from "vue";
import Chart from "primevue/chart";
import type { TooltipItem, ChartOptions } from "chart.js";

interface Props {
  type: "bar" | "line" | "doughnut" | "pie" | "polarArea" | "radar";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: {} as any,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    base.plugins!.tooltip!.callbacks!.label = function(context: TooltipItem<any>) {
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
            const total = (meta as any).total;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (base as any).scales;
  }

  return base;
});

// Deep merge options (simple version)
const chartOptions = computed(() => {
  // We can use a library like lodash.merge if needed, but for now simple spread with specific overrides is likely enough
  // or just rely on chart.js ability to handle some missing defaults.
  // BUT, we want to allow the user to override specific defaults (e.g. scales).
  // A simple spread isn't deep merge.
  // For now, let's just return the defaults merged with props.options loosely.
  // If props.options has 'scales', it replaces our default scales entirely with this approach.
  // To do it better without a library:
  
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

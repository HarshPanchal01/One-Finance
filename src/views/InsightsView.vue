<script setup lang="ts">
import { computed, onMounted, watch, ref } from "vue";
import { useFinanceStore } from "@/stores/finance";
import { formatCurrency, getMetricsForRange, getTimeRangeLabel, getExpenseBreakdownForRange } from "@/utils";
import type { DailyTransactionSum } from "@/types";
import CashFlowChart from "@/components/charts/CashFlowChart.vue";
import PacingChart from "@/components/charts/PacingChart.vue";
import ExpenseBreakdownChart from "@/components/charts/ExpenseBreakdownChart.vue";
import NetWorthChart from "@/components/charts/NetWorthChart.vue";
import DatePicker from "primevue/datepicker";
import InsightMetricCard from "@/components/InsightMetricCard.vue";
import InsightTimeRangeSelector from "@/components/InsightTimeRangeSelector.vue";

const store = useFinanceStore();

// ===============================================
// DATA FETCHING
// ===============================================

onMounted(async () => {
  // Ensure trends are loaded matching the default 'YTD'
  await store.fetchRollingMonthlyTrends();
  await store.fetchNetWorthTrend();

  if (store.expenseBreakdown.length === 0) {
    store.fetchPeriodSummarySync();
  }
  await refreshPacing();
});

// ===============================================
// METRICS
// ===============================================

const savingsTimeRange = ref<string>('thisMonth');
const avgSpendTimeRange = ref<string>('thisMonth');
const netCashFlowTimeRange = ref<string>('thisMonth');
const expenseBreakdownTimeRange = ref<string>('thisMonth');
const cashFlowOption = ref<string>('YTD');
const netWorthOption = ref<string>('YTD');

// Custom Date Ranges (Actual used for metrics)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const savingsCustomDate = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const avgSpendCustomDate = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const netCashFlowCustomDate = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expenseBreakdownCustomDate = ref<any>(null);

// Watcher for cashFlowOption
watch(cashFlowOption, async (newVal) => {
    if (newVal === 'YTD') {
        await store.fetchRollingMonthlyTrends();
    } else {
        await store.fetchMonthlyTrends(parseInt(newVal));
    }
});

// Helper to convert array [Date, Date] to object { startDate, endDate }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCustomRangeObj(dateRange: any) {
  if (Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
    return { startDate: dateRange[0], endDate: dateRange[1] };
  }
  return undefined;
}

const savingsData = computed(() => getMetricsForRange(savingsTimeRange.value, store.transactions, getCustomRangeObj(savingsCustomDate.value)));
const avgSpendData = computed(() => getMetricsForRange(avgSpendTimeRange.value, store.transactions, getCustomRangeObj(avgSpendCustomDate.value)));
const netCashFlowData = computed(() => getMetricsForRange(netCashFlowTimeRange.value, store.transactions, getCustomRangeObj(netCashFlowCustomDate.value)));
const expenseBreakdownData = computed(() => getExpenseBreakdownForRange(expenseBreakdownTimeRange.value, store.transactions, getCustomRangeObj(expenseBreakdownCustomDate.value)));

// Pass the custom range object to the chart component if needed
const expenseBreakdownCustomRangeObj = computed(() => getCustomRangeObj(expenseBreakdownCustomDate.value));

const savingsRate = computed(() => {
  const { income, expense } = savingsData.value;
  if (income === 0) return 0;
  return ((income - expense) / income) * 100;
});

const avgDailySpend = computed(() => {
  const { expense, days } = avgSpendData.value;
  if (days === 0) return 0;
  return expense / days;
});

const netCashFlow = computed(() => {
    const { income, expense } = netCashFlowData.value;
    return income - expense;
});

// ===============================================
// AVAILABLE YEARS (Ledger + Transaction History)
// ===============================================

const availableYears = computed(() => {
    const years = new Set(store.ledgerYears);
    
    store.netWorthTrends.forEach(trend => {
        years.add(trend.year);
    });
    
    return Array.from(years).sort((a, b) => b - a);
});

// ===============================================
// PACING CHART
// ===============================================

// Date Pickers State
// Default to current month
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pacingDateA = ref<any>(new Date());
// Default to previous month
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pacingDateB = ref<any>(new Date(new Date().setMonth(new Date().getMonth() - 1)));

// Refs to trigger date picker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const pacingDateARef = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const pacingDateBRef = ref<any>(null);

const pacingSeriesA = ref<DailyTransactionSum[]>([]);
const pacingSeriesB = ref<DailyTransactionSum[]>([]);

// Convert Date to YYYY-MM
function getMonthStr(date: Date): string {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
}

async function refreshPacing() {
    if (!pacingDateA.value) return;

    const target = getMonthStr(pacingDateA.value);
    let comparison: string = '';

    if (pacingDateB.value) {
        comparison = getMonthStr(pacingDateB.value);
    } 

    if (comparison) {
         // Cast to any because our store definition is now loose string for 2nd arg
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const { seriesA, seriesB } = await store.fetchPacingData(target, comparison as any);
         pacingSeriesA.value = seriesA;
         pacingSeriesB.value = seriesB;
    }
}

watch([pacingDateA, pacingDateB], refreshPacing);

// Helper for label display
const pacingLabelA = computed(() => {
    if (!pacingDateA.value) return 'Selected Month';
    return pacingDateA.value.toLocaleString('default', { month: 'long', year: 'numeric' });
});

const pacingLabelB = computed(() => {
    if (!pacingDateB.value) return 'Select Month';
    return pacingDateB.value.toLocaleString('default', { month: 'long', year: 'numeric' });
});
</script>

<template>
  <div class="space-y-6 pb-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
        Insights
      </h1>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Savings Rate -->
      <InsightMetricCard
        title="Savings Rate"
        :value="savingsRate.toFixed(1) + '%'"
        v-model:modelValue="savingsTimeRange"
        v-model:customRange="savingsCustomDate"
        :value-class="savingsRate >= 20 ? 'text-income' : 'text-expense'"
        :border-class="savingsRate >= 20 ? 'border-income' : (savingsRate > 0 ? 'border-primary-500' : 'border-expense')"
      >
        <template #footer>
          <div class="text-xs text-gray-400 mt-1 flex gap-2">
            <span>Based on {{ getTimeRangeLabel(savingsTimeRange, getCustomRangeObj(savingsCustomDate)) }}</span>
            <span>•</span>
            <span>Target: >20%</span>
          </div>
        </template>
      </InsightMetricCard>

      <!-- Avg Daily Spend -->
      <InsightMetricCard
        title="Average Daily Spend"
        :value="formatCurrency(avgDailySpend)"
        v-model:modelValue="avgSpendTimeRange"
        v-model:customRange="avgSpendCustomDate"
        value-class="text-gray-800 dark:text-white"
        border-class="border-primary-500"
      >
        <template #footer>
          <div class="text-xs text-gray-400 mt-1">
            Based on {{ getTimeRangeLabel(avgSpendTimeRange, getCustomRangeObj(avgSpendCustomDate)) }}
          </div>
        </template>
      </InsightMetricCard>

      <!-- Net Cash Flow -->
      <InsightMetricCard
        title="Net Cash Flow"
        :value="formatCurrency(netCashFlow)"
        v-model:modelValue="netCashFlowTimeRange"
        v-model:customRange="netCashFlowCustomDate"
        :value-class="netCashFlow >= 0 ? 'text-income' : 'text-expense'"
        :border-class="netCashFlow >= 0 ? 'border-income' : 'border-expense'"
      >
        <template #footer>
          <div class="text-xs text-gray-400 mt-1">
            Based on {{ getTimeRangeLabel(netCashFlowTimeRange, getCustomRangeObj(netCashFlowCustomDate)) }}
          </div>
        </template>
      </InsightMetricCard>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Cash Flow -->
      <div class="card p-4">
        <div class="relative flex items-center justify-center mb-4 min-h-[32px]">
          <!-- Custom Legend (Left Aligned, offset from edge) -->
          <div class="absolute left-12 flex flex-row gap-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-1.5 rounded-sm bg-income shrink-0" />
              <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Income</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-1.5 rounded-sm bg-expense shrink-0" />
              <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Expenses</span>
            </div>
          </div>

          <h3 class="font-semibold text-gray-700 dark:text-gray-200">
            Cash Flow
          </h3>
            
          <div class="absolute right-0">
            <select 
              v-model="cashFlowOption"
              class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
            >
              <option value="YTD">
                YTD
              </option>
              <option
                v-for="year in availableYears"
                :key="year"
                :value="year.toString()"
              >
                {{ year }}
              </option>
            </select>
          </div>
        </div>
        <div class="h-64">
          <CashFlowChart />
        </div>
      </div>

      <!-- Spending Pacing -->
      <div class="card p-4">
        <div class="relative flex flex-col sm:flex-row items-center justify-center mb-4 min-h-[32px] gap-2">
          <!-- Custom Legend (Left Aligned, offset from edge) -->
          <div class="absolute left-12 flex flex-row gap-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-1.5 rounded-sm bg-primary-500 shrink-0" />
              <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Current</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-1.5 rounded-sm border border-gray-400 border-dashed shrink-0 bg-gray-100 dark:bg-gray-700" />
              <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Comparison</span>
            </div>
          </div>

          <h3 class="font-semibold text-gray-700 dark:text-gray-200">
            Spending Pacing
          </h3>
            
          <!-- Date Pickers for Pacing -->
          <div class="sm:absolute sm:right-0 flex flex-wrap items-center gap-2">
            
            <!-- Target Month Picker -->
            <div class="relative">
              <DatePicker 
                ref="pacingDateARef"
                v-model="pacingDateA" 
                view="month" 
                date-format="yy-mm"
                class="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                input-class="cursor-pointer h-full w-full caret-transparent"
                :pt="{ input: { inputmode: 'none' } }"
                :panel-style="{ minWidth: '18rem' }"
              />
              <button
                class="flex items-center gap-1.5 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors pointer-events-none"
              >
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  {{ pacingDateA ? pacingDateA.toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Select Month' }}
                </span>
              </button>
            </div>

            <span class="text-gray-400 text-xs">vs</span>

            <!-- Comparison Picker -->
            <div class="relative">
                <DatePicker 
                    ref="pacingDateBRef"
                    v-model="pacingDateB" 
                    view="month" 
                    date-format="yy-mm"
                    class="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    input-class="cursor-pointer h-full w-full caret-transparent"
                    :pt="{ input: { inputmode: 'none' } }"
                    :panel-style="{ minWidth: '18rem' }"
                />
                <button
                    class="flex items-center gap-1.5 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors pointer-events-none"
                >
                    <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {{ pacingDateB ? pacingDateB.toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Select Month' }}
                    </span>
                </button>
            </div>
          </div>
        </div>
        <div class="h-64">
          <PacingChart 
            :series-a="pacingSeriesA" 
            :series-b="pacingSeriesB" 
            :label-a="pacingLabelA" 
            :label-b="pacingLabelB"
            :date-a="pacingDateA"
            :date-b="pacingDateB"
          />
        </div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Expense Breakdown -->
      <div class="card p-4 lg:col-span-1 flex flex-col">
        <div class="relative flex items-center mb-4 h-8">
          <div class="w-60 shrink-0 flex justify-center">
            <h3 class="font-semibold text-gray-700 dark:text-gray-200">
              Expense Breakdown
            </h3>
          </div>
          <div class="flex-1 flex justify-end">
            <InsightTimeRangeSelector
              v-model:modelValue="expenseBreakdownTimeRange"
              v-model:customRange="expenseBreakdownCustomDate"
            />
          </div>
        </div>
        <div class="h-80">
          <ExpenseBreakdownChart 
            :breakdown="expenseBreakdownData" 
            :time-range="expenseBreakdownTimeRange"
            :custom-range="expenseBreakdownCustomRangeObj"
          />
        </div>
        <div class="text-xs text-gray-400 mt-1 pl-1">
          Based on {{ getTimeRangeLabel(expenseBreakdownTimeRange, getCustomRangeObj(expenseBreakdownCustomDate)) }}
        </div>
      </div>

      <!-- Net Worth Trend -->
      <div class="card p-4 lg:col-span-2">
        <div class="relative flex items-center justify-center mb-4">
          <h3 class="font-semibold text-gray-700 dark:text-gray-200">
            Net Worth Trend
          </h3>
          <div class="absolute right-0">
            <select 
              v-model="netWorthOption"
              class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
            >
              <option value="YTD">
                YTD
              </option>
              <option
                v-for="year in availableYears"
                :key="year"
                :value="year.toString()"
              >
                {{ year }}
              </option>
            </select>
          </div>
        </div>
        <div class="h-80">
          <NetWorthChart :option="netWorthOption" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}
</style>
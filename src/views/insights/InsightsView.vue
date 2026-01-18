<script setup lang="ts">
import { computed, onMounted, watch, ref } from "vue";
import { useFinanceStore } from "@/stores/finance";
import { 
  formatCurrency, 
  getMetricsForRange, 
  getTimeRangeLabel, 
  getExpenseBreakdownForRange, 
  getCustomRangeObj, 
  calculateSavingsRate, 
  calculateAvgDailySpend, 
  calculateNetCashFlow, 
  getPacingLabel,
  getMonthStr } from "@/utils";
import type { DailyTransactionSum } from "@/types";
import CashFlowChart from "@/views/insights/components/charts/CashFlowChart.vue";
import PacingChart from "@/views/insights/components/charts/PacingChart.vue";
import ExpenseBreakdownChart from "@/views/insights/components/charts/ExpenseBreakdownChart.vue";
import NetWorthChart from "@/views/insights/components/charts/NetWorthChart.vue";
import DatePicker from "primevue/datepicker";
import InsightMetricCard from "@/views/insights/components/InsightMetricCard.vue";
import InsightTimeRangeSelector from "@/views/insights/components/InsightTimeRangeSelector.vue";

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

const savingsData = computed(() => getMetricsForRange(savingsTimeRange.value, store.transactions, getCustomRangeObj(savingsCustomDate.value)));
const avgSpendData = computed(() => getMetricsForRange(avgSpendTimeRange.value, store.transactions, getCustomRangeObj(avgSpendCustomDate.value)));
const netCashFlowData = computed(() => getMetricsForRange(netCashFlowTimeRange.value, store.transactions, getCustomRangeObj(netCashFlowCustomDate.value)));
const expenseBreakdownData = computed(() => getExpenseBreakdownForRange(expenseBreakdownTimeRange.value, store.transactions, getCustomRangeObj(expenseBreakdownCustomDate.value)));

const savingsRate = computed(() => {
  const { income, expense } = savingsData.value;
  return calculateSavingsRate(income, expense);
});

const avgDailySpend = computed(() => {
  const { expense, days } = avgSpendData.value;
  return calculateAvgDailySpend(expense, days);
});

const netCashFlow = computed(() => {
    const { income, expense } = netCashFlowData.value;
    return calculateNetCashFlow(income, expense);
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
 
// const pacingDateARef = ref<any>(null);
 
// const pacingDateBRef = ref<any>(null);

const pacingSeriesA = ref<DailyTransactionSum[]>([]);
const pacingSeriesB = ref<DailyTransactionSum[]>([]);

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
const pacingLabelA = computed(() => getPacingLabel(pacingDateA.value, 'Selected Month'));
const pacingLabelB = computed(() => getPacingLabel(pacingDateB.value, 'Select Month'));
</script>

<template>
  <div class="space-y-6 pb-6 max-w-full overflow-x-hidden">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
        Insights
      </h1>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Savings Rate -->
      <InsightMetricCard
        v-model:model-value="savingsTimeRange"
        v-model:custom-range="savingsCustomDate"
        title="Savings Rate"
        :value="savingsRate.toFixed(1) + '%'"
        :value-class="savingsRate > 0 ? 'text-income' : 'text-expense'"
        :border-class="savingsRate > 0 ? 'border-income' : 'border-expense'"
        formula-title="Savings Rate Formula"
        formula="(Income - Expenses) / Income"
        :calculation="`(${formatCurrency(savingsData.income)} - ${formatCurrency(savingsData.expense)}) / ${formatCurrency(savingsData.income)}`"
      >
        <template #footer>
          <div class="text-xs text-gray-400 mt-1">
            Based on {{ getTimeRangeLabel(savingsTimeRange, getCustomRangeObj(savingsCustomDate)) }}
          </div>
        </template>
      </InsightMetricCard>

      <!-- Avg Daily Spend -->
      <InsightMetricCard
        v-model:model-value="avgSpendTimeRange"
        v-model:custom-range="avgSpendCustomDate"
        title="Average Daily Spend"
        :value="formatCurrency(avgDailySpend)"
        value-class="text-gray-800 dark:text-white"
        border-class="border-primary-500"
        formula-title="Average Daily Spend"
        formula="Total Expenses / Days in Period"
        :calculation="`${formatCurrency(avgSpendData.expense)} / ${avgSpendData.days} days`"
      >
        <template #footer>
          <div class="text-xs text-gray-400 mt-1">
            Based on {{ getTimeRangeLabel(avgSpendTimeRange, getCustomRangeObj(avgSpendCustomDate)) }}
          </div>
        </template>
      </InsightMetricCard>

      <!-- Net Cash Flow -->
      <InsightMetricCard
        v-model:model-value="netCashFlowTimeRange"
        v-model:custom-range="netCashFlowCustomDate"
        title="Net Cash Flow"
        :value="formatCurrency(netCashFlow)"
        :value-class="netCashFlow >= 0 ? 'text-income' : 'text-expense'"
        :border-class="netCashFlow >= 0 ? 'border-income' : 'border-expense'"
        formula-title="Net Cash Flow"
        formula="Total Income - Total Expenses"
        :calculation="`${formatCurrency(netCashFlowData.income)} - ${formatCurrency(netCashFlowData.expense)}`"
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
              <div class="w-3 h-1.5 rounded-sm bg-amber-400 shrink-0" />
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
                <span class="text-xs font-semibold text-primary-500 whitespace-nowrap">
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
                <span class="text-xs font-semibold text-amber-500 whitespace-nowrap">
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
              v-model:model-value="expenseBreakdownTimeRange"
              v-model:custom-range="expenseBreakdownCustomDate"
            />
          </div>
        </div>
        <div class="flex-1 min-h-0">
          <ExpenseBreakdownChart 
            :breakdown="expenseBreakdownData" 
            :time-range="expenseBreakdownTimeRange"
            :custom-range="getCustomRangeObj(expenseBreakdownCustomDate)"
          />
        </div>
        <div class="text-xs text-gray-400 mt-1 pl-1">
          Based on {{ getTimeRangeLabel(expenseBreakdownTimeRange, getCustomRangeObj(expenseBreakdownCustomDate)) }}
        </div>
      </div>

      <!-- Net Worth Trend -->
      <div class="card p-4 lg:col-span-2 flex flex-col">
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
        <div class="flex-1 min-h-0">
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
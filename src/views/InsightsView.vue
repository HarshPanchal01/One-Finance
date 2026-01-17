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

// Watcher for cashFlowOption
watch(cashFlowOption, async (newVal) => {
    if (newVal === 'YTD') {
        await store.fetchRollingMonthlyTrends();
    } else {
        await store.fetchMonthlyTrends(parseInt(newVal));
    }
});

const savingsData = computed(() => getMetricsForRange(savingsTimeRange.value, store.transactions));
const avgSpendData = computed(() => getMetricsForRange(avgSpendTimeRange.value, store.transactions));
const netCashFlowData = computed(() => getMetricsForRange(netCashFlowTimeRange.value, store.transactions));
const expenseBreakdownData = computed(() => getExpenseBreakdownForRange(expenseBreakdownTimeRange.value, store.transactions));

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
      <div
        class="card p-4 flex flex-col justify-between border-l-4"
        :class="savingsRate >= 20 ? 'border-income' : (savingsRate > 0 ? 'border-primary-500' : 'border-expense')"
      >
        <div class="flex justify-between items-start">
          <div class="text-gray-900 text-sm font-medium">
            Savings Rate
          </div>
          <!-- Dropdown -->
          <select 
            v-model="savingsTimeRange"
            class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="thisMonth">
              This Month
            </option>
            <option value="last3Months">
              Last 3 Months
            </option>
            <option value="last6Months">
              Last 6 Months
            </option>
            <option value="lastYear">
              Last Year
            </option>
            <option value="thisYear">
              This Year
            </option>
            <option value="ytd">
              YTD
            </option>
            <option value="allTime">
              All Time
            </option>
          </select>
        </div>
        <div 
          class="text-3xl font-bold mt-2"
          :class="savingsRate >= 20 ? 'text-income' : 'text-expense'"
        >
          {{ savingsRate.toFixed(1) }}%
        </div>
        <div class="text-xs text-gray-400 mt-1">
          Target: >20%
        </div>
      </div>

      <!-- Avg Daily Spend -->
      <div class="card p-4 flex flex-col justify-between border-l-4 border-primary-500">
        <div class="flex justify-between items-start">
          <div class="text-gray-900 text-sm font-medium">
            Average Daily Spend
          </div>
          <!-- Dropdown -->
          <select 
            v-model="avgSpendTimeRange"
            class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="thisMonth">
              This Month
            </option>
            <option value="last3Months">
              Last 3 Months
            </option>
            <option value="last6Months">
              Last 6 Months
            </option>
            <option value="lastYear">
              Last Year
            </option>
            <option value="thisYear">
              This Year
            </option>
            <option value="ytd">
              YTD
            </option>
            <option value="allTime">
              All Time
            </option>
          </select>
        </div>
        <div class="text-3xl font-bold mt-2 text-gray-800 dark:text-white">
          {{ formatCurrency(avgDailySpend) }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          Based on {{ getTimeRangeLabel(avgSpendTimeRange) }}
        </div>
      </div>

      <!-- Net Cash Flow -->
      <div
        class="card p-4 flex flex-col justify-between border-l-4"
        :class="netCashFlow >= 0 ? 'border-income' : 'border-expense'"
      >
        <div class="flex justify-between items-start">
          <div class="text-gray-900 text-sm font-medium">
            Net Cash Flow
          </div>
          <!-- Dropdown -->
          <select 
            v-model="netCashFlowTimeRange"
            class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="thisMonth">
              This Month
            </option>
            <option value="last3Months">
              Last 3 Months
            </option>
            <option value="last6Months">
              Last 6 Months
            </option>
            <option value="lastYear">
              Last Year
            </option>
            <option value="thisYear">
              This Year
            </option>
            <option value="ytd">
              YTD
            </option>
            <option value="allTime">
              All Time
            </option>
          </select>
        </div>
        <div
          class="text-3xl font-bold mt-2"
          :class="netCashFlow >= 0 ? 'text-income' : 'text-expense'"
        >
          {{ formatCurrency(netCashFlow) }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          Based on {{ getTimeRangeLabel(netCashFlowTimeRange) }}
        </div>
      </div>
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
            <select 
              v-model="expenseBreakdownTimeRange"
              class="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
            >
              <option value="thisMonth">
                This Month
              </option>
              <option value="last3Months">
                Last 3 Months
              </option>
              <option value="last6Months">
                Last 6 Months
              </option>
              <option value="lastYear">
                Last Year
              </option>
              <option value="thisYear">
                This Year
              </option>
              <option value="ytd">
                YTD
              </option>
              <option value="allTime">
                All Time
              </option>
            </select>
          </div>
        </div>
        <div class="h-80">
          <ExpenseBreakdownChart :breakdown="expenseBreakdownData" :time-range="expenseBreakdownTimeRange" />
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
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import "./App.css";
import type {
  Category,
  LedgerPeriod,
  LedgerYearNode,
  RecentTransaction,
  Summary,
  Transaction,
} from "./types";
import { Sidebar } from "./components/Sidebar";
import { TransactionsView } from "./components/TransactionsView";
import { SettingsView, type AppInfo } from "./components/SettingsView";
import { DashboardView } from "./components/DashboardView";
import { oneFinanceApi } from "./services/oneFinance";

const EXPANDED_YEARS_KEY = "onefinance.sidebar.expandedYears";

function loadExpandedYears(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(EXPANDED_YEARS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const out: Record<number, boolean> = {};
    for (const [k, v] of Object.entries(parsed)) out[Number(k)] = Boolean(v);
    return out;
  } catch {
    return {};
  }
}

function saveExpandedYears(value: Record<number, boolean>) {
  localStorage.setItem(EXPANDED_YEARS_KEY, JSON.stringify(value));
}

function App() {
  const [view, setView] = useState<"dashboard" | "ledger" | "settings">(
    "dashboard"
  );
  const [tree, setTree] = useState<LedgerYearNode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<LedgerPeriod | null>(
    null
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentTransaction[]>([]);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(
    () => loadExpandedYears()
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  const selectedPeriodId = selectedPeriod?.id ?? null;

  const allMonths = useMemo(() => tree.flatMap((y) => y.months), [tree]);

  async function refreshTree(selectPeriodId?: number) {
    const t = await oneFinanceApi.ledger.listTree();
    setTree(t);
    if (typeof selectPeriodId === "number") {
      const found =
        t.flatMap((y) => y.months).find((m) => m.id === selectPeriodId) ?? null;
      if (found) setSelectedPeriod(found);
    }
    return t;
  }

  async function refreshCategories() {
    const c = await oneFinanceApi.categories.list();
    setCategories(c);
  }

  async function refreshTransactions(periodId: number) {
    const rows = await oneFinanceApi.transactions.list(periodId);
    setTransactions(rows);
  }

  async function refreshDashboard() {
    const [s, r] = await Promise.all([
      oneFinanceApi.transactions.summary(),
      oneFinanceApi.transactions.recent(8),
    ]);
    setSummary(s);
    setRecent(r);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [info] = await Promise.all([
          oneFinanceApi.app.getInfo(),
          refreshTree(),
          refreshCategories(),
          refreshDashboard(),
        ]);
        setAppInfo(info);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedPeriodId) {
      setTransactions([]);
      return;
    }
    void (async () => {
      setError(null);
      try {
        await refreshTransactions(selectedPeriodId);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load transactions"
        );
      }
    })();
  }, [selectedPeriodId]);

  useEffect(() => {
    if (selectedPeriod) return;
    if (allMonths.length === 0) return;
    setSelectedPeriod(allMonths[0]);
  }, [allMonths, selectedPeriod]);

  const onToggleYear = (year: number) => {
    const next = { ...expandedYears, [year]: !(expandedYears[year] ?? true) };
    setExpandedYears(next);
    saveExpandedYears(next);
  };

  const onCreateYear = async (year: number) => {
    try {
      await oneFinanceApi.ledger.createYear(year);
      const next = { ...expandedYears, [year]: true };
      setExpandedYears(next);
      saveExpandedYears(next);
      await refreshTree();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create year");
    }
  };

  const onDeleteYear = async (year: number) => {
    const ok = window.confirm(
      `Delete year ${year}? This will delete its months and transactions.`
    );
    if (!ok) return;

    try {
      await oneFinanceApi.ledger.deleteYear(year);
      const next = { ...expandedYears };
      delete next[year];
      setExpandedYears(next);
      saveExpandedYears(next);

      const t = await refreshTree();
      const stillSelected =
        selectedPeriodId &&
        t.flatMap((y) => y.months).some((m) => m.id === selectedPeriodId);
      if (!stillSelected) {
        const first = t.flatMap((y) => y.months)[0] ?? null;
        setSelectedPeriod(first);
      }

      await refreshDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete year");
    }
  };

  const onCreateTransaction: ComponentProps<
    typeof TransactionsView
  >["onCreate"] = async (input) => {
    await oneFinanceApi.transactions.create(input);
    await refreshTransactions(input.ledgerPeriodId);
    await refreshDashboard();
  };

  const onUpdateTransaction: ComponentProps<
    typeof TransactionsView
  >["onUpdate"] = async (input) => {
    await oneFinanceApi.transactions.update(input);
    await refreshTransactions(input.ledgerPeriodId);
    await refreshDashboard();
  };

  const onDeleteTransaction: ComponentProps<
    typeof TransactionsView
  >["onDelete"] = async (id) => {
    await oneFinanceApi.transactions.delete(id);
    if (selectedPeriod) await refreshTransactions(selectedPeriod.id);
    await refreshDashboard();
  };

  const onCreateCategory = async (name: string) => {
    await oneFinanceApi.categories.create({ name });
    await refreshCategories();
  };

  const onRenameCategory = async (id: number, name: string) => {
    await oneFinanceApi.categories.update({ id, name });
    await refreshCategories();
    if (selectedPeriod) await refreshTransactions(selectedPeriod.id);
    await refreshDashboard();
  };

  const onDeleteCategory = async (id: number) => {
    await oneFinanceApi.categories.delete(id);
    await refreshCategories();
    if (selectedPeriod) await refreshTransactions(selectedPeriod.id);
    await refreshDashboard();
  };

  return (
    <div className="appShell">
      <Sidebar
        tree={tree}
        selectedPeriodId={selectedPeriod?.id ?? null}
        expandedYears={expandedYears}
        onToggleYear={onToggleYear}
        onSelectPeriod={setSelectedPeriod}
        onCreateYear={onCreateYear}
        onDeleteYear={onDeleteYear}
        view={view}
        onNavigate={setView}
      />

      <main className="main">
        {loading ? (
          <div className="contentEmpty">
            <div className="panelTitle">Loading…</div>
          </div>
        ) : (
          <>
            {error && <div className="error global">{error}</div>}

            {view === "settings" ? (
              <SettingsView
                info={appInfo}
                onOpenDbFolder={async () => {
                  await oneFinanceApi.app.openDbFolder();
                }}
                onDeleteDb={async () => {
                  await oneFinanceApi.app.deleteDb();
                  // In dev we do not relaunch the whole Electron process.
                  // Reloading the renderer forces a clean re-init.
                  window.location.reload();
                }}
                categories={categories}
                onCreateCategory={onCreateCategory}
                onRenameCategory={onRenameCategory}
                onDeleteCategory={onDeleteCategory}
              />
            ) : view === "dashboard" ? (
              <DashboardView summary={summary} recent={recent} />
            ) : (
              <>
                <TransactionsView
                  period={selectedPeriod}
                  categories={categories}
                  transactions={transactions}
                  onCreate={onCreateTransaction}
                  onUpdate={onUpdateTransaction}
                  onDelete={onDeleteTransaction}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

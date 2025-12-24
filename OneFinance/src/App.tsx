import { useEffect, useMemo, useState, type ComponentProps } from "react";
import "./App.css";
import type {
  Category,
  LedgerPeriod,
  LedgerYearNode,
  Transaction,
} from "./types";
import { Sidebar } from "./components/Sidebar";
import { TransactionsView } from "./components/TransactionsView";
import { CategoriesManager } from "./components/CategoriesManager";
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
  const [tree, setTree] = useState<LedgerYearNode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<LedgerPeriod | null>(
    null
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(
    () => loadExpandedYears()
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbFilePath, setDbFilePath] = useState<string | null>(null);

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
  }

  async function refreshCategories() {
    const c = await oneFinanceApi.categories.list();
    setCategories(c);
  }

  async function refreshTransactions(periodId: number) {
    const rows = await oneFinanceApi.transactions.list(periodId);
    setTransactions(rows);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [paths] = await Promise.all([
          oneFinanceApi.app.getPaths(),
          refreshTree(),
          refreshCategories(),
        ]);
        setDbFilePath(paths.dbFilePath);
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

  const onCreateMonth = async (year: number, month: number) => {
    try {
      const created = await oneFinanceApi.ledger.createMonth(year, month);
      const next = { ...expandedYears, [year]: true };
      setExpandedYears(next);
      saveExpandedYears(next);
      await refreshTree(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create month");
    }
  };

  const onCreateTransaction: ComponentProps<
    typeof TransactionsView
  >["onCreate"] = async (input) => {
    await oneFinanceApi.transactions.create(input);
    await refreshTransactions(input.ledgerPeriodId);
  };

  const onUpdateTransaction: ComponentProps<
    typeof TransactionsView
  >["onUpdate"] = async (input) => {
    await oneFinanceApi.transactions.update(input);
    await refreshTransactions(input.ledgerPeriodId);
  };

  const onDeleteTransaction: ComponentProps<
    typeof TransactionsView
  >["onDelete"] = async (id) => {
    await oneFinanceApi.transactions.delete(id);
    if (selectedPeriod) await refreshTransactions(selectedPeriod.id);
  };

  const onCreateCategory = async (name: string) => {
    await oneFinanceApi.categories.create({ name });
    await refreshCategories();
  };

  const onRenameCategory = async (id: number, name: string) => {
    await oneFinanceApi.categories.update({ id, name });
    await refreshCategories();
    if (selectedPeriod) await refreshTransactions(selectedPeriod.id);
  };

  const onDeleteCategory = async (id: number) => {
    await oneFinanceApi.categories.delete(id);
    await refreshCategories();
    if (selectedPeriod) await refreshTransactions(selectedPeriod.id);
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
        onCreateMonth={onCreateMonth}
        dbFilePath={dbFilePath}
      />

      <main className="main">
        {loading ? (
          <div className="contentEmpty">
            <div className="panelTitle">Loading…</div>
          </div>
        ) : (
          <>
            {error && <div className="error global">{error}</div>}

            <TransactionsView
              period={selectedPeriod}
              categories={categories}
              transactions={transactions}
              onCreate={onCreateTransaction}
              onUpdate={onUpdateTransaction}
              onDelete={onDeleteTransaction}
            />

            <CategoriesManager
              categories={categories}
              onCreate={onCreateCategory}
              onRename={onRenameCategory}
              onDelete={onDeleteCategory}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;

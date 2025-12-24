import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  LedgerPeriod,
  Transaction,
  TransactionType,
} from "../types";
import { monthName } from "../lib/date";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function defaultDateForPeriod(period: LedgerPeriod) {
  // Pick a deterministic default inside the selected month.
  return `${period.year}-${pad2(period.month)}-01`;
}

export function TransactionsView(props: {
  period: LedgerPeriod | null;
  categories: Category[];
  transactions: Transaction[];
  onCreate: (input: {
    ledgerPeriodId: number;
    title: string;
    amount: number;
    date: string;
    type: TransactionType;
    notes?: string | null;
    categoryId?: number | null;
  }) => Promise<void>;
  onUpdate: (input: {
    id: number;
    ledgerPeriodId: number;
    title: string;
    amount: number;
    date: string;
    type: TransactionType;
    notes?: string | null;
    categoryId?: number | null;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const period = props.period;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2000-01-01");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const defaultDate = useMemo(() => {
    if (!period) return "2000-01-01";
    return defaultDateForPeriod(period);
  }, [period]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of props.transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [props.transactions]);

  useEffect(() => {
    if (!period) return;
    setEditingId(null);
    setShowEditor(false);
    setTitle("");
    setAmount("");
    setDate(defaultDate);
    setType("expense");
    setCategoryId("");
    setNotes("");
    setError(null);
  }, [period, defaultDate]);

  const resetEditor = () => {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setDate(defaultDate);
    setType("expense");
    setCategoryId("");
    setNotes("");
    setError(null);
    setShowEditor(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setDate(defaultDate);
    setType("expense");
    setCategoryId("");
    setNotes("");
    setError(null);
    setShowEditor(true);
  };

  if (!period) {
    return (
      <section className="contentEmpty">
        <div className="panelTitle">Pick a Month</div>
        <div className="muted">
          Select a month from the left sidebar to view and edit transactions.
        </div>
      </section>
    );
  }

  const periodId = period.id;

  const periodTitle = `${monthName(period.month)} ${period.year}`;

  const onSubmit = async () => {
    setError(null);
    try {
      const a = Number(amount);
      if (!title.trim()) throw new Error("Title is required");
      if (!Number.isFinite(a)) throw new Error("Amount must be a number");
      if (!date.trim()) throw new Error("Date is required");

      const parsedCategoryId = categoryId ? Number(categoryId) : null;
      if (categoryId && !Number.isInteger(parsedCategoryId))
        throw new Error("Invalid category");

      if (editingId) {
        await props.onUpdate({
          id: editingId,
          ledgerPeriodId: periodId,
          title: title.trim(),
          amount: a,
          date,
          type,
          notes: notes.trim() ? notes.trim() : null,
          categoryId: parsedCategoryId,
        });
      } else {
        await props.onCreate({
          ledgerPeriodId: periodId,
          title: title.trim(),
          amount: a,
          date,
          type,
          notes: notes.trim() ? notes.trim() : null,
          categoryId: parsedCategoryId,
        });
      }

      resetEditor();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save transaction");
    }
  };

  return (
    <section className="content">
      <div className="panel">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">{periodTitle}</div>
            <div className="txMeta">
              <span className="txPill">
                <span className="muted">Net</span>{" "}
                <span className="mono">{summary.net.toFixed(2)}</span>
              </span>
              <span className="txPill">
                <span className="muted">Income</span>{" "}
                <span className="mono amount income">
                  {summary.income.toFixed(2)}
                </span>
              </span>
              <span className="txPill">
                <span className="muted">Expense</span>{" "}
                <span className="mono amount expense">
                  {summary.expense.toFixed(2)}
                </span>
              </span>
            </div>
          </div>

          <div className="panelHeaderActions">
            <button
              className="btn btnIcon"
              onClick={() => {
                if (showEditor) resetEditor();
                else openCreate();
              }}
              title={showEditor ? "Close" : "Add transaction"}
              aria-label={showEditor ? "Close" : "Add transaction"}
            >
              <span className="icon">{showEditor ? "×" : "＋"}</span>
              <span>{showEditor ? "Close" : "Add"}</span>
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {showEditor && (
          <div className="txEditor">
            <div className="formGrid">
              <div className="field span3">
                <label className="label">Type</label>
                <select
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="field span5">
                <label className="label">Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Groceries"
                />
              </div>

              <div className="field span2">
                <label className="label">Amount</label>
                <input
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 45.50"
                />
              </div>

              <div className="field span2">
                <label className="label">Date</label>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="field span4">
                <label className="label">Category</label>
                <select
                  className="input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">(none)</option>
                  {props.categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field span8">
                <label className="label">Notes</label>
                <input
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="field span12">
                <div className="row gap">
                  <button className="btn" onClick={onSubmit}>
                    {editingId ? "Update" : "Add"}
                  </button>
                  <button className="btn" onClick={resetEditor}>
                    Cancel
                  </button>
                  <div className="muted small">
                    This transaction will appear in the month matching its date.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">Transactions</div>
            <div className="muted small">
              {props.transactions.length} record(s)
            </div>
          </div>
        </div>

        <div className="table">
          <div className="tableHead">
            <div>Date</div>
            <div>Title</div>
            <div>Category</div>
            <div className="right">Amount</div>
            <div></div>
          </div>

          {props.transactions.map((t) => (
            <div key={t.id} className="tableRow">
              <div className="mono">{t.date}</div>
              <div>
                <div>{t.title}</div>
                {t.notes && <div className="muted small">{t.notes}</div>}
              </div>
              <div className="muted">{t.categoryName ?? "(none)"}</div>
              <div
                className={
                  t.type === "income"
                    ? "right amount income"
                    : "right amount expense"
                }
              >
                {t.type === "income" ? "+" : "-"}
                {t.amount.toFixed(2)}
              </div>
              <div className="row gap right txRowActions">
                <button
                  className="iconBtn solid"
                  title="Edit"
                  aria-label="Edit"
                  onClick={() => {
                    setEditingId(t.id);
                    setTitle(t.title);
                    setAmount(String(t.amount));
                    setDate(t.date);
                    setType(t.type);
                    setCategoryId(t.categoryId ? String(t.categoryId) : "");
                    setNotes(t.notes ?? "");
                    setError(null);
                    setShowEditor(true);
                  }}
                >
                  <span className="icon">✎</span>
                </button>
                <button
                  className="iconBtn solid danger"
                  title="Delete"
                  aria-label="Delete"
                  onClick={async () => {
                    const ok = window.confirm(
                      `Delete transaction "${t.title}"?`
                    );
                    if (!ok) return;
                    await props.onDelete(t.id);
                  }}
                >
                  <span className="icon">🗑</span>
                </button>
              </div>
            </div>
          ))}

          {props.transactions.length === 0 && (
            <div className="tableEmpty">
              <div className="muted">No transactions yet.</div>
              <div className="muted small">Click “Add” to create one.</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

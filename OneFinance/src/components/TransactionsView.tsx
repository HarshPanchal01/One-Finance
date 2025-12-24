import { useEffect, useMemo, useState } from "react";
import type {
  Category,
  LedgerPeriod,
  Transaction,
  TransactionType,
} from "../types";
import { isoDateToday, monthName } from "../lib/date";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoDateToday());
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setDate(isoDateToday());
    setType("expense");
    setCategoryId("");
    setNotes("");
    setError(null);
  }, [props.period?.id]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of props.transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [props.transactions]);

  if (!props.period) {
    return (
      <section className="contentEmpty">
        <div className="panelTitle">Pick a Month</div>
        <div className="muted">
          Select a month from the left sidebar to view and edit transactions.
        </div>
      </section>
    );
  }

  const periodId = props.period.id;

  const periodTitle = `${monthName(props.period.month)} ${props.period.year}`;

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

      setEditingId(null);
      setTitle("");
      setAmount("");
      setDate(isoDateToday());
      setType("expense");
      setCategoryId("");
      setNotes("");
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
            <div className="muted small">
              Income: {summary.income.toFixed(2)} · Expense:{" "}
              {summary.expense.toFixed(2)} · Net: {summary.net.toFixed(2)}
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="formGrid">
          <div className="field">
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

          <div className="field">
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Groceries"
            />
          </div>

          <div className="field">
            <label className="label">Amount</label>
            <input
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 45.50"
            />
          </div>

          <div className="field">
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
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

          <div className="field fieldSpan">
            <label className="label">Notes</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="row gap">
            <button className="btn" onClick={onSubmit}>
              {editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button
                className="btn"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setAmount("");
                  setDate(isoDateToday());
                  setType("expense");
                  setCategoryId("");
                  setNotes("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
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
              <div className="row gap right">
                <button
                  className="btn"
                  onClick={() => {
                    setEditingId(t.id);
                    setTitle(t.title);
                    setAmount(String(t.amount));
                    setDate(t.date);
                    setType(t.type);
                    setCategoryId(t.categoryId ? String(t.categoryId) : "");
                    setNotes(t.notes ?? "");
                    setError(null);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn danger"
                  onClick={async () => {
                    const ok = window.confirm(
                      `Delete transaction "${t.title}"?`
                    );
                    if (!ok) return;
                    await props.onDelete(t.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {props.transactions.length === 0 && (
            <div className="muted">No transactions yet</div>
          )}
        </div>
      </div>
    </section>
  );
}

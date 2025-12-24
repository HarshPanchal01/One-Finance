import type { RecentTransaction, Summary } from "../types";

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DashboardView(props: {
  summary: Summary | null;
  recent: RecentTransaction[];
}) {
  return (
    <section className="content">
      <div className="panel">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">Dashboard</div>
            <div className="muted small">Totals and recent activity</div>
          </div>
        </div>

        <div className="dashStats">
          <div className="dashStat">
            <div className="muted small">Balance</div>
            <div className="mono">
              {props.summary ? formatMoney(props.summary.balance) : "…"}
            </div>
          </div>
          <div className="dashStat">
            <div className="muted small">Income</div>
            <div className="mono amount income">
              {props.summary ? formatMoney(props.summary.incomeTotal) : "…"}
            </div>
          </div>
          <div className="dashStat">
            <div className="muted small">Expense</div>
            <div className="mono amount expense">
              {props.summary ? formatMoney(props.summary.expenseTotal) : "…"}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">Recent transactions</div>
            <div className="muted small">Most recent entries across months</div>
          </div>
        </div>

        {props.recent.length === 0 ? (
          <div className="muted">No transactions yet.</div>
        ) : (
          <div className="table">
            <div className="dashRecentHead">
              <div>Date</div>
              <div>Title</div>
              <div>Category</div>
              <div className="right">Amount</div>
            </div>

            {props.recent.map((t) => (
              <div key={t.id} className="dashRecentRow">
                <div className="mono">{t.date}</div>
                <div>{t.title}</div>
                <div className="muted">{t.categoryName ?? "—"}</div>
                <div
                  className={
                    t.type === "income"
                      ? "right mono amount income"
                      : "right mono amount expense"
                  }
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatMoney(Math.abs(t.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import type { LedgerPeriod, LedgerYearNode } from "../types";
import { monthName } from "../lib/date";

export function Sidebar(props: {
  tree: LedgerYearNode[];
  selectedPeriodId: number | null;
  expandedYears: Record<number, boolean>;
  onToggleYear: (year: number) => void;
  onSelectPeriod: (period: LedgerPeriod) => void;
  onCreateYear: (year: number) => Promise<void>;
  onCreateMonth: (year: number, month: number) => Promise<void>;
  dbFilePath: string | null;
}) {
  const [mode, setMode] = useState<"none" | "year" | "month">("none");
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [monthText, setMonthText] = useState(String(new Date().getMonth() + 1));
  const [error, setError] = useState<string | null>(null);

  const selectedYear = useMemo(() => {
    const found = props.tree
      .flatMap((y) => y.months)
      .find((m) => m.id === props.selectedPeriodId);
    return found?.year ?? new Date().getFullYear();
  }, [props.tree, props.selectedPeriodId]);

  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <div className="appTitle">OneFinance</div>
        <div className="sidebarActions">
          <button
            className="btn"
            onClick={() => {
              setError(null);
              setYearText(String(selectedYear));
              setMode(mode === "year" ? "none" : "year");
            }}
            title="Create new year"
          >
            New Year
          </button>
          <button
            className="btn"
            onClick={() => {
              setError(null);
              setYearText(String(selectedYear));
              setMonthText(String(new Date().getMonth() + 1));
              setMode(mode === "month" ? "none" : "month");
            }}
            title="Create new month"
          >
            New Month
          </button>
        </div>

        {props.dbFilePath && (
          <div className="muted small">DB: {props.dbFilePath}</div>
        )}

        {error && <div className="error">{error}</div>}

        {mode === "year" && (
          <div className="row gap">
            <input
              className="input"
              value={yearText}
              onChange={(e) => setYearText(e.target.value)}
              placeholder="Year (e.g. 2025)"
            />
            <button
              className="btn"
              onClick={async () => {
                setError(null);
                const year = Number(yearText);
                if (!Number.isInteger(year)) {
                  setError("Invalid year");
                  return;
                }
                try {
                  await props.onCreateYear(year);
                  setMode("none");
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Failed to create year"
                  );
                }
              }}
            >
              Create
            </button>
          </div>
        )}

        {mode === "month" && (
          <div className="row gap">
            <input
              className="input"
              value={yearText}
              onChange={(e) => setYearText(e.target.value)}
              placeholder="Year"
            />
            <input
              className="input"
              value={monthText}
              onChange={(e) => setMonthText(e.target.value)}
              placeholder="Month (1-12)"
            />
            <button
              className="btn"
              onClick={async () => {
                setError(null);
                const year = Number(yearText);
                const month = Number(monthText);
                if (!Number.isInteger(year)) {
                  setError("Invalid year");
                  return;
                }
                if (!Number.isInteger(month) || month < 1 || month > 12) {
                  setError("Invalid month");
                  return;
                }
                try {
                  await props.onCreateMonth(year, month);
                  setMode("none");
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Failed to create month"
                  );
                }
              }}
            >
              Create
            </button>
          </div>
        )}
      </div>

      <div className="tree">
        {props.tree.length === 0 ? (
          <div className="muted">No years yet. Create one.</div>
        ) : (
          props.tree.map((node) => {
            const expanded = props.expandedYears[node.year] ?? true;
            return (
              <div key={node.year} className="treeYear">
                <button
                  className="treeYearRow"
                  onClick={() => props.onToggleYear(node.year)}
                >
                  <span className="chev">{expanded ? "▾" : "▸"}</span>
                  <span className="folder">{node.year}</span>
                </button>

                {expanded && (
                  <div className="treeMonths">
                    {node.months.length === 0 ? (
                      <div className="muted small">No months yet</div>
                    ) : (
                      node.months.map((m) => {
                        const active = m.id === props.selectedPeriodId;
                        return (
                          <button
                            key={m.id}
                            className={
                              active ? "treeMonthRow active" : "treeMonthRow"
                            }
                            onClick={() => props.onSelectPeriod(m)}
                          >
                            {monthName(m.month)}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import type { LedgerPeriod, LedgerYearNode } from "../types";
import { monthName } from "../lib/date";

export function Sidebar(props: {
  tree: LedgerYearNode[];
  selectedPeriodId: number | null;
  expandedYears: Record<number, boolean>;
  onToggleYear: (year: number) => void;
  onSelectPeriod: (period: LedgerPeriod) => void;
  onCreateYear: (year: number) => Promise<void>;
  onDeleteYear: (year: number) => Promise<void>;
  view: "dashboard" | "ledger" | "settings";
  onNavigate: (view: "dashboard" | "ledger" | "settings") => void;
}) {
  const [mode, setMode] = useState<"none" | "year">("none");
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<
    { open: false } | { open: true; x: number; y: number; year: number }
  >({ open: false });
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedYear = useMemo(() => {
    const found = props.tree
      .flatMap((y) => y.months)
      .find((m) => m.id === props.selectedPeriodId);
    return found?.year ?? new Date().getFullYear();
  }, [props.tree, props.selectedPeriodId]);

  useEffect(() => {
    if (!menu.open) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setMenu({ open: false });
    };
    const onScroll = () => setMenu({ open: false });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu({ open: false });
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu.open]);

  return (
    <aside className="sidebar">
      <div className="sidebarTop">
        <div className="sidebarHeaderRow">
          <div className="appTitle">OneFinance</div>
          <div className="sidebarHeaderActions">
            <button
              className="iconBtn"
              onClick={() => {
                setError(null);
                setYearText(String(selectedYear));
                setMode(mode === "year" ? "none" : "year");
              }}
              title="New Year"
              aria-label="New Year"
            >
              <span className="icon">📁＋</span>
            </button>
          </div>
        </div>

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
      </div>

      <div className="tree">
        <button
          className={
            props.view === "dashboard" ? "treeTopRow active" : "treeTopRow"
          }
          onClick={() => props.onNavigate("dashboard")}
          title="Dashboard"
        >
          <span className="treeIcon">🏠</span>
          <span>Home</span>
        </button>

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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenu({
                      open: true,
                      x: e.clientX,
                      y: e.clientY,
                      year: node.year,
                    });
                  }}
                >
                  <span className="chev">{expanded ? "▾" : "▸"}</span>
                  <span className="folder">{node.year}</span>
                </button>

                {expanded && (
                  <div className="treeMonths">
                    {node.months.length === 0 ? (
                      <div className="muted small">No months</div>
                    ) : (
                      node.months.map((m) => {
                        const active = m.id === props.selectedPeriodId;
                        return (
                          <button
                            key={m.id}
                            className={
                              active ? "treeMonthRow active" : "treeMonthRow"
                            }
                            onClick={() => {
                              if (props.view !== "ledger")
                                props.onNavigate("ledger");
                              props.onSelectPeriod(m);
                            }}
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

      <div className="sidebarFooter">
        <button
          className={props.view === "settings" ? "iconBtn active" : "iconBtn"}
          onClick={() =>
            props.onNavigate(props.view === "settings" ? "ledger" : "settings")
          }
          title="Settings"
          aria-label="Settings"
        >
          <span className="icon">⚙</span>
        </button>
      </div>

      {menu.open && (
        <div
          ref={menuRef}
          className="ctxMenu"
          style={{ top: menu.y, left: menu.x }}
        >
          <button
            className="ctxMenuItem danger"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenu({ open: false });
              setError(null);
              try {
                await props.onDeleteYear(menu.year);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to delete year"
                );
              }
            }}
          >
            Delete year
          </button>
        </div>
      )}
    </aside>
  );
}

import { useMemo, useState } from "react";
import type { Category } from "../types";

export function CategoriesManager(props: {
  categories: Category[];
  onCreate: (name: string) => Promise<void>;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...props.categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [props.categories]);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Categories</div>
          <div className="muted small">Used to tag transactions</div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="row gap">
        <input
          className="input"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          className="btn"
          onClick={async () => {
            setError(null);
            try {
              const name = newName.trim();
              if (!name) return;
              await props.onCreate(name);
              setNewName("");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Failed to create category"
              );
            }
          }}
        >
          Add
        </button>
      </div>

      <div className="list">
        {sorted.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            onRename={props.onRename}
            onDelete={props.onDelete}
          />
        ))}

        {sorted.length === 0 && <div className="muted">No categories yet</div>}
      </div>
    </section>
  );
}

function CategoryRow(props: {
  category: Category;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [name, setName] = useState(props.category.name);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="listRow">
      <input
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        className="btn"
        onClick={async () => {
          setError(null);
          try {
            await props.onRename(props.category.id, name.trim());
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Failed to rename category"
            );
          }
        }}
      >
        Save
      </button>
      <button
        className="btn danger"
        onClick={async () => {
          setError(null);
          const ok = window.confirm(
            `Delete category "${props.category.name}"? Transactions will keep but lose this category.`
          );
          if (!ok) return;
          try {
            await props.onDelete(props.category.id);
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Failed to delete category"
            );
          }
        }}
      >
        Delete
      </button>
      {error && <div className="error inline">{error}</div>}
    </div>
  );
}

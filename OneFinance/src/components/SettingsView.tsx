import type { Category } from "../types";
import { CategoriesManager } from "./CategoriesManager";

export type AppInfo = {
  name: string;
  version: string;
  userDataPath: string;
  dbFilePath: string;
};

export function SettingsView(props: {
  info: AppInfo | null;
  onOpenDbFolder: () => Promise<void>;
  onDeleteDb: () => Promise<void>;
  categories: Category[];
  onCreateCategory: (name: string) => Promise<void>;
  onRenameCategory: (id: number, name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}) {
  return (
    <section className="content">
      <div className="panel">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">Settings</div>
            <div className="muted small">App info and storage location</div>
          </div>
        </div>

        {!props.info ? (
          <div className="muted">Loading…</div>
        ) : (
          <div className="kv">
            <div className="kvRow">
              <div className="kvKey">App name</div>
              <div className="kvValue mono">{props.info.name}</div>
            </div>
            <div className="kvRow">
              <div className="kvKey">Version</div>
              <div className="kvValue mono">{props.info.version}</div>
            </div>
            <div className="kvRow">
              <div className="kvKey">DB file</div>
              <div className="kvValue mono">{props.info.dbFilePath}</div>
            </div>
            <div className="kvRow">
              <div className="kvKey">User data</div>
              <div className="kvValue mono">{props.info.userDataPath}</div>
            </div>

            <div className="row gap">
              <button className="btn" onClick={props.onOpenDbFolder}>
                Open DB folder
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">Developer</div>
            <div className="muted small">Unsafe actions for development</div>
          </div>
        </div>

        <div className="row gap">
          <button
            className="btn danger"
            onClick={async () => {
              const ok = window.confirm(
                "Delete the local database? The app will restart."
              );
              if (!ok) return;
              await props.onDeleteDb();
            }}
          >
            Delete DB (dev)
          </button>
          <div className="muted small">
            Deletes the SQLite file and relaunches the app.
          </div>
        </div>
      </div>

      <CategoriesManager
        categories={props.categories}
        onCreate={props.onCreateCategory}
        onRename={props.onRenameCategory}
        onDelete={props.onDeleteCategory}
      />
    </section>
  );
}

import { useStore } from "../store";
import { useUI } from "../uiStore";
import type { View } from "../types";

const LISTS: Array<[View, string, string]> = [
  ["scheduled", "🗓", "Scheduled"],
  ["waiting", "📮", "Waiting For"],
  ["someday", "🌱", "Someday / Maybe"],
  ["reference", "📚", "Reference"],
  ["done", "🏁", "Logbook"],
];

function MenuItem({ view, ic, label }: { view: View; ic: string; label: string }) {
  const setView = useUI((s) => s.setView);
  const n = useStore((s) =>
    view === "done"
      ? 0
      : s.items.filter((i) => !i.deleted && i.list === view).length,
  );
  return (
    <div className="item" onClick={() => setView(view)}>
      <div className="ic">{ic}</div>
      <div className="body">
        <div className="title" style={{ fontWeight: 600 }}>
          {label}
        </div>
      </div>
      <div className="cnt">{view === "done" ? "" : n || ""}</div>
    </div>
  );
}

export function MoreView() {
  const setView = useUI((s) => s.setView);
  return (
    <>
      <div className="card menu-list">
        {LISTS.map(([v, ic, label]) => (
          <MenuItem key={v} view={v} ic={ic} label={label} />
        ))}
      </div>
      <div className="card menu-list">
        <div className="item" onClick={() => setView("settings")}>
          <div className="ic">⚙️</div>
          <div className="body">
            <div className="title" style={{ fontWeight: 600 }}>
              Settings & Sync
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


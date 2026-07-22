import { useInList } from "../store";
import { useUI } from "../uiStore";
import { EmptyState } from "../components/EmptyState";

export function DoneView() {
  const list = useInList("done")
    .slice()
    .sort((a, b) => ((b.completedAt || "") < (a.completedAt || "") ? -1 : 1))
    .slice(0, 100);
  const openSheet = useUI((s) => s.openSheet);

  if (!list.length) {
    return (
      <EmptyState
        icon="🏁"
        title="Nothing completed yet"
        desc="Completed actions collect here, your record of progress."
      />
    );
  }

  return (
    <div className="card">
      {list.map((i) => (
        <div key={i.id} className="item">
          <div
            className="body"
            onClick={() => openSheet({ kind: "edit", id: i.id })}
          >
            <div className="title" style={{ color: "var(--ink2)" }}>
              {i.title}
            </div>
            <div className="age">
              ✓{" "}
              {i.completedAt
                ? new Date(i.completedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })
                : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useInList } from "../store";
import { useUI } from "../uiStore";
import { ItemRow } from "../components/ItemRow";
import { EmptyState } from "../components/EmptyState";

export function InboxView() {
  const list = useInList("inbox");
  const openSheet = useUI((s) => s.openSheet);

  if (!list.length) {
    return (
      <EmptyState
        icon="🌊"
        title="Inbox zero"
        desc="Mind like water. Capture anything that has your attention (a thought, task, idea) and clarify it when you're ready."
      />
    );
  }

  const startBatch = () => {
    const q = list.map((i) => i.id);
    const first = q.shift();
    if (first) openSheet({ kind: "clarify", id: first, queue: q });
  };

  return (
    <>
      <div className="vdesc">
        Tap an item to clarify it: decide what it is and where it goes.
      </div>
      <div className="card">
        {list.map((i) => (
          <ItemRow
            key={i.id}
            item={i}
            tapAction="clarify"
            noTick
            ageLabel="in inbox"
          />
        ))}
      </div>
      {list.length > 1 && (
        <button className="btn ghost" onClick={startBatch}>
          Process inbox → {list.length} items
        </button>
      )}
    </>
  );
}

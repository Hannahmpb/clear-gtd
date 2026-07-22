import { useState } from "react";
import type { Item } from "../types";
import { useStore, selectById } from "../store";
import { useUI } from "../uiStore";
import { fmtDate, isOverdue, ago } from "../utils/dates";
import { projChipStyle } from "../utils/projects";
import { scheduleSync } from "../sync";
import { TickIcon } from "./icons";

interface Props {
  item: Item;
  tapAction?: "edit" | "clarify";
  noTick?: boolean;
  ageLabel?: string | null;
}

function ItemMeta({ item }: { item: Item }) {
  const project = useStore((s) =>
    item.project ? selectById(item.project)(s) : undefined,
  );
  const parts: React.ReactNode[] = [];
  if (item.context) {
    parts.push(
      <span key="ctx" className="chip ctx">
        {item.context}
      </span>,
    );
  }
  if (project && !project.deleted) {
    parts.push(
      <span key="proj" className="chip proj" style={projChipStyle(project.id)}>
        {project.title}
      </span>,
    );
  }
  if (item.who) {
    parts.push(
      <span key="who" className="chip who">
        {item.who}
      </span>,
    );
  }
  if (item.date) {
    parts.push(
      <span
        key="date"
        className={"chip date" + (isOverdue(item.date) ? " overdue" : "")}
      >
        {fmtDate(item.date)}
      </span>,
    );
  }
  if (!parts.length) return null;
  return <div className="meta">{parts}</div>;
}

export function ItemRow({ item, tapAction = "edit", noTick, ageLabel }: Props) {
  const [animDone, setAnimDone] = useState(false);
  const openSheet = useUI((s) => s.openSheet);
  const showUndoToast = useUI((s) => s.showUndoToast);
  const snapshot = useStore((s) => s.snapshot);
  const completeItem = useStore((s) => s.completeItem);

  const handleTap = () => {
    if (tapAction === "clarify") {
      openSheet({ kind: "clarify", id: item.id, queue: [] });
    } else {
      openSheet({ kind: "edit", id: item.id });
    }
  };

  const handleTick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const snap = snapshot([item.id]);
    setAnimDone(true);
    setTimeout(() => {
      completeItem(item.id);
      showUndoToast("Done ✓ (find it in the Logbook)", {
        restore: snap,
        removeIds: [],
      });
      scheduleSync();
    }, 350);
  };

  return (
    <div className={"item" + (animDone ? " done-anim" : "")}>
      {!noTick && (
        <button className="tick" onClick={handleTick} aria-label="Complete">
          <TickIcon />
        </button>
      )}
      <div className="body" onClick={handleTap}>
        <div className="title">{item.title}</div>
        {item.note && <div className="note-preview">{item.note}</div>}
        <ItemMeta item={item} />
        {ageLabel && (
          <div className="age">
            {ageLabel} {ago(item.created)}
          </div>
        )}
      </div>
    </div>
  );
}

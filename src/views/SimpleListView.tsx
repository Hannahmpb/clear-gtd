import { useInList } from "../store";
import { ItemRow } from "../components/ItemRow";
import { EmptyState } from "../components/EmptyState";
import type { List } from "../types";

const CFG: Record<string, { icon: string; title: string; desc: string }> = {
  waiting: {
    icon: "📮",
    title: "Nothing pending",
    desc: "When you delegate or wait on someone, track it here so nothing slips.",
  },
  someday: {
    icon: "🌱",
    title: "No someday items",
    desc: "Dreams, ideas and maybes, parked safely so your mind can let go.",
  },
  reference: {
    icon: "📚",
    title: "No reference material",
    desc: "Non-actionable information you want to keep findable.",
  },
};

export function SimpleListView({ list }: { list: List }) {
  const items = useInList(list);
  const cfg = CFG[list];

  if (!items.length) {
    return <EmptyState icon={cfg.icon} title={cfg.title} desc={cfg.desc} />;
  }

  return (
    <div className="card">
      {items.map((i) => (
        <ItemRow
          key={i.id}
          item={i}
          noTick={list === "reference"}
          ageLabel={list === "waiting" ? "waiting" : null}
        />
      ))}
    </div>
  );
}

import { useInList } from "../store";
import { ItemRow } from "../components/ItemRow";
import { EmptyState } from "../components/EmptyState";
import { todayStr } from "../utils/dates";
import type { Item } from "../types";

export function ScheduledView() {
  const list = useInList("scheduled")
    .slice()
    .sort((a, b) => ((a.date || "9999") < (b.date || "9999") ? -1 : 1));

  if (!list.length) {
    return (
      <EmptyState
        icon="🗓"
        title="Nothing scheduled"
        desc="Items with a hard date land here: day-specific actions and reminders."
      />
    );
  }

  const t = todayStr();
  const groups: Array<[string, (i: Item) => boolean]> = [
    ["Overdue", (i) => !!i.date && i.date < t],
    ["Today", (i) => i.date === t],
    ["Upcoming", (i) => !!i.date && i.date > t],
  ];

  return (
    <>
      {groups.map(([label, fn]) => {
        const g = list.filter(fn);
        if (!g.length) return null;
        return (
          <div key={label}>
            <div className="glabel">{label}</div>
            <div className="card">
              {g.map((i) => (
                <ItemRow key={i.id} item={i} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

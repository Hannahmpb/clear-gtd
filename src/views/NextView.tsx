import { useStore, useInList } from "../store";
import { ItemRow } from "../components/ItemRow";
import { EmptyState } from "../components/EmptyState";

export function NextView() {
  const all = useInList("next");
  const contexts = useStore((s) => s.meta.contexts);
  const filter = useStore((s) => s.meta.ctxFilter);
  const setFilter = useStore((s) => s.setCtxFilter);

  const list = (filter ? all.filter((i) => i.context === filter) : all)
    .slice()
    .sort((a, b) => ((a.date || "9999") < (b.date || "9999") ? -1 : 1));

  return (
    <>
      <div className="filterbar">
        <button
          className={"fchip" + (!filter ? " on" : "")}
          onClick={() => setFilter(null)}
        >
          All
        </button>
        {contexts.map((c) => (
          <button
            key={c}
            className={"fchip" + (filter === c ? " on" : "")}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="vdesc">
        Contexts answer "where, or with what tool, can I do this?" Filter to see
        only what you can actually do right now. Anything with a due date sorts
        to the top.
      </div>
      {list.length ? (
        <div className="card">
          {list.map((i) => (
            <ItemRow key={i.id} item={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="✨"
          title={filter ? "Nothing for " + filter : "No next actions"}
          desc={
            filter
              ? "Try another context, or clarify your inbox."
              : "Clarify items from your inbox to build this list."
          }
        />
      )}
    </>
  );
}

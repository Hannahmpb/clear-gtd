import { useStore, useInList } from "../store";
import { useUI } from "../uiStore";
import { EmptyState } from "../components/EmptyState";
import {
  projectActionsDeep,
  projectIsStalled,
  subProjects,
  topProjects,
  projDotStyle,
} from "../utils/projects";
import type { Item } from "../types";
import { scheduleSync } from "../sync";

function ProjectRow({ p, isSub }: { p: Item; isSub?: boolean }) {
  const items = useStore((s) => s.items);
  const openSheet = useUI((s) => s.openSheet);
  const acts = projectActionsDeep(items, p.id);
  const stalled = acts.length === 0;
  return (
    <div className={"item" + (isSub ? " sub" : "")}>
      <div
        className="body"
        onClick={() => openSheet({ kind: "project", id: p.id })}
      >
        <div className="title">
          {isSub && <span style={{ color: "var(--ink3)" }}>↳ </span>}
          <span className="pdot" style={projDotStyle(p.id)} />
          {p.title}
        </div>
        {p.note && <div className="note-preview">{p.note}</div>}
        <div className="meta">
          {stalled ? (
            <span className="chip stalled">⚠ no next action</span>
          ) : (
            <span className="chip">
              {acts.length} action{acts.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectsView() {
  const items = useStore((s) => s.items);
  const projects = useInList("project");
  const addItem = useStore((s) => s.addItem);
  const openSheet = useUI((s) => s.openSheet);

  const newProject = () => {
    const it = addItem("New project", "project");
    openSheet({ kind: "edit", id: it.id });
    scheduleSync();
  };

  if (!projects.length) {
    return (
      <>
        <EmptyState
          icon="🎯"
          title="No projects yet"
          desc="A project is any outcome needing more than one action step. They'll appear here when you clarify inbox items into projects."
        />
        <button className="btn ghost" onClick={newProject}>
          + New project
        </button>
      </>
    );
  }

  const tops = topProjects(items);
  const stalledCount = tops.filter((p) => projectIsStalled(items, p.id)).length;

  return (
    <>
      {stalledCount > 0 && (
        <div className="nudge">
          ⚠ {stalledCount} project{stalledCount > 1 ? "s have" : " has"} no next
          action. A project without a next action is stuck.
        </div>
      )}
      <div className="card">
        {tops.map((p) => (
          <div key={p.id}>
            <ProjectRow p={p} />
            {subProjects(items, p.id).map((sp) => (
              <ProjectRow key={sp.id} p={sp} isSub />
            ))}
          </div>
        ))}
      </div>
      <button className="btn ghost" onClick={newProject}>
        + New project
      </button>
    </>
  );
}

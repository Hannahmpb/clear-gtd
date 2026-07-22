import { useState } from "react";
import { useStore, selectById } from "../store";
import { useUI } from "../uiStore";
import { ItemRow } from "../components/ItemRow";
import {
  projectActions,
  projectIsStalled,
  subProjects,
  projDotStyle,
} from "../utils/projects";
import { scheduleSync } from "../sync";

export function ProjectSheet({ id }: { id: string }) {
  const p = useStore(selectById(id));
  const items = useStore((s) => s.items);
  const addItem = useStore((s) => s.addItem);
  const updateItem = useStore((s) => s.updateItem);
  const completeItem = useStore((s) => s.completeItem);
  const openSheet = useUI((s) => s.openSheet);
  const closeSheet = useUI((s) => s.closeSheet);
  const showToast = useUI((s) => s.showToast);
  const [na, setNa] = useState("");

  if (!p) return null;

  const acts = projectActions(items, id);
  const subs = subProjects(items, id);
  const parent = p.project ? items.find((i) => i.id === p.project) : null;
  const doneActs = items.filter(
    (i) => !i.deleted && i.project === id && i.list === "done",
  );

  const onAdd = () => {
    const v = na.trim();
    if (!v) return;
    addItem(v, "next", { project: id });
    setNa("");
    scheduleSync();
    showToast("Action added");
  };

  const onCompleteProject = () => {
    completeItem(id);
    projectActions(items, id).forEach((a) => {
      updateItem(a.id, { project: null });
    });
    scheduleSync();
    closeSheet();
    showToast("Project complete 🎉");
  };

  return (
    <>
      <h3>
        <span className="pdot" style={projDotStyle(id)} />
        {p.title}
      </h3>
      {parent && !parent.deleted && (
        <div className="vdesc" style={{ margin: "2px 0 0" }}>
          ↰ part of <b>{parent.title}</b>
        </div>
      )}
      {p.note && <div className="q-item">{p.note}</div>}
      {projectIsStalled(items, id) && (
        <div className="nudge" style={{ marginTop: 10 }}>
          ⚠ No next action. What's the very next physical step?
        </div>
      )}
      {subs.length > 0 && (
        <>
          <div className="glabel">Sub-projects</div>
          <div className="card">
            {subs.map((sp) => (
              <div key={sp.id} className="item">
                <div
                  className="body"
                  onClick={() => openSheet({ kind: "project", id: sp.id })}
                >
                  <div className="title">
                    <span className="pdot" style={projDotStyle(sp.id)} />
                    {sp.title}
                  </div>
                  <div className="meta">
                    {projectIsStalled(items, sp.id) ? (
                      <span className="chip stalled">⚠ no next action</span>
                    ) : (
                      <span className="chip">
                        {projectActions(items, sp.id).length} actions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="glabel">Actions</div>
      {acts.length ? (
        <div className="card">
          {acts.map((a) => (
            <ItemRow key={a.id} item={a} />
          ))}
        </div>
      ) : (
        <div className="vdesc">None yet.</div>
      )}
      <div className="frow" style={{ marginTop: 6 }}>
        <input
          type="text"
          value={na}
          onChange={(e) => setNa(e.target.value)}
          placeholder="Add next action…"
          style={{
            width: "100%",
            border: "1px solid var(--line)",
            background: "var(--bg)",
            borderRadius: 12,
            padding: "11px 13px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
      </div>
      <button className="btn" onClick={onAdd}>
        Add action
      </button>
      {doneActs.length > 0 && (
        <div className="glabel">Completed ({doneActs.length})</div>
      )}
      <div className="btnrow">
        <button
          className="btn ghost"
          onClick={() => openSheet({ kind: "edit", id })}
        >
          Edit project
        </button>
        <button className="btn ghost" onClick={onCompleteProject}>
          Complete 🎉
        </button>
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { useStore, selectById, useInList } from "../store";
import { useUI } from "../uiStore";
import { scheduleSync } from "../sync";
import { subProjects } from "../utils/projects";
import type { List } from "../types";

const LIST_LABELS: Array<[List, string]> = [
  ["inbox", "Inbox"],
  ["next", "Next Actions"],
  ["waiting", "Waiting For"],
  ["scheduled", "Scheduled"],
  ["someday", "Someday / Maybe"],
  ["reference", "Reference"],
  ["project", "Project"],
  ["done", "Logbook"],
];

export function EditSheet({ id }: { id: string }) {
  const it = useStore(selectById(id));
  const items = useStore((s) => s.items);
  const contexts = useStore((s) => s.meta.contexts);
  const allProjects = useInList("project");
  const updateItem = useStore((s) => s.updateItem);
  const completeItem = useStore((s) => s.completeItem);
  const trashItem = useStore((s) => s.trashItem);
  const snapshot = useStore((s) => s.snapshot);
  const closeSheet = useUI((s) => s.closeSheet);
  const showToast = useUI((s) => s.showToast);
  const showUndoToast = useUI((s) => s.showUndoToast);

  const [title, setTitle] = useState(it?.title ?? "");
  const [note, setNote] = useState(it?.note ?? "");
  const [list, setList] = useState<List>(it?.list ?? "inbox");
  const [context, setContext] = useState(it?.context ?? "");
  const [project, setProject] = useState(it?.project ?? "");
  const [who, setWho] = useState(it?.who ?? "");
  const [date, setDate] = useState(it?.date ?? "");

  useEffect(() => {
    if (it) {
      setTitle(it.title);
      setNote(it.note);
      setList(it.list);
      setContext(it.context ?? "");
      setProject(it.project ?? "");
      setWho(it.who ?? "");
      setDate(it.date ?? "");
    }
  }, [id, it]);

  if (!it) return null;

  const descIds = new Set<string>();
  const collect = (pid: string) => {
    subProjects(items, pid).forEach((sp) => {
      descIds.add(sp.id);
      collect(sp.id);
    });
  };
  collect(id);
  const projectOptions = allProjects.filter(
    (p) => p.id !== id && !descIds.has(p.id),
  );

  const onSave = () => {
    updateItem(id, {
      title: title.trim() || it.title,
      note: note.trim(),
      list,
      context: context || null,
      project: project || null,
      who: who.trim() || null,
      date: date || null,
    });
    scheduleSync();
    closeSheet();
    showToast("Saved");
  };

  const onComplete = () => {
    const snap = snapshot([id]);
    completeItem(id);
    scheduleSync();
    closeSheet();
    showUndoToast("Done ✓ (find it in the Logbook)", {
      restore: snap,
      removeIds: [],
    });
  };

  const onDelete = () => {
    const snap = snapshot([id]);
    trashItem(id);
    scheduleSync();
    closeSheet();
    showUndoToast("Deleted", { restore: snap, removeIds: [] });
  };

  return (
    <>
      <h3>Edit</h3>
      <div className="frow" style={{ marginTop: 12 }}>
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="frow">
        <label>Notes</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="frow">
        <label>List</label>
        <select value={list} onChange={(e) => setList(e.target.value as List)}>
          {LIST_LABELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="frow">
        <label>Context</label>
        <select
          value={context}
          onChange={(e) => setContext(e.target.value)}
        >
          <option value="">None</option>
          {contexts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {projectOptions.length > 0 && (
        <div className="frow">
          <label>
            {it.list === "project"
              ? "Parent project (makes this a sub-project)"
              : "Project"}
          </label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">None</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="frow">
        <label>Waiting on (who)</label>
        <input
          type="text"
          value={who}
          onChange={(e) => setWho(e.target.value)}
        />
      </div>
      <div className="frow">
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <button className="btn" onClick={onSave}>
        Save
      </button>
      <div className="btnrow">
        {it.list !== "done" && (
          <button className="btn ghost" onClick={onComplete}>
            Complete ✓
          </button>
        )}
        <button className="btn danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { useStore, selectById } from "../store";
import { useUI } from "../uiStore";
import { scheduleSync } from "../sync";
import { todayStr } from "../utils/dates";

type Step =
  | "start"
  | "actionable"
  | "twomin"
  | "defer"
  | "project"
  | "delegate"
  | "schedule";

interface Props {
  id: string;
  queue: string[];
}

function useTimer(active: boolean) {
  const [remaining, setRemaining] = useState(120);
  useEffect(() => {
    if (!active) return;
    setRemaining(120);
    const t = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [active]);
  return remaining;
}

export function ClarifySheet({ id, queue }: Props) {
  const it = useStore(selectById(id));
  const contexts = useStore((s) => s.meta.contexts);
  const items = useStore((s) => s.items);
  const updateItem = useStore((s) => s.updateItem);
  const addItem = useStore((s) => s.addItem);
  const trashItem = useStore((s) => s.trashItem);
  const completeItem = useStore((s) => s.completeItem);
  const snapshot = useStore((s) => s.snapshot);
  const openSheet = useUI((s) => s.openSheet);
  const closeSheet = useUI((s) => s.closeSheet);
  const showUndoToast = useUI((s) => s.showUndoToast);

  const [step, setStep] = useState<Step>("start");
  const [pickedCtx, setPickedCtx] = useState<string | null>(null);
  const [title, setTitle] = useState(it?.title ?? "");
  const [note, setNote] = useState(it?.note ?? "");
  const [date, setDate] = useState<string>("");
  const [na, setNa] = useState("");
  const [who, setWho] = useState("");

  useEffect(() => {
    if (it) {
      setTitle(it.title);
      setNote(it.note);
      setDate("");
      setNa("");
      setWho("");
      setStep("start");
      setPickedCtx(null);
    }
  }, [id, it]);

  const remaining = useTimer(step === "twomin");

  if (!it) return null;

  const goNext = () => {
    const next = queue.slice();
    while (next.length) {
      const nextId = next.shift()!;
      const cand = items.find((i) => i.id === nextId);
      if (cand && !cand.deleted && cand.list === "inbox") {
        openSheet({ kind: "clarify", id: nextId, queue: next });
        return;
      }
    }
    closeSheet();
  };

  const doAndNext = (
    apply: () => void,
    msg: string,
    createdIds: string[] = [],
  ) => {
    const snap = snapshot([id]);
    apply();
    showUndoToast(msg, { restore: snap, removeIds: createdIds });
    scheduleSync();
    goNext();
  };

  const head = (
    <>
      <h3>Clarify</h3>
      <div className="q-item">{it.title}</div>
    </>
  );

  const ctxPicker = (
    <div className="ctx-pick">
      {contexts.map((c) => (
        <button
          key={c}
          type="button"
          className={"fchip" + (pickedCtx === c ? " on" : "")}
          onClick={() => setPickedCtx(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );

  if (step === "start") {
    return (
      <>
        {head}
        <div className="q">Is it actionable?</div>
        <div className="qd">Does something need to happen about this?</div>
        <div className="opts">
          <button
            className="opt teal"
            onClick={() => {
              setPickedCtx(null);
              setStep("actionable");
            }}
          >
            <div className="ic">⚡️</div>
            <div>
              <b>Yes, something to do</b>
              <span>It requires action from you or someone else</span>
            </div>
          </button>
          <button
            className="opt violet"
            onClick={() =>
              doAndNext(
                () => updateItem(id, { list: "someday" }),
                "Parked in Someday/Maybe",
              )
            }
          >
            <div className="ic">🌱</div>
            <div>
              <b>Someday / maybe</b>
              <span>Not now. Park it for review later</span>
            </div>
          </button>
          <button
            className="opt blue"
            onClick={() =>
              doAndNext(
                () => updateItem(id, { list: "reference" }),
                "Filed as Reference",
              )
            }
          >
            <div className="ic">📚</div>
            <div>
              <b>Reference</b>
              <span>Just information worth keeping</span>
            </div>
          </button>
          <button
            className="opt red"
            onClick={() => doAndNext(() => trashItem(id), "Let go 🗑")}
          >
            <div className="ic">🗑</div>
            <div>
              <b>Trash</b>
              <span>Needs nothing. Let it go</span>
            </div>
          </button>
        </div>
      </>
    );
  }

  if (step === "actionable") {
    return (
      <>
        {head}
        <div className="q">What kind of action?</div>
        <div className="qd">If it takes more than one step, it's a project.</div>
        <div className="opts">
          <button className="opt teal" onClick={() => setStep("twomin")}>
            <div className="ic">⏱</div>
            <div>
              <b>Under 2 minutes: do it now</b>
              <span>Doing it beats tracking it</span>
            </div>
          </button>
          <button className="opt blue" onClick={() => setStep("defer")}>
            <div className="ic">➡️</div>
            <div>
              <b>Single next action</b>
              <span>One step, done by you, when you can</span>
            </div>
          </button>
          <button className="opt violet" onClick={() => setStep("project")}>
            <div className="ic">🎯</div>
            <div>
              <b>It's a project</b>
              <span>Multiple steps toward an outcome</span>
            </div>
          </button>
          <button className="opt amber" onClick={() => setStep("delegate")}>
            <div className="ic">📮</div>
            <div>
              <b>Delegate it</b>
              <span>Someone else should do this</span>
            </div>
          </button>
          <button
            className="opt plain"
            onClick={() => {
              setDate(todayStr());
              setStep("schedule");
            }}
          >
            <div className="ic">🗓</div>
            <div>
              <b>Schedule it</b>
              <span>Must happen on a specific day</span>
            </div>
          </button>
        </div>
        <button className="backlink" onClick={() => setStep("start")}>
          ← Back
        </button>
      </>
    );
  }

  if (step === "twomin") {
    const mins = Math.floor(remaining / 60);
    const secs = String(remaining % 60).padStart(2, "0");
    return (
      <>
        {head}
        <div className="timer-wrap">
          <div
            className="timer-num"
            style={remaining === 0 ? { color: "var(--red)" } : undefined}
          >
            {mins}:{secs}
          </div>
          <div className="timer-note">
            If it takes less than two minutes, do it now. It takes longer to
            track than to do.
          </div>
          <button
            className="btn"
            onClick={() =>
              doAndNext(() => completeItem(id), "Done. That's the 2-minute rule ⚡️")
            }
          >
            Done ✓
          </button>
          <button
            className="btn ghost"
            onClick={() => setStep("actionable")}
          >
            It's bigger than I thought
          </button>
        </div>
      </>
    );
  }

  if (step === "defer") {
    return (
      <>
        {head}
        <div className="q">Define the next action</div>
        <div className="qd">
          Make it a visible, physical action: "Call", "Draft", "Buy", not "sort
          out".
        </div>
        <div className="frow">
          <label>Next action</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="frow">
          <label>Context: where can you do it?</label>
          {ctxPicker}
        </div>
        <div className="frow">
          <label>Notes (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Details, links, sub-steps…"
          />
        </div>
        <div className="frow">
          <label>Due date (optional)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button
          className="btn"
          onClick={() =>
            doAndNext(
              () =>
                updateItem(id, {
                  title: title.trim() || it.title,
                  list: "next",
                  context: pickedCtx,
                  note: note.trim(),
                  date: date || null,
                }),
              "Added to Next Actions",
            )
          }
        >
          Add to Next Actions
        </button>
        <button className="backlink" onClick={() => setStep("actionable")}>
          ← Back
        </button>
      </>
    );
  }

  if (step === "project") {
    return (
      <>
        {head}
        <div className="q">Name the project outcome</div>
        <div className="qd">
          Describe what "done" looks like, then decide the very next physical
          action.
        </div>
        <div className="frow">
          <label>Project (desired outcome)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="frow">
          <label>Notes (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why it matters, ideas, sub-steps…"
          />
        </div>
        <div className="frow">
          <label>Very next action</label>
          <input
            type="text"
            value={na}
            onChange={(e) => setNa(e.target.value)}
            placeholder="e.g. Email Sam to get the budget"
          />
        </div>
        <div className="frow">
          <label>Context for that action</label>
          {ctxPicker}
        </div>
        <button
          className="btn"
          onClick={() => {
            const createdIds: string[] = [];
            const snap = snapshot([id]);
            updateItem(id, {
              title: title.trim() || it.title,
              list: "project",
              note: note.trim(),
            });
            if (na.trim()) {
              const created = addItem(na.trim(), "next", {
                context: pickedCtx,
                project: id,
              });
              createdIds.push(created.id);
            }
            showUndoToast(
              "Project created" + (na.trim() ? " with next action" : ""),
              { restore: snap, removeIds: createdIds },
            );
            scheduleSync();
            goNext();
          }}
        >
          Create project
        </button>
        <button className="backlink" onClick={() => setStep("actionable")}>
          ← Back
        </button>
      </>
    );
  }

  if (step === "delegate") {
    return (
      <>
        {head}
        <div className="q">Who's got it?</div>
        <div className="qd">It moves to Waiting For, tracked from today.</div>
        <div className="frow">
          <label>What are you waiting for?</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="frow">
          <label>Who</label>
          <input
            type="text"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="e.g. Sam"
          />
        </div>
        <div className="frow">
          <label>Notes (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button
          className="btn"
          onClick={() =>
            doAndNext(
              () =>
                updateItem(id, {
                  title: title.trim() || it.title,
                  list: "waiting",
                  who: who.trim() || null,
                  note: note.trim(),
                  date: null,
                  created: new Date().toISOString(),
                }),
              "Tracking in Waiting For",
            )
          }
        >
          Move to Waiting For
        </button>
        <button className="backlink" onClick={() => setStep("actionable")}>
          ← Back
        </button>
      </>
    );
  }

  if (step === "schedule") {
    return (
      <>
        {head}
        <div className="q">When must it happen?</div>
        <div className="frow">
          <label>Action</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
        <div className="frow">
          <label>Notes (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button
          className="btn"
          onClick={() =>
            doAndNext(
              () =>
                updateItem(id, {
                  title: title.trim() || it.title,
                  list: "scheduled",
                  date: date || todayStr(),
                  note: note.trim(),
                }),
              "Scheduled",
            )
          }
        >
          Schedule it
        </button>
        <button className="backlink" onClick={() => setStep("actionable")}>
          ← Back
        </button>
      </>
    );
  }

  return null;
}

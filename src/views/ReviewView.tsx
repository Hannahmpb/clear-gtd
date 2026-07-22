import { useRef } from "react";
import { useStore, useInList } from "../store";
import { useUI } from "../uiStore";
import { ItemRow } from "../components/ItemRow";
import { projectActions, projectIsStalled } from "../utils/projects";
import { now } from "../utils/dates";
import { scheduleSync } from "../sync";
import type { Item } from "../types";

interface Step {
  t: string;
  d: string;
  embed?: "inbox" | "next" | "waiting" | "scheduled" | "someday" | "projects";
  reflect?: boolean;
}

const REVIEW_STEPS: Step[] = [
  {
    t: "Get clear: capture loose ends",
    d: "Scan your life: notes, receipts, your head. Anything nagging you? Capture it now with the box at the top of the screen. Empty your head completely.",
  },
  {
    t: "Get your inbox to zero",
    d: "Clarify every inbox item: what is it, is it actionable, what's the next action? Tap each one.",
    embed: "inbox",
  },
  {
    t: "Review Next Actions",
    d: "Tick off anything already done. Do these still feel current and doable? Tap any item to update it.",
    embed: "next",
  },
  {
    t: "Review Waiting For",
    d: "Anything you should chase up? Anything that arrived? Tick off what's resolved.",
    embed: "waiting",
  },
  {
    t: "Review Scheduled",
    d: "Look at overdue and upcoming date-specific items. Reschedule or tick off as needed.",
    embed: "scheduled",
  },
  {
    t: "Review every project",
    d: "Does each project have a next action? Stalled projects are flagged. Tap one to add its next step.",
    embed: "projects",
  },
  {
    t: "Review Someday / Maybe",
    d: "Anything ready to activate? Tap it and move it to Next Actions. Anything to let go of?",
    embed: "someday",
  },
  {
    t: "Reflect",
    d: "How is the week looking? Any wins to notice? And did anything about this system feel clunky? Jot it here. Your note is saved to Reference, and you can share it with Claude to improve the app.",
    reflect: true,
  },
];

function ListCard({ items }: { items: Item[] }) {
  if (!items.length)
    return (
      <div className="vdesc" style={{ marginTop: 8 }}>
        ✓ Nothing here. Clear.
      </div>
    );
  return (
    <div className="card">
      {items.map((i) => (
        <ItemRow key={i.id} item={i} />
      ))}
    </div>
  );
}

function ReviewHome() {
  const lastReview = useStore((s) => s.meta.lastReview);
  const inbox = useInList("inbox");
  const next = useInList("next");
  const projects = useInList("project");
  const done = useInList("done");
  const items = useStore((s) => s.items);
  const setReviewActive = useUI((s) => s.setReviewActive);
  const setRevIdx = useUI((s) => s.setRevIdx);

  const days = lastReview
    ? Math.floor((Date.now() - new Date(lastReview).getTime()) / 86400000)
    : null;
  const stalled = projects.filter((p) => projectIsStalled(items, p.id)).length;
  const doneWeek = done.filter(
    (i) =>
      i.completedAt &&
      Date.now() - new Date(i.completedAt).getTime() < 7 * 86400000,
  ).length;

  const startReview = () => {
    setRevIdx(0);
    setReviewActive(true);
  };

  return (
    <>
      <div className="review-hero">
        <div className="big">🪞</div>
        <h3>Weekly Review</h3>
        <p>
          {days === null
            ? "You haven't done a review yet. This is the habit that makes the whole system trustworthy."
            : days === 0
              ? "Reviewed today. Mind like water."
              : `Last review: ${days} day${days > 1 ? "s" : ""} ago.` +
                (days > 7 ? " Time to get current." : "")}
        </p>
        <button className="btn" onClick={startReview}>
          Start review · ~10 min
        </button>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="n">{inbox.length}</div>
          <div className="l">in inbox</div>
        </div>
        <div className="stat">
          <div className="n">{next.length}</div>
          <div className="l">next actions</div>
        </div>
        <div className="stat">
          <div className="n">{projects.length}</div>
          <div className="l">
            projects
            {stalled > 0 && (
              <>
                {" · "}
                <span style={{ color: "var(--red)" }}>{stalled} stalled</span>
              </>
            )}
          </div>
        </div>
        <div className="stat">
          <div className="n">{doneWeek}</div>
          <div className="l">done this week</div>
        </div>
      </div>
    </>
  );
}

function ReviewStep() {
  const revIdx = useUI((s) => s.revIdx);
  const setRevIdx = useUI((s) => s.setRevIdx);
  const setReviewActive = useUI((s) => s.setReviewActive);
  const showToast = useUI((s) => s.showToast);
  const openSheet = useUI((s) => s.openSheet);
  const items = useStore((s) => s.items);
  const inbox = useInList("inbox");
  const nextItems = useInList("next");
  const waiting = useInList("waiting");
  const scheduled = useInList("scheduled");
  const someday = useInList("someday");
  const projects = useInList("project");
  const addItem = useStore((s) => s.addItem);
  const setLastReview = useStore((s) => s.setLastReview);
  const reflectRef = useRef<HTMLTextAreaElement>(null);

  const s = REVIEW_STEPS[revIdx];
  const isLast = revIdx === REVIEW_STEPS.length - 1;

  const onNext = () => {
    if (isLast) {
      const v = reflectRef.current?.value.trim();
      if (v) {
        addItem(
          "Weekly review note · " +
            new Date().toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            }),
          "reference",
          { note: v },
        );
      }
      setLastReview(now());
      setReviewActive(false);
      scheduleSync();
      showToast("Review complete. Mind like water 🌊");
    } else {
      setRevIdx(revIdx + 1);
      window.scrollTo(0, 0);
    }
  };

  let embed: React.ReactNode = null;
  if (s.embed === "inbox") {
    embed = (
      <div className="rev-embed">
        {inbox.length ? (
          <div className="card">
            {inbox.map((i) => (
              <ItemRow key={i.id} item={i} tapAction="clarify" noTick />
            ))}
          </div>
        ) : (
          <div className="vdesc" style={{ marginTop: 8 }}>
            ✓ Inbox zero. Nice.
          </div>
        )}
      </div>
    );
  } else if (s.embed === "next") {
    embed = (
      <div className="rev-embed">
        <ListCard items={nextItems} />
      </div>
    );
  } else if (s.embed === "waiting") {
    embed = (
      <div className="rev-embed">
        <ListCard items={waiting} />
      </div>
    );
  } else if (s.embed === "scheduled") {
    const sorted = scheduled
      .slice()
      .sort((a, b) => ((a.date || "9999") < (b.date || "9999") ? -1 : 1));
    embed = (
      <div className="rev-embed">
        <ListCard items={sorted} />
      </div>
    );
  } else if (s.embed === "someday") {
    embed = (
      <div className="rev-embed">
        <ListCard items={someday} />
      </div>
    );
  } else if (s.embed === "projects") {
    embed = (
      <div className="rev-embed">
        {projects.length ? (
          <div className="card">
            {projects.map((p) => (
              <div key={p.id} className="item">
                <div
                  className="body"
                  onClick={() => openSheet({ kind: "project", id: p.id })}
                >
                  <div className="title">{p.title}</div>
                  <div className="meta">
                    {projectIsStalled(items, p.id) ? (
                      <span className="chip stalled">
                        ⚠ no next action, tap to fix
                      </span>
                    ) : (
                      <span className="chip">
                        {projectActions(items, p.id).length} actions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="vdesc">No projects.</div>
        )}
      </div>
    );
  } else if (s.reflect) {
    embed = (
      <div className="frow" style={{ marginTop: 14 }}>
        <textarea
          ref={reflectRef}
          style={{
            width: "100%",
            minHeight: 110,
            border: "1px solid var(--line)",
            background: "var(--card)",
            borderRadius: 12,
            padding: "11px 13px",
          }}
          placeholder="Wins, worries, friction with the system…"
        />
      </div>
    );
  }

  return (
    <>
      <div className="rev-progress">
        {REVIEW_STEPS.map((_, i) => (
          <i key={i} className={i <= revIdx ? "on" : ""} />
        ))}
      </div>
      <div className="rev-step-num">
        Step {revIdx + 1} of {REVIEW_STEPS.length}
      </div>
      <div className="vhead">
        <h2>{s.t}</h2>
      </div>
      <div className="vdesc">{s.d}</div>
      {embed}
      <div className="btnrow" style={{ marginTop: 14 }}>
        {revIdx > 0 && (
          <button
            className="btn ghost"
            onClick={() => setRevIdx(Math.max(0, revIdx - 1))}
          >
            ← Back
          </button>
        )}
        <button className="btn" onClick={onNext}>
          {isLast ? "Finish ✓" : "Next →"}
        </button>
      </div>
    </>
  );
}

export function ReviewView() {
  const active = useUI((s) => s.reviewActive);
  return active ? <ReviewStep /> : <ReviewHome />;
}

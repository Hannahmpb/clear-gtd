import { useUI } from "../uiStore";
import { syncNow, getEffectiveSync } from "../sync";
import { SettingsIcon } from "./icons";
import type { View } from "../types";

const TITLES: Record<View, { title: string; sub: string }> = {
  inbox: { title: "Inbox", sub: "Capture everything. Then clarify." },
  next: { title: "Next Actions", sub: "Concrete, visible next steps." },
  projects: {
    title: "Projects",
    sub: "Outcomes needing more than one step.",
  },
  waiting: {
    title: "Waiting For",
    sub: "Delegated. Track who has it, and since when.",
  },
  scheduled: { title: "Scheduled", sub: "Date-specific commitments." },
  someday: { title: "Someday / Maybe", sub: "Ideas to review, not commitments." },
  reference: {
    title: "Reference",
    sub: "Information worth keeping. No action.",
  },
  done: { title: "Logbook", sub: "Everything you've completed." },
  review: { title: "Weekly Review", sub: "" },
  more: { title: "Lists", sub: "" },
  settings: { title: "Settings", sub: "" },
};

export function Header() {
  const view = useUI((s) => s.view);
  const setView = useUI((s) => s.setView);
  const syncState = useUI((s) => s.syncState);
  const lastSyncErr = useUI((s) => s.lastSyncErr);
  const showToast = useUI((s) => s.showToast);
  const { title, sub } = TITLES[view];

  const onDotClick = () => {
    const { url, key } = getEffectiveSync();
    if (!url || !key) {
      showToast("Sync is off. Add Supabase details in Settings");
      return;
    }
    if (lastSyncErr) {
      alert(
        "Sync error:\n\n" +
          lastSyncErr +
          "\n\nCheck the Project URL and anon key in Settings, and that the SQL setup step was run.",
      );
    } else {
      showToast(syncState === "busy" ? "Syncing…" : "Sync is healthy ✓");
      syncNow();
    }
  };

  return (
    <header className="hdr">
      <div>
        <h1>
          {title}
          {view === "inbox" && (
            <span className="hdr-cat" role="img" aria-label="cat">
              🐱
            </span>
          )}
        </h1>
        <div className="sub">{sub}</div>
      </div>
      <div className="hdr-btns">
        <div
          className={"sync-dot" + (syncState ? " " + syncState : "")}
          title="Sync status"
          onClick={onDotClick}
        />
        <button
          className="icon-btn"
          aria-label="Settings"
          onClick={() => setView("settings")}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
}

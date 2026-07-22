import { useStore, useInList } from "../store";
import { useUI } from "../uiStore";
import type { View } from "../types";
import {
  InboxIcon,
  NextIcon,
  ProjectsIcon,
  ReviewIcon,
  MoreIcon,
} from "./icons";

const NAV: Array<[View, string, () => React.ReactNode]> = [
  ["inbox", "Inbox", InboxIcon],
  ["next", "Next", NextIcon],
  ["projects", "Projects", ProjectsIcon],
  ["review", "Review", ReviewIcon],
  ["more", "More", MoreIcon],
];

const MORE_VIEWS: View[] = [
  "scheduled",
  "waiting",
  "someday",
  "reference",
  "done",
  "settings",
  "more",
];

export function BottomNav() {
  const view = useUI((s) => s.view);
  const setView = useUI((s) => s.setView);
  const closeSheet = useUI((s) => s.closeSheet);
  const inboxN = useInList("inbox").length;
  const lastReview = useStore((s) => s.meta.lastReview);
  const reviewDue =
    !lastReview || Date.now() - new Date(lastReview).getTime() > 7 * 86400000;

  return (
    <nav className="nav">
      {NAV.map(([v, label, Icon]) => {
        const on = view === v || (v === "more" && MORE_VIEWS.includes(view));
        return (
          <button
            key={v}
            className={on ? "on" : ""}
            onClick={() => {
              closeSheet();
              setView(v);
            }}
          >
            <Icon />
            {label}
            {v === "inbox" && inboxN > 0 && (
              <span className="badge">{inboxN}</span>
            )}
            {v === "review" && reviewDue && (
              <span
                className="badge"
                style={{
                  minWidth: 8,
                  height: 8,
                  padding: 0,
                  top: 3,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

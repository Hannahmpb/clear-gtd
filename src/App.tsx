import { useEffect } from "react";
import { useUI } from "./uiStore";
import { syncNow, getEffectiveSync } from "./sync";
import { Header } from "./components/Header";
import { CaptureBar } from "./components/CaptureBar";
import { BottomNav } from "./components/BottomNav";
import { Sheet } from "./components/Sheet";
import { Toast } from "./components/Toast";
import { InboxView } from "./views/InboxView";
import { NextView } from "./views/NextView";
import { ProjectsView } from "./views/ProjectsView";
import { ScheduledView } from "./views/ScheduledView";
import { SimpleListView } from "./views/SimpleListView";
import { DoneView } from "./views/DoneView";
import { ReviewView } from "./views/ReviewView";
import { MoreView } from "./views/MoreView";
import { SettingsView } from "./views/SettingsView";

function CurrentView() {
  const view = useUI((s) => s.view);
  switch (view) {
    case "inbox":
      return <InboxView />;
    case "next":
      return <NextView />;
    case "projects":
      return <ProjectsView />;
    case "waiting":
      return <SimpleListView list="waiting" />;
    case "scheduled":
      return <ScheduledView />;
    case "someday":
      return <SimpleListView list="someday" />;
    case "reference":
      return <SimpleListView list="reference" />;
    case "done":
      return <DoneView />;
    case "review":
      return <ReviewView />;
    case "more":
      return <MoreView />;
    case "settings":
      return <SettingsView />;
  }
}

function useKeyboardShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const input = document.querySelector<HTMLInputElement>(
        "#capture-bar input",
      );
      if (input && !input.closest(".hidden")) {
        e.preventDefault();
        input.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}

function useSyncOnFocus() {
  useEffect(() => {
    const { url, key } = getEffectiveSync();
    if (url && key) syncNow();
    const onVis = () => {
      if (!document.hidden) syncNow();
    };
    const onFocus = () => syncNow();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}

export function App() {
  const view = useUI((s) => s.view);
  const reviewActive = useUI((s) => s.reviewActive);
  useKeyboardShortcut();
  useSyncOnFocus();

  const showCapture =
    !["settings", "done"].includes(view) &&
    !(view === "review" && !reviewActive);

  return (
    <>
      <div className="app">
        <Header />
        {showCapture && <CaptureBar />}
        <main>
          <CurrentView />
        </main>
      </div>
      <BottomNav />
      <Sheet />
      <Toast />
    </>
  );
}

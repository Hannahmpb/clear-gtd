import { create } from "zustand";
import type { View } from "./types";
import type { Snapshot } from "./store";

export type SyncState = "" | "ok" | "busy" | "err";

export type SheetKind =
  | { kind: "clarify"; id: string; queue: string[] }
  | { kind: "edit"; id: string }
  | { kind: "project"; id: string }
  | null;

interface UIState {
  view: View;
  reviewActive: boolean;
  revIdx: number;

  sheet: SheetKind;
  sheetDirty: boolean;

  toast: {
    msg: string;
    undoSnap: Snapshot | null;
  } | null;

  syncState: SyncState;
  lastSyncErr: string | null;

  setView: (v: View) => void;
  setReviewActive: (a: boolean) => void;
  setRevIdx: (i: number) => void;

  openSheet: (s: SheetKind) => void;
  closeSheet: () => void;
  setSheetDirty: (d: boolean) => void;

  showToast: (msg: string) => void;
  showUndoToast: (msg: string, snap: Snapshot) => void;
  hideToast: () => void;

  setSyncState: (s: SyncState) => void;
  setLastSyncErr: (e: string | null) => void;
}

export const useUI = create<UIState>((set) => ({
  view: "inbox",
  reviewActive: false,
  revIdx: 0,

  sheet: null,
  sheetDirty: false,

  toast: null,

  syncState: "",
  lastSyncErr: null,

  setView: (view) => {
    set((s) => ({
      view,
      reviewActive: s.reviewActive && view === "review",
    }));
    window.scrollTo(0, 0);
  },
  setReviewActive: (reviewActive) => set({ reviewActive }),
  setRevIdx: (revIdx) => set({ revIdx }),

  openSheet: (sheet) => set({ sheet, sheetDirty: false }),
  closeSheet: () => set({ sheet: null, sheetDirty: false }),
  setSheetDirty: (sheetDirty) => set({ sheetDirty }),

  showToast: (msg) => set({ toast: { msg, undoSnap: null } }),
  showUndoToast: (msg, snap) => set({ toast: { msg, undoSnap: snap } }),
  hideToast: () => set({ toast: null }),

  setSyncState: (syncState) => set({ syncState }),
  setLastSyncErr: (lastSyncErr) => set({ lastSyncErr }),
}));

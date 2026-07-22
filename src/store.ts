import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { Item, Meta, List } from "./types";
import { now, uid } from "./utils/dates";

export interface Snapshot {
  restore: Item[];
  removeIds: string[];
}

interface DataState {
  items: Item[];
  meta: Meta;
  dirty: string[];

  addItem: (title: string, list?: Item["list"], extra?: Partial<Item>) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  completeItem: (id: string) => void;
  trashItem: (id: string) => void;

  saveContexts: (contexts: string[]) => void;
  setCtxFilter: (c: string | null) => void;
  setLastReview: (iso: string | null) => void;
  setSync: (patch: Partial<Meta["sync"]>) => void;
  markAllDirty: () => void;
  clearDirty: () => void;

  applyRemote: (remote: Item[]) => boolean;
  importItems: (imported: Item[], meta?: Partial<Meta>) => void;

  snapshot: (ids: string[]) => Item[];
  restore: (snap: Snapshot) => void;
}

const defaultMeta: Meta = {
  contexts: [
    "@calls",
    "@computer",
    "@errands",
    "@home",
    "@work",
    "@agendas",
    "@read-review",
    "@anywhere",
  ],
  lastReview: null,
  sync: { url: "", key: "", lastPull: null },
  ctxFilter: null,
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export const useStore = create<DataState>()(
  persist(
    (set, get) => ({
      items: [],
      meta: defaultMeta,
      dirty: [],

      addItem: (title, list = "inbox", extra) => {
        const it: Item = {
          id: uid(),
          title: title.trim(),
          note: "",
          list,
          context: null,
          project: null,
          who: null,
          date: null,
          created: now(),
          updated: now(),
          completedAt: null,
          deleted: false,
          ...extra,
        };
        set((s) => ({
          items: [it, ...s.items],
          dirty: s.dirty.includes(it.id) ? s.dirty : [...s.dirty, it.id],
        }));
        return it;
      },

      updateItem: (id, patch) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, ...patch, updated: now() } : i,
          ),
          dirty: s.dirty.includes(id) ? s.dirty : [...s.dirty, id],
        }));
      },

      completeItem: (id) => {
        get().updateItem(id, { list: "done", completedAt: now() });
      },

      trashItem: (id) => {
        get().updateItem(id, { deleted: true });
      },

      saveContexts: (contexts) => {
        set((s) => ({ meta: { ...s.meta, contexts } }));
      },

      setCtxFilter: (ctxFilter) => {
        set((s) => ({ meta: { ...s.meta, ctxFilter } }));
      },

      setLastReview: (lastReview) => {
        set((s) => ({ meta: { ...s.meta, lastReview } }));
      },

      setSync: (patch) => {
        set((s) => ({ meta: { ...s.meta, sync: { ...s.meta.sync, ...patch } } }));
      },

      markAllDirty: () => {
        set((s) => ({ dirty: s.items.map((i) => i.id) }));
      },

      clearDirty: () => set({ dirty: [] }),

      applyRemote: (remote) => {
        const state = get();
        const map = new Map(state.items.map((i) => [i.id, i]));
        const dirtySet = new Set(state.dirty);
        const next = [...state.items];
        let changed = false;
        remote.forEach((r) => {
          const local = map.get(r.id);
          if (!local) {
            next.push(r);
            changed = true;
          } else if (
            (r.updated || "") > (local.updated || "") &&
            !dirtySet.has(r.id)
          ) {
            const idx = next.indexOf(local);
            next[idx] = { ...local, ...r };
            changed = true;
          }
        });
        if (changed) set({ items: next });
        return changed;
      },

      importItems: (imported, metaPatch) => {
        const state = get();
        const map = new Map(state.items.map((i) => [i.id, i]));
        const next = [...state.items];
        const newDirty = new Set(state.dirty);
        imported.forEach((ri) => {
          const li = map.get(ri.id);
          if (!li || (ri.updated || "") > (li.updated || "")) {
            if (li) {
              const idx = next.indexOf(li);
              next[idx] = { ...li, ...ri };
            } else {
              next.push(ri);
            }
            newDirty.add(ri.id);
          }
        });
        set({
          items: next,
          dirty: [...newDirty],
          meta: metaPatch ? { ...state.meta, ...metaPatch } : state.meta,
        });
      },

      snapshot: (ids) => {
        return ids
          .map((id) => get().items.find((i) => i.id === id))
          .filter((i): i is Item => !!i)
          .map((i) => clone(i));
      },

      restore: (snap) => {
        set((s) => {
          const map = new Map(s.items.map((i) => [i.id, i]));
          const dirtySet = new Set(s.dirty);
          const next = [...s.items];
          snap.restore.forEach((r) => {
            const restored = { ...r, updated: now() };
            const li = map.get(r.id);
            if (li) {
              const idx = next.indexOf(li);
              next[idx] = restored;
            } else {
              next.push(restored);
            }
            dirtySet.add(r.id);
          });
          snap.removeIds.forEach((id) => {
            const li = map.get(id);
            if (li) {
              const idx = next.indexOf(li);
              next[idx] = { ...li, deleted: true, updated: now() };
              dirtySet.add(id);
            }
          });
          return { items: next, dirty: [...dirtySet] };
        });
      },
    }),
    {
      name: "gtd",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, meta: s.meta, dirty: s.dirty }),
    },
  ),
);

export const selectById = (id: string) => (s: DataState) =>
  s.items.find((i) => i.id === id);

export const useInList = (list: List) =>
  useStore(
    useShallow((s) => s.items.filter((i) => !i.deleted && i.list === list)),
  );

export const useLive = () =>
  useStore(useShallow((s) => s.items.filter((i) => !i.deleted)));

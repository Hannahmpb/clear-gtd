import { useStore } from "./store";
import { useUI } from "./uiStore";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;

export function getEffectiveSync(): { url: string; key: string } {
  const stored = useStore.getState().meta.sync;
  return {
    url: stored.url || import.meta.env.VITE_SUPABASE_URL || "",
    key: stored.key || import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  };
}

function sbHeaders(key: string): Record<string, string> {
  const h: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };
  if (key.startsWith("eyJ")) h["Authorization"] = "Bearer " + key;
  return h;
}

async function httpErr(r: Response, stage: string): Promise<Error> {
  let detail = "";
  try {
    detail = (await r.text()).slice(0, 180);
  } catch {
    // ignore
  }
  return new Error(
    stage + " failed: HTTP " + r.status + (detail ? " · " + detail : ""),
  );
}

export function scheduleSync() {
  const { url, key } = getEffectiveSync();
  if (!url || !key) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, 1500);
}

export async function syncNow(): Promise<void> {
  const store = useStore.getState();
  const ui = useUI.getState();
  const { url, key } = getEffectiveSync();
  const lastPull = store.meta.sync.lastPull;
  if (!url || !key || syncing) return;
  syncing = true;
  ui.setSyncState("busy");
  const base = url.replace(/\/+$/, "") + "/rest/v1/items";
  try {
    if (store.dirty.length) {
      const payload = store.dirty
        .map((id) => store.items.find((i) => i.id === id))
        .filter((i): i is NonNullable<typeof i> => !!i)
        .map((i) => ({ id: i.id, data: i, updated: i.updated }));
      if (payload.length) {
        const r = await fetch(base + "?on_conflict=id", {
          method: "POST",
          headers: {
            ...sbHeaders(key),
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw await httpErr(r, "push");
      }
      store.clearDirty();
    }
    const since = lastPull || "1970-01-01";
    const r2 = await fetch(
      base +
        "?select=id,data,updated&updated=gt." +
        encodeURIComponent(since) +
        "&order=updated.asc",
      { headers: sbHeaders(key) },
    );
    if (!r2.ok) throw await httpErr(r2, "pull");
    const rows: Array<{ id: string; data: any; updated: string }> = await r2.json();
    let newLastPull = lastPull;
    const remote = rows.map((row) => {
      if (!newLastPull || row.updated > newLastPull) newLastPull = row.updated;
      return row.data;
    });
    if (remote.length) useStore.getState().applyRemote(remote);
    if (newLastPull !== lastPull)
      useStore.getState().setSync({ lastPull: newLastPull });
    ui.setLastSyncErr(null);
    ui.setSyncState("ok");
  } catch (err: unknown) {
    console.warn("sync failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    ui.setLastSyncErr(msg);
    ui.setSyncState("err");
  } finally {
    syncing = false;
  }
}

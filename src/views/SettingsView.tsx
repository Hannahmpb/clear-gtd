import { useRef, useState } from "react";
import { useStore } from "../store";
import { useUI } from "../uiStore";
import { syncNow } from "../sync";
import { todayStr } from "../utils/dates";
import type { Item, Meta } from "../types";

const ENV_URL = import.meta.env.VITE_SUPABASE_URL || "";
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export function SettingsView() {
  const sync = useStore((s) => s.meta.sync);
  const contexts = useStore((s) => s.meta.contexts);
  const items = useStore((s) => s.items);
  const meta = useStore((s) => s.meta);
  const setSync = useStore((s) => s.setSync);
  const saveContexts = useStore((s) => s.saveContexts);
  const markAllDirty = useStore((s) => s.markAllDirty);
  const importItems = useStore((s) => s.importItems);
  const showToast = useUI((s) => s.showToast);
  const setSyncState = useUI((s) => s.setSyncState);

  const [url, setUrl] = useState(sync.url);
  const [key, setKey] = useState(sync.key);
  const [ctxText, setCtxText] = useState(contexts.join("\n"));
  const fileRef = useRef<HTMLInputElement>(null);

  const onSaveSync = () => {
    setSync({ url: url.trim(), key: key.trim(), lastPull: null });
    if (url.trim() && key.trim()) {
      markAllDirty();
      showToast("Syncing…");
      syncNow();
    } else {
      showToast("Sync disabled");
      setSyncState("");
    }
  };

  const onSaveCtx = () => {
    const list = ctxText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    saveContexts(list);
    showToast("Contexts saved");
  };

  const onExport = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            items,
            meta: { contexts: meta.contexts, lastReview: meta.lastReview },
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clear-gtd-backup-" + todayStr() + ".json";
    a.click();
    showToast("Backup downloaded");
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result));
        if (!Array.isArray(d.items)) throw new Error("bad file");
        const metaPatch: Partial<Meta> = {};
        if (d.meta?.contexts) metaPatch.contexts = d.meta.contexts;
        importItems(d.items as Item[], metaPatch);
        showToast("Imported ✓");
      } catch {
        showToast("Couldn't read that file");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  return (
    <>
      <div className="glabel">Sync (Supabase)</div>
      <div className="card" style={{ padding: "16px 16px 6px" }}>
        <div className="set-note">
          {ENV_URL && ENV_KEY
            ? "Default credentials are bundled with this build. Leave these blank to use them, or override them here for this device."
            : "Paste the same Project URL and anon key on each device to sync."}
        </div>
        <div className="frow">
          <label>Project URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={ENV_URL || "https://xxxx.supabase.co"}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
        <div className="frow">
          <label>Anon key</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={ENV_KEY ? ENV_KEY.slice(0, 20) + "…" : "eyJ…"}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
        <button
          className="btn"
          onClick={onSaveSync}
          style={{ marginBottom: 14 }}
        >
          Save & sync now
        </button>
      </div>

      <div className="glabel">Contexts</div>
      <div className="card" style={{ padding: "16px 16px 6px" }}>
        <div className="set-note">
          One per line. Contexts answer "where, or with what, can I do this?"
          The book's classics: @calls (phone calls to make), @computer, @errands
          (things to buy or drop off while out), @home, @work, @agendas (things
          to raise with a specific person when you next talk), @read-review
          (articles, documents). Use whichever match your life. When you only
          have your phone and 10 minutes, filter by @calls and just pick one.
        </div>
        <div className="frow">
          <textarea
            style={{ minHeight: 110 }}
            value={ctxText}
            onChange={(e) => setCtxText(e.target.value)}
          />
        </div>
        <button
          className="btn ghost"
          onClick={onSaveCtx}
          style={{ marginBottom: 14 }}
        >
          Save contexts
        </button>
      </div>

      <div className="glabel">Claude AI</div>
      <div className="card" style={{ padding: 16 }}>
        <div className="set-note" style={{ margin: 0 }}>
          🤖 Coming in the next version: Claude will help clarify inbox items,
          split brain-dumps into actions, and summarise your weekly review.
        </div>
      </div>

      <div className="glabel">Your data</div>
      <div className="card" style={{ padding: "16px 16px 6px" }}>
        <div className="btnrow" style={{ marginBottom: 14 }}>
          <button className="btn ghost" onClick={onExport}>
            Export backup
          </button>
          <button
            className="btn ghost"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={onImportFile}
        />
      </div>

      <div className="set-note" style={{ textAlign: "center", marginTop: 4 }}>
        Clear · a GTD system · your data lives on this device
        {sync.url ? " + your Supabase" : ""}
      </div>
    </>
  );
}

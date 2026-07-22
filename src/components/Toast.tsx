import { useEffect } from "react";
import { useUI } from "../uiStore";
import { useStore } from "../store";
import { scheduleSync } from "../sync";

export function Toast() {
  const toast = useUI((s) => s.toast);
  const hideToast = useUI((s) => s.hideToast);
  const restore = useStore((s) => s.restore);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hideToast, toast.undoSnap ? 6000 : 2400);
    return () => clearTimeout(t);
  }, [toast, hideToast]);

  const onUndo = () => {
    if (toast?.undoSnap) {
      restore(toast.undoSnap);
      scheduleSync();
    }
    hideToast();
  };

  return (
    <div className={"toast" + (toast ? " show" : "")}>
      {toast && (
        <>
          <span>{toast.msg}</span>
          {toast.undoSnap && (
            <button className="undo" onClick={onUndo}>
              Undo
            </button>
          )}
        </>
      )}
    </div>
  );
}

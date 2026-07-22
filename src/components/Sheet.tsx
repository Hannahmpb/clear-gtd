import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useUI } from "../uiStore";
import { ClarifySheet } from "../sheets/ClarifySheet";
import { EditSheet } from "../sheets/EditSheet";
import { ProjectSheet } from "../sheets/ProjectSheet";

export function Sheet() {
  const sheet = useUI((s) => s.sheet);
  const sheetDirty = useUI((s) => s.sheetDirty);
  const closeSheet = useUI((s) => s.closeSheet);
  const setDirty = useUI((s) => s.setSheetDirty);
  const showToast = useUI((s) => s.showToast);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sheet) setDirty(false);
  }, [sheet, setDirty]);

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (sheetDirty) {
      showToast("You have unsaved changes. Save, or close with ✕");
      return;
    }
    closeSheet();
  };

  let body: ReactNode = null;
  if (sheet?.kind === "clarify") {
    body = <ClarifySheet id={sheet.id} queue={sheet.queue} />;
  } else if (sheet?.kind === "edit") {
    body = <EditSheet id={sheet.id} />;
  } else if (sheet?.kind === "project") {
    body = <ProjectSheet id={sheet.id} />;
  }

  return (
    <div
      className={"overlay" + (sheet ? " show" : "")}
      onClick={onOverlayClick}
      onInput={() => setDirty(true)}
    >
      <div className="sheet">
        <div className="grab" />
        <button className="x" aria-label="Close" onClick={closeSheet}>
          ✕
        </button>
        <div ref={bodyRef}>{body}</div>
      </div>
    </div>
  );
}

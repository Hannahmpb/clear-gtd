import { useRef, useState } from "react";
import { useStore } from "./../store";
import { useUI } from "../uiStore";
import { scheduleSync } from "../sync";

export function CaptureBar() {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = useStore((s) => s.addItem);
  const showToast = useUI((s) => s.showToast);

  const submit = () => {
    const v = value.trim();
    if (!v) {
      inputRef.current?.focus();
      return;
    }
    addItem(v, "inbox");
    setValue("");
    showToast("Captured to Inbox");
    scheduleSync();
    inputRef.current?.focus();
  };

  return (
    <div className="capture" id="capture-bar">
      <input
        ref={inputRef}
        type="text"
        placeholder="What's on your mind?"
        autoComplete="off"
        enterKeyHint="done"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button className="go" aria-label="Capture" onClick={submit}>
        +
      </button>
    </div>
  );
}

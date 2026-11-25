"use client";

import { useRef, useState } from "react";
import { readTextFile, useHistory, wipeHistory } from "./tool-state";

export function Editor({
  id,
  label,
  value,
  onChange,
  placeholder,
  onFileError,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFileError?: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  async function take(file: File | undefined) {
    if (!file) return;
    try {
      onChange(await readTextFile(file));
    } catch (error) {
      onFileError?.(error instanceof Error ? error.message : "The file could not be read.");
    }
  }

  return (
    <div
      className={drag ? "editor drag" : "editor"}
      onDragOver={(event) => {
        event.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDrag(false);
        void take(event.dataTransfer.files?.[0]);
      }}
    >
      <div className="editor-bar">
        <label htmlFor={id}>{label}</label>
        <button type="button" className="btn btn-ghost" onClick={() => input.current?.click()}>
          Upload
        </button>
      </div>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onPaste={(event) => {
          const file = event.clipboardData.files?.[0];
          if (file) {
            event.preventDefault();
            void take(file);
          }
        }}
      />
      <input
        ref={input}
        className="sr-only"
        type="file"
        aria-label={`Upload a file into ${label}`}
        onChange={(event) => {
          void take(event.target.files?.[0] ?? undefined);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export function HistoryList({
  tool,
  onRestore,
}: {
  tool: string;
  onRestore: (payload: unknown) => void;
}) {
  const items = useHistory(tool);
  if (!items.length) return null;
  return (
    <details className="history">
      <summary>History on this device ({items.length})</summary>
      <ul>
        {items.slice(0, 8).map((item) => (
          <li key={item.id}>
            <button type="button" className="btn btn-ghost" onClick={() => onRestore(item.payload)}>
              {item.preview || item.label}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn" onClick={() => wipeHistory()}>
        Clear local history
      </button>
    </details>
  );
}

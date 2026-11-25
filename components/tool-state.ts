"use client";

import { useEffect, useRef, useState } from "react";
import { clearHistory, pushHistory, readHistory, readLast, writeLast, type HistoryItem } from "@/lib/history";
import { decodeShare, encodeShare, shareTooLarge } from "@/lib/share/share";

function store() {
  return window.localStorage;
}

export function useToolState<T extends Record<string, unknown>>(toolId: string, initial: T, restore = true) {
  const initialRef = useRef(initial);
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [shareNote, setShareNote] = useState("");

  useEffect(() => {
    const start = initialRef.current;
    try {
      const shared = decodeShare(window.location.hash);
      if (shared && shared.tool === toolId && shared.data && typeof shared.data === "object") {
        setState({ ...start, ...(shared.data as Partial<T>) });
      } else if (restore) {
        const last = readLast(store(), toolId);
        if (last && typeof last === "object") setState({ ...start, ...(last as Partial<T>) });
      }
    } catch {
      setShareNote("Local storage is unavailable, so this page will not remember the input.");
    }
    setHydrated(true);
  }, [restore, toolId]);

  useEffect(() => {
    if (!hydrated) return;
    const handle = window.setTimeout(() => {
      const payload = { v: 1 as const, tool: toolId, data: state };
      try {
        if (shareTooLarge(payload)) {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
          setShareNote("This input is too large for a share link. It stays in the tab only.");
          return;
        }
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${encodeShare(payload)}`);
        writeLast(store(), toolId, state);
        setShareNote("");
      } catch {
        setShareNote("The browser blocked local storage. The tool still works in this tab.");
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [hydrated, state, toolId]);

  return {
    state,
    setState,
    patch: (partial: Partial<T>) => setState((current) => ({ ...current, ...partial })),
    hydrated,
    shareNote,
  };
}

export function remember(tool: string, label: string, preview: string, payload: unknown) {
  try {
    pushHistory(store(), { tool, label, preview, payload });
    window.dispatchEvent(new Event("devkit-history"));
  } catch {
    /* Storage can be full or blocked. The tool result is still on screen. */
  }
}

export function useHistory(tool: string) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        setItems(readHistory(store()).filter((item) => item.tool === tool));
      } catch {
        setItems([]);
      }
    };
    load();
    window.addEventListener("devkit-history", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("devkit-history", load);
      window.removeEventListener("storage", load);
    };
  }, [tool]);
  return items;
}

export function wipeHistory() {
  clearHistory(store());
  window.dispatchEvent(new Event("devkit-history"));
}

export function usePrimaryAction(action: () => void) {
  const ref = useRef(action);
  ref.current = action;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export async function copyText(value: string): Promise<string> {
  try {
    await navigator.clipboard.writeText(value);
    return "Copied.";
  } catch {
    return "Copy was blocked. Select the text and copy it manually.";
  }
}

export function downloadText(filename: string, value: string, type = "text/plain") {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function readTextFile(file: File): Promise<string> {
  if (file.size > 2_000_000) return Promise.reject(new Error("That file is over 2 MB. Split it or use a local editor."));
  return file.text();
}

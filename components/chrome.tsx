"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { pages, type PageDef } from "@/lib/registry";
import { sitePath } from "@/lib/paths";
import { wipeHistory } from "./tool-state";

export function Header() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("devkit.theme");
    } catch {
      stored = null;
    }
    const next = stored === "light" ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    setTheme(next);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    try {
      localStorage.setItem("devkit.theme", next);
    } catch {
      /* Theme still changes for this view. */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f5f7f6" : "#101614");
    setTheme(next);
  }

  return (
    <>
      <header className="site-header">
        <div className="shell header-row">
          <a className="brand" href={sitePath()}>
            <span className="mark" aria-hidden="true">D</span>
            DevKit
          </a>
          <div className="header-actions">
            <button type="button" className="btn" onClick={() => setOpen(true)}>
              Search tools
            </button>
            <button type="button" className="btn btn-ghost" onClick={toggleTheme} aria-pressed={theme === "dark"}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <a className="btn btn-ghost header-support" href={sitePath("support")}>
              Support
            </a>
          </div>
        </div>
      </header>
      {open ? <CommandPalette onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = useMemo(() => rank(pages, query).slice(0, 12), [query]);

  useEffect(() => {
    input.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(page: PageDef) {
    window.location.href = sitePath(page.slug);
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          placeholder="Search tools"
          aria-label="Search tools"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(results.length - 1, value + 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(0, value - 1));
            }
            if (event.key === "Enter" && results[active]) go(results[active]);
          }}
        />
        <ul id={listId} role="listbox" aria-label="Tools">
          {results.map((page, index) => (
            <li key={page.slug} role="presentation">
              <button
                type="button"
                role="option"
                id={`${listId}-${index}`}
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(page)}
              >
                <span>{page.name}</span>
                <span className="hint">{page.category}</span>
              </button>
            </li>
          ))}
          {results.length === 0 ? <li className="hint">No matching tool.</li> : null}
        </ul>
        <div className="editor-bar" style={{ padding: "0.5rem 0.8rem 0.8rem" }}>
          <span className="hint">
            <kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              try {
                wipeHistory();
              } catch {
                /* nothing stored */
              }
              onClose();
            }}
          >
            Clear local history
          </button>
        </div>
      </div>
    </div>
  );
}

function rank(source: PageDef[], query: string): PageDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return source.filter((page) => page.nav);
  return source
    .map((page) => {
      const name = page.name.toLowerCase();
      const hay = `${name} ${page.h1} ${page.category} ${page.keywords.join(" ")}`.toLowerCase();
      let score = 0;
      if (name.includes(q)) score += 3;
      if (hay.includes(q)) score += 2;
      return { page, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.page.name.localeCompare(b.page.name))
    .map((item) => item.page);
}

export function ClearHistoryButton() {
  const [note, setNote] = useState("");
  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={() => {
          try {
            wipeHistory();
            setNote("Local history cleared.");
          } catch {
            setNote("Local history could not be cleared.");
          }
        }}
      >
        Clear local history
      </button>
      {note ? <p className="status" role="status">{note}</p> : null}
    </>
  );
}

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => undefined);
  }, []);
  return null;
}

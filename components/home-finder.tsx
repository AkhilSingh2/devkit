"use client";

import { useMemo, useState } from "react";
import type { PageDef } from "@/lib/registry";
import { sitePath } from "@/lib/paths";

export function HomeFinder({ tools }: { tools: PageDef[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((tool) => `${tool.name} ${tool.h1} ${tool.description} ${tool.keywords.join(" ")}`.toLowerCase().includes(q));
  }, [query, tools]);
  return (
    <div>
      <div className="filter">
        <label className="field" htmlFor="tool-filter">
          Filter tools
          <input id="tool-filter" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="json, cron, chmod" />
        </label>
      </div>
      <div className="tool-grid">
        {shown.map((tool) => (
          <a key={tool.slug} className="card" href={sitePath(tool.slug)}>
            <span className="eyebrow">{tool.category}</span>
            <h2>{tool.name}</h2>
            <p>{tool.description}</p>
          </a>
        ))}
      </div>
      {shown.length === 0 ? <p className="hint">No tool uses that word. Try the search dialog for guides such as Kubernetes or every 5 minutes.</p> : null}
    </div>
  );
}

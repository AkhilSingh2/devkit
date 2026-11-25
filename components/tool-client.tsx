"use client";

import dynamic from "next/dynamic";
import type { ToolId } from "@/lib/registry";

const loading = () => <p className="status" role="status">Loading the tool…</p>;

const DataTools = dynamic(() => import("./tools/data-tools").then((mod) => mod.DataTools), { loading });
const EncodeTools = dynamic(() => import("./tools/encode-tools").then((mod) => mod.EncodeTools), { loading });
const TextTools = dynamic(() => import("./tools/text-tools").then((mod) => mod.TextTools), { loading });
const TimeTools = dynamic(() => import("./tools/time-tools").then((mod) => mod.TimeTools), { loading });
const MiscTools = dynamic(() => import("./tools/misc-tools").then((mod) => mod.MiscTools), { loading });

const suite: Record<ToolId, "data" | "encode" | "text" | "time" | "misc"> = {
  "json-formatter": "data",
  "json-to-typescript": "data",
  "json-to-zod": "data",
  "json-to-go": "data",
  "yaml-to-json": "data",
  "json-to-yaml": "data",
  "json-to-csv": "data",
  "curl-to-code": "data",
  "jwt-decoder": "encode",
  base64: "encode",
  "url-encode": "encode",
  "hash-generator": "encode",
  "regex-tester": "text",
  "diff-checker": "text",
  "sql-formatter": "text",
  minify: "text",
  "markdown-preview": "text",
  cron: "time",
  "unix-timestamp": "time",
  "uuid-generator": "misc",
  "chmod-calculator": "misc",
  "color-converter": "misc",
  "gitignore-generator": "misc",
  "readme-generator": "misc",
};

export function ToolClient({ id, preset }: { id: ToolId; preset?: string }) {
  const kind = suite[id];
  return (
    <div className="tool-workspace">
      {kind === "data" ? <DataTools id={id} preset={preset} /> : null}
      {kind === "encode" ? <EncodeTools id={id} preset={preset} /> : null}
      {kind === "text" ? <TextTools id={id} preset={preset} /> : null}
      {kind === "time" ? <TimeTools id={id} preset={preset} /> : null}
      {kind === "misc" ? <MiscTools id={id} preset={preset} /> : null}
      <p className="hint no-print">
        Drop a file on an editor to load it. <kbd>Ctrl</kbd> or <kbd>⌘</kbd> <kbd>Enter</kbd> runs the main action. <kbd>Ctrl</kbd> or <kbd>⌘</kbd> <kbd>K</kbd> searches.
      </p>
    </div>
  );
}

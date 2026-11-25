"use client";

import { useMemo, useState } from "react";
import { Editor, HistoryList } from "@/components/editor";
import { copyText, remember, usePrimaryAction, useToolState } from "@/components/tool-state";
import { diffLines, diffStats, sideBySide } from "@/lib/diff/diff";
import { renderMarkdown } from "@/lib/markdown/markdown";
import { beautifyCss, beautifyHtml, beautifyJs, minifyCss, minifyHtml, minifyJs } from "@/lib/minify/minify";
import { explainRegex, testRegex } from "@/lib/regex/regex";
import { formatSql } from "@/lib/sql/format";

export function TextTools({ id }: { id: string; preset?: string }) {
  if (id === "regex-tester") return <RegexTool />;
  if (id === "diff-checker") return <DiffTool />;
  if (id === "sql-formatter") return <SqlTool />;
  if (id === "minify") return <MinifyTool />;
  if (id === "markdown-preview") return <MarkdownTool />;
  return null;
}

function RegexTool() {
  const tool = useToolState("regex-tester", { pattern: "(\\w+)@example\\.com", flags: "i", text: "a@example.com and B@example.com" });
  const [status, setStatus] = useState("");
  const explained = useMemo(() => {
    try {
      return explainRegex(tool.state.pattern);
    } catch {
      return [];
    }
  }, [tool.state.pattern]);
  const result = useMemo(() => testRegex(tool.state.pattern, tool.state.flags, tool.state.text), [tool.state.flags, tool.state.pattern, tool.state.text]);
  usePrimaryAction(() => {
    remember("regex-tester", "regex", tool.state.pattern, tool.state);
    setStatus(result.error ? result.error : `${result.matches.length} match${result.matches.length === 1 ? "" : "es"}.`);
  });
  function toggle(flag: string) {
    const flags = tool.state.flags.includes(flag) ? tool.state.flags.replace(flag, "") : `${tool.state.flags}${flag}`;
    tool.patch({ flags });
  }
  return (
    <div className="workbench stack">
      <label className="field" htmlFor="pattern">Pattern
        <input id="pattern" value={tool.state.pattern} onChange={(event) => tool.patch({ pattern: event.target.value })} spellCheck={false} />
      </label>
      <div className="choice-row" aria-label="Flags">
        {["i", "m", "s", "u"].map((flag) => (
          <label key={flag}><input type="checkbox" checked={tool.state.flags.includes(flag)} onChange={() => toggle(flag)} /> {flag}</label>
        ))}
      </div>
      <Editor id="regex-text" label="Test text" value={tool.state.text} onChange={(text) => tool.patch({ text })} />
      {result.error ? <p className="error" role="alert">{result.error}</p> : <p className="status" role="status">{result.matches.length} matches. {status}</p>}
      <ol>
        {result.matches.map((match) => (
          <li key={`${match.index}-${match.value}`}>
            <code>{match.value}</code> at index {match.index}
            {match.groups.length ? ` groups: ${match.groups.map((group) => group ?? "unset").join(", ")}` : ""}
          </li>
        ))}
      </ol>
      <h2>Explanation</h2>
      <ul>
        {explained.map((token, index) => (
          <li key={`${token.source}-${index}`}><code>{token.source}</code> — {token.explanation}</li>
        ))}
      </ul>
      <HistoryList tool="regex-tester" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

function DiffTool() {
  const tool = useToolState("diff-checker", {
    left: "alpha\nbeta\ngamma\n",
    right: "alpha\nBETA\ngamma\ndelta\n",
    mode: "side" as "side" | "inline",
  });
  const ops = useMemo(() => diffLines(tool.state.left, tool.state.right), [tool.state.left, tool.state.right]);
  const stats = diffStats(ops);
  const rows = useMemo(() => sideBySide(ops), [ops]);
  usePrimaryAction(() => remember("diff-checker", "diff", `${stats.added} added`, tool.state));
  return (
    <div className="workbench stack">
      <div className="toolbar">
        <button type="button" className={tool.state.mode === "side" ? "btn btn-primary" : "btn"} onClick={() => tool.patch({ mode: "side" })}>Side by side</button>
        <button type="button" className={tool.state.mode === "inline" ? "btn btn-primary" : "btn"} onClick={() => tool.patch({ mode: "inline" })}>Inline</button>
        <p className="status" role="status">{stats.added} added, {stats.removed} removed</p>
      </div>
      <div className="split">
        <Editor id="diff-left" label="Original" value={tool.state.left} onChange={(left) => tool.patch({ left })} />
        <Editor id="diff-right" label="Changed" value={tool.state.right} onChange={(right) => tool.patch({ right })} />
      </div>
      <div className="diff-wrap" aria-label="Diff result">
        {tool.state.mode === "side"
          ? rows.map((row, index) => (
            <div className="diff-row" key={index}>
              <span className={`diff-line diff-num ${row.left?.type === "delete" ? "delete" : ""}`}>{row.left?.line ?? ""}</span>
              <span className={`diff-line ${row.left?.type === "delete" ? "delete" : ""}`}>{row.left?.text ?? ""}</span>
              <span className={`diff-line diff-num ${row.right?.type === "insert" ? "insert" : ""}`}>{row.right?.line ?? ""}</span>
              <span className={`diff-line ${row.right?.type === "insert" ? "insert" : ""}`}>{row.right?.text ?? ""}</span>
            </div>
          ))
          : ops.map((op, index) => (
            <div className="diff-inline" key={index}>
              <span className={`diff-line diff-num ${op.type}`}>{op.type === "insert" ? "+" : op.type === "delete" ? "-" : ""}</span>
              <span className={`diff-line ${op.type}`}>{op.text}</span>
            </div>
          ))}
      </div>
      <HistoryList tool="diff-checker" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

function SqlTool() {
  const tool = useToolState("sql-formatter", { input: "select a,b from users where id=1 and active=true order by a" });
  const [status, setStatus] = useState("");
  const output = useMemo(() => formatSql(tool.state.input), [tool.state.input]);
  function copy() {
    void copyText(output).then(setStatus);
    remember("sql-formatter", "SQL", tool.state.input.slice(0, 80), tool.state);
  }
  usePrimaryAction(copy);
  return (
    <div className="workbench stack">
      <Editor id="sql-input" label="SQL" value={tool.state.input} onChange={(input) => tool.patch({ input })} />
      <button type="button" className="btn btn-primary" onClick={copy}>Copy formatted SQL</button>
      <pre className="output">{output}</pre>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="sql-formatter" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

function MinifyTool() {
  const tool = useToolState("minify", { language: "html" as "html" | "css" | "js", mode: "beautify" as "minify" | "beautify", input: "<ul><li>One</li></ul>" });
  const [status, setStatus] = useState("");
  const output = useMemo(() => {
    if (tool.state.language === "html") return tool.state.mode === "minify" ? minifyHtml(tool.state.input) : beautifyHtml(tool.state.input);
    if (tool.state.language === "css") return tool.state.mode === "minify" ? minifyCss(tool.state.input) : beautifyCss(tool.state.input);
    return tool.state.mode === "minify" ? minifyJs(tool.state.input) : beautifyJs(tool.state.input);
  }, [tool.state.input, tool.state.language, tool.state.mode]);
  function copy() {
    void copyText(output).then(setStatus);
    remember("minify", tool.state.language, tool.state.input.slice(0, 80), tool.state);
  }
  usePrimaryAction(copy);
  return (
    <div className="workbench stack">
      <div className="choice-row">
        {(["html", "css", "js"] as const).map((language) => (
          <label key={language}><input type="radio" name="lang" checked={tool.state.language === language} onChange={() => tool.patch({ language })} /> {language.toUpperCase()}</label>
        ))}
        <label><input type="radio" name="dir" checked={tool.state.mode === "minify"} onChange={() => tool.patch({ mode: "minify" })} /> Minify</label>
        <label><input type="radio" name="dir" checked={tool.state.mode === "beautify"} onChange={() => tool.patch({ mode: "beautify" })} /> Beautify</label>
      </div>
      <div className="split">
        <Editor id="minify-input" label="Source" value={tool.state.input} onChange={(input) => tool.patch({ input })} />
        <div>
          <div className="editor-bar"><h2>Result</h2><button type="button" className="btn btn-primary" onClick={copy}>Copy</button></div>
          <pre className="output">{output}</pre>
        </div>
      </div>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="minify" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

function MarkdownTool() {
  const tool = useToolState("markdown-preview", { input: "# Notes\n\nA **local** preview.\n\n- First\n- Second\n\n[Example](https://example.com)\n" });
  const html = useMemo(() => renderMarkdown(tool.state.input), [tool.state.input]);
  usePrimaryAction(() => {
    document.body.classList.add("printing");
    window.addEventListener("afterprint", () => document.body.classList.remove("printing"), { once: true });
    window.print();
  });
  return (
    <div className="workbench stack">
      <div className="toolbar no-print">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            document.body.classList.add("printing");
            window.addEventListener(
              "afterprint",
              () => document.body.classList.remove("printing"),
              { once: true },
            );
            window.print();
          }}
        >
          Print / Save as PDF
        </button>
      </div>
      <div className="split">
        <div className="no-print">
          <Editor id="markdown-input" label="Markdown" value={tool.state.input} onChange={(input) => tool.patch({ input })} />
        </div>
        <div className="preview print-root" dangerouslySetInnerHTML={{ __html: html }} aria-label="Markdown preview" />
      </div>
      <HistoryList tool="markdown-preview" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

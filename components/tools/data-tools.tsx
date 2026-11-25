"use client";

import { useMemo, useState } from "react";
import { Editor, HistoryList } from "@/components/editor";
import { copyText, downloadText, remember, usePrimaryAction, useToolState } from "@/components/tool-state";
import { curlToAxios, curlToFetch, curlToGo, curlToPython, parseCurl } from "@/lib/curl/curl";
import { formatJson, jsonErrorLabel } from "@/lib/json/format";
import { jsonToCsv } from "@/lib/json/csv";
import { jsonToGo, jsonToTypeScript, jsonToZod } from "@/lib/json/codegen";
import { queryJsonPath } from "@/lib/json/path";
import { jsonToYaml, yamlToJson } from "@/lib/yaml/convert";
import { yamlSamples, type YamlSampleId } from "@/lib/yaml/samples";

const SAMPLE_JSON = `{
  "service": "example",
  "ok": true,
  "items": [
    { "id": "a1", "price": 8, "label": "Notebook" },
    { "id": "b2", "price": 14, "label": "Pencil" }
  ]
}`;

const SAMPLE_YAML = `name: example
enabled: true
ports:
  - 80
  - 443
`;

export function DataTools({ id, preset }: { id: string; preset?: string }) {
  if (id === "json-formatter") return <JsonFormatter preset={preset} />;
  if (id === "json-to-typescript") return <JsonCode kind="ts" />;
  if (id === "json-to-zod") return <JsonCode kind="zod" />;
  if (id === "json-to-go") return <JsonCode kind="go" />;
  if (id === "json-to-csv") return <CsvTool />;
  if (id === "yaml-to-json" || id === "json-to-yaml") return <YamlTool direction={id} preset={preset} />;
  if (id === "curl-to-code") return <CurlTool />;
  return null;
}

function JsonFormatter({ preset }: { preset?: string }) {
  const tool = useToolState("json-formatter", {
    input: SAMPLE_JSON,
    indent: "2" as "2" | "4" | "tab",
    query: preset === "jsonpath" ? "$.items[?(@.price<10)].label" : "$.items[*].label",
  }, !preset);
  const [status, setStatus] = useState("");
  const parsed = useMemo(() => formatJson(tool.state.input, tool.state.indent === "tab" ? "tab" : tool.state.indent === "4" ? 4 : 2), [tool.state.indent, tool.state.input]);

  function format() {
    if (!parsed.ok) {
      setStatus(jsonErrorLabel(parsed));
      return;
    }
    tool.patch({ input: parsed.formatted });
    setStatus("Formatted.");
    remember("json-formatter", "JSON", parsed.formatted, { ...tool.state, input: parsed.formatted });
  }
  usePrimaryAction(format);

  let pathResult = "";
  let pathError = "";
  if (parsed.ok && tool.state.query.trim()) {
    try {
      pathResult = JSON.stringify(queryJsonPath(parsed.value, tool.state.query), null, 2);
    } catch (error) {
      pathError = error instanceof Error ? error.message : "JSONPath failed.";
    }
  }

  return (
    <div className="workbench stack">
      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={format}>Format</button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (!parsed.ok) return setStatus(jsonErrorLabel(parsed));
            tool.patch({ input: parsed.minified });
            setStatus("Minified.");
          }}
        >
          Minify
        </button>
        <button type="button" className="btn" onClick={() => setStatus(parsed.ok ? "Valid JSON." : jsonErrorLabel(parsed))}>Validate</button>
        <label className="field" style={{ width: "8rem" }}>
          Indent
          <select value={tool.state.indent} onChange={(event) => tool.patch({ indent: event.target.value as "2" | "4" | "tab" })}>
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <button type="button" className="btn" onClick={() => tool.patch({ input: SAMPLE_JSON })}>Sample</button>
      </div>
      <Editor id="json-input" label="JSON input" value={tool.state.input} onChange={(input) => tool.patch({ input })} onFileError={setStatus} />
      {parsed.ok ? <p className="status" role="status">{status || "Valid JSON."}</p> : <p className="error" role="alert">{jsonErrorLabel(parsed)}</p>}
      <label className="field" htmlFor="jsonpath">JSONPath</label>
      <input id="jsonpath" value={tool.state.query} onChange={(event) => tool.patch({ query: event.target.value })} spellCheck={false} />
      {pathError ? <p className="error" role="alert">{pathError}</p> : null}
      {pathResult ? (
        <div>
          <div className="editor-bar">
            <h2>JSONPath matches</h2>
            <button type="button" className="btn" onClick={() => void copyText(pathResult).then(setStatus)}>Copy matches</button>
          </div>
          <pre className="output">{pathResult}</pre>
        </div>
      ) : null}
      {parsed.ok ? (
        <div className="tree-wrap">
          <h2>Tree</h2>
          <Tree value={parsed.value} />
        </div>
      ) : null}
      {tool.shareNote ? <p className="hint">{tool.shareNote}</p> : null}
      <HistoryList tool="json-formatter" onRestore={(payload) => restoreRecord(payload, tool.setState)} />
    </div>
  );
}

function Tree({ value }: { value: unknown }) {
  if (value === null || typeof value !== "object") return <span>{JSON.stringify(value)}</span>;
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
  return (
    <ul className="tree">
      {entries.map(([key, item]) => (
        <li key={key}>
          {item !== null && typeof item === "object" ? (
            <details open={entries.length < 12}>
              <summary><span className="tree-key">{key}</span> {Array.isArray(item) ? `array(${item.length})` : "object"}</summary>
              <Tree value={item} />
            </details>
          ) : (
            <span><span className="tree-key">{key}</span>: {JSON.stringify(item)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function JsonCode({ kind }: { kind: "ts" | "zod" | "go" }) {
  const toolId = kind === "ts" ? "json-to-typescript" : kind === "zod" ? "json-to-zod" : "json-to-go";
  const tool = useToolState(toolId, { input: SAMPLE_JSON, root: "Root" });
  const [status, setStatus] = useState("");
  const output = useMemo(() => {
    try {
      if (kind === "ts") return { ok: true as const, text: jsonToTypeScript(tool.state.input, tool.state.root) };
      if (kind === "zod") return { ok: true as const, text: jsonToZod(tool.state.input, tool.state.root) };
      return { ok: true as const, text: jsonToGo(tool.state.input, tool.state.root) };
    } catch (error) {
      return { ok: false as const, text: error instanceof Error ? error.message : "Could not read JSON." };
    }
  }, [kind, tool.state.input, tool.state.root]);
  const filename = kind === "go" ? "types.go" : kind === "zod" ? "schema.ts" : "types.ts";
  function copy() {
    if (!output.ok) return;
    void copyText(output.text).then(setStatus);
    remember(toolId, kind, tool.state.input, tool.state);
  }
  usePrimaryAction(copy);
  return (
    <div className="workbench stack">
      <label className="field" htmlFor="root-name">Root name
        <input id="root-name" value={tool.state.root} onChange={(event) => tool.patch({ root: event.target.value })} />
      </label>
      <div className="split">
        <Editor id="json-source" label="JSON input" value={tool.state.input} onChange={(input) => tool.patch({ input })} />
        <div>
          <div className="editor-bar">
            <h2>Output</h2>
            <button type="button" className="btn btn-primary" onClick={copy}>Copy</button>
            <button type="button" className="btn" onClick={() => output.ok && downloadText(filename, output.text)}>Download</button>
          </div>
          {output.ok ? <pre className="output">{output.text}</pre> : <p className="error" role="alert">{output.text}</p>}
        </div>
      </div>
      <p className="status" role="status">{status}</p>
      <HistoryList tool={toolId} onRestore={(payload) => restoreRecord(payload, tool.setState)} />
    </div>
  );
}

function CsvTool() {
  const tool = useToolState("json-to-csv", { input: SAMPLE_JSON });
  const [status, setStatus] = useState("");
  const output = useMemo(() => {
    try {
      return { ok: true as const, text: jsonToCsv(tool.state.input) };
    } catch (error) {
      return { ok: false as const, text: error instanceof Error ? error.message : "Could not convert JSON." };
    }
  }, [tool.state.input]);
  function copy() {
    if (!output.ok) return;
    void copyText(output.text).then(setStatus);
    remember("json-to-csv", "CSV", tool.state.input, tool.state);
  }
  usePrimaryAction(copy);
  return (
    <div className="workbench stack">
      <div className="split">
        <Editor id="csv-json" label="JSON input" value={tool.state.input} onChange={(input) => tool.patch({ input })} />
        <div>
          <div className="editor-bar">
            <h2>CSV</h2>
            <button type="button" className="btn btn-primary" onClick={copy}>Copy</button>
            <button type="button" className="btn" onClick={() => output.ok && downloadText("data.csv", output.text, "text/csv")}>Download</button>
          </div>
          {output.ok ? <pre className="output">{output.text}</pre> : <p className="error" role="alert">{output.text}</p>}
        </div>
      </div>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="json-to-csv" onRestore={(payload) => restoreRecord(payload, tool.setState)} />
    </div>
  );
}

function YamlTool({ direction, preset }: { direction: string; preset?: string }) {
  const sample = preset && preset in yamlSamples ? yamlSamples[preset as YamlSampleId] : direction === "json-to-yaml" ? SAMPLE_JSON : SAMPLE_YAML;
  const tool = useToolState(direction, { input: sample }, !preset);
  const [status, setStatus] = useState("");
  const output = useMemo(() => {
    try {
      const text = direction === "yaml-to-json" ? yamlToJson(tool.state.input) : jsonToYaml(tool.state.input);
      return { ok: true as const, text };
    } catch (error) {
      return { ok: false as const, text: error instanceof Error ? error.message : "Could not convert." };
    }
  }, [direction, tool.state.input]);
  function copy() {
    if (!output.ok) return;
    void copyText(output.text).then(setStatus);
    remember(direction, direction, tool.state.input.slice(0, 120), tool.state);
  }
  usePrimaryAction(copy);
  return (
    <div className="workbench stack">
      <div className="split">
        <Editor id="yaml-input" label={direction === "yaml-to-json" ? "YAML input" : "JSON input"} value={tool.state.input} onChange={(input) => tool.patch({ input })} />
        <div>
          <div className="editor-bar">
            <h2>{direction === "yaml-to-json" ? "JSON" : "YAML"}</h2>
            <button type="button" className="btn btn-primary" onClick={copy}>Copy</button>
            <button type="button" className="btn" onClick={() => output.ok && downloadText(direction === "yaml-to-json" ? "converted.json" : "converted.yaml", output.text)}>Download</button>
          </div>
          {output.ok ? <pre className="output">{output.text}</pre> : <p className="error" role="alert">{output.text}</p>}
        </div>
      </div>
      <p className="status" role="status">{status}</p>
      <HistoryList tool={direction} onRestore={(payload) => restoreRecord(payload, tool.setState)} />
    </div>
  );
}

const SAMPLE_CURL = `curl -X POST https://example.com/v1/items \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{"ok":true}'`;

function CurlTool() {
  const tool = useToolState("curl-to-code", { input: SAMPLE_CURL, target: "fetch" as "fetch" | "axios" | "python" | "go" });
  const [status, setStatus] = useState("");
  const output = useMemo(() => {
    try {
      const request = parseCurl(tool.state.input);
      const text = tool.state.target === "axios" ? curlToAxios(request) : tool.state.target === "python" ? curlToPython(request) : tool.state.target === "go" ? curlToGo(request) : curlToFetch(request);
      return { ok: true as const, text };
    } catch (error) {
      return { ok: false as const, text: error instanceof Error ? error.message : "Could not read that curl command." };
    }
  }, [tool.state.input, tool.state.target]);
  function copy() {
    if (!output.ok) return;
    void copyText(output.text).then(setStatus);
    remember("curl-to-code", tool.state.target, tool.state.input.slice(0, 120), tool.state);
  }
  usePrimaryAction(copy);
  return (
    <div className="workbench stack">
      <div className="choice-row" role="radiogroup" aria-label="Output language">
        {(["fetch", "axios", "python", "go"] as const).map((target) => (
          <label key={target}>
            <input type="radio" name="curl-target" checked={tool.state.target === target} onChange={() => tool.patch({ target })} />
            {target}
          </label>
        ))}
      </div>
      <div className="split">
        <Editor id="curl-input" label="curl command" value={tool.state.input} onChange={(input) => tool.patch({ input })} />
        <div>
          <div className="editor-bar">
            <h2>Code</h2>
            <button type="button" className="btn btn-primary" onClick={copy}>Copy</button>
          </div>
          {output.ok ? <pre className="output">{output.text}</pre> : <p className="error" role="alert">{output.text}</p>}
        </div>
      </div>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="curl-to-code" onRestore={(payload) => restoreRecord(payload, tool.setState)} />
    </div>
  );
}

function restoreRecord<T>(payload: unknown, setState: (value: T) => void) {
  if (payload && typeof payload === "object") setState(payload as T);
}

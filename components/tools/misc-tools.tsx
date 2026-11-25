"use client";

import { useMemo, useState } from "react";
import { HistoryList } from "@/components/editor";
import { copyText, downloadText, remember, usePrimaryAction, useToolState } from "@/components/tool-state";
import { describeMode, fromOctal, toOctal, toSymbolic, type PermissionState, type Triad } from "@/lib/chmod/chmod";
import { formatRatio, parseColor, toHex, toHslString, toRgbString, wcag } from "@/lib/color/color";
import { buildGitignore, gitignoreOptions } from "@/lib/generators/gitignore";
import { buildReadme } from "@/lib/generators/readme";
import { renderMarkdown } from "@/lib/markdown/markdown";
import { isUuid, nanoid, ulid, uuid } from "@/lib/ids/ids";

export function MiscTools({ id }: { id: string; preset?: string }) {
  if (id === "uuid-generator") return <IdTool />;
  if (id === "chmod-calculator") return <ChmodTool />;
  if (id === "color-converter") return <ColorTool />;
  if (id === "gitignore-generator") return <IgnoreTool />;
  if (id === "readme-generator") return <ReadmeTool />;
  return null;
}

function IdTool() {
  const [kind, setKind] = useState<"uuid" | "ulid" | "nanoid">("uuid");
  const [count, setCount] = useState(5);
  const [values, setValues] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  function make(next = kind, amount = count) {
    const list = Array.from({ length: amount }, () => (next === "ulid" ? ulid() : next === "nanoid" ? nanoid() : uuid()));
    setValues(list);
    remember("uuid-generator", next, list[0] ?? "", { kind: next, values: list });
    return list;
  }
  usePrimaryAction(() => {
    const list = values.length ? values : make();
    void copyText(list.join("\n")).then(setStatus);
  });
  return (
    <div className="workbench stack">
      <div className="choice-row">
        {(["uuid", "ulid", "nanoid"] as const).map((item) => (
          <label key={item}><input type="radio" name="id-kind" checked={kind === item} onChange={() => { setKind(item); make(item); }} /> {item.toUpperCase()}</label>
        ))}
        <label>Count
          <input type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} />
        </label>
        <button type="button" className="btn btn-primary" onClick={() => make()}>Generate</button>
        <button type="button" className="btn" onClick={() => void copyText(values.join("\n")).then(setStatus)}>Copy</button>
      </div>
      <ul>{values.map((value) => <li key={value}><code>{value}</code>{kind === "uuid" ? ` ${isUuid(value) ? "valid UUID" : ""}` : ""}</li>)}</ul>
      {values.length === 0 ? <p className="hint">Choose Generate. Values are created with Web Crypto and stay in this tab.</p> : null}
      <p className="status" role="status">{status}</p>
      <HistoryList tool="uuid-generator" onRestore={(payload) => {
        if (!payload || typeof payload !== "object" || !("values" in payload)) return;
        const record = payload as { kind?: "uuid" | "ulid" | "nanoid"; values: string[] };
        if (record.kind) setKind(record.kind);
        setValues(record.values);
      }} />
    </div>
  );
}

function ChmodTool() {
  const tool = useToolState("chmod-calculator", { octal: "755" });
  const [status, setStatus] = useState("");
  const state = useMemo(() => {
    try {
      return { ok: true as const, value: fromOctal(tool.state.octal) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Invalid mode." };
    }
  }, [tool.state.octal]);
  function update(next: PermissionState) {
    tool.patch({ octal: toOctal(next) });
  }
  usePrimaryAction(() => {
    void copyText(tool.state.octal).then(setStatus);
    remember("chmod-calculator", "chmod", tool.state.octal, tool.state);
  });
  const groups: Array<["user" | "group" | "other", string]> = [["user", "Owner"], ["group", "Group"], ["other", "Others"]];
  return (
    <div className="workbench stack">
      <label className="field" htmlFor="octal-input">Octal mode
        <input id="octal-input" value={tool.state.octal} onChange={(event) => tool.patch({ octal: event.target.value.trim() })} inputMode="numeric" />
      </label>
      {state.ok ? (
        <>
          <p className="octal" aria-live="polite">{toOctal(state.value)}</p>
          <p className="mono">{toSymbolic(state.value)}</p>
          <div className="check-grid">
            {groups.map(([key, label]) => (
              <fieldset key={key}>
                <legend>{label}</legend>
                {(["read", "write", "execute"] as const).map((name, index) => (
                  <label key={name}>
                    <input
                      type="checkbox"
                      checked={state.value[key][index]}
                      onChange={() => {
                        const triad = [...state.value[key]] as Triad;
                        triad[index] = !triad[index];
                        update({ ...state.value, [key]: triad });
                      }}
                    />
                    {name}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="choice-row">
            {(["setuid", "setgid", "sticky"] as const).map((bit) => (
              <label key={bit}>
                <input type="checkbox" checked={state.value[bit]} onChange={() => update({ ...state.value, [bit]: !state.value[bit] })} />
                {bit}
              </label>
            ))}
          </div>
          <pre className="output">{describeMode(state.value)}</pre>
        </>
      ) : <p className="error" role="alert">{state.error}</p>}
      <div className="toolbar">
        {["644", "755", "600", "700", "775"].map((mode) => (
          <button key={mode} type="button" className="btn" onClick={() => tool.patch({ octal: mode })}>{mode}</button>
        ))}
        <button type="button" className="btn btn-primary" onClick={() => void copyText(tool.state.octal).then(setStatus)}>Copy octal</button>
      </div>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="chmod-calculator" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as { octal: string }) : undefined} />
    </div>
  );
}

function ColorTool() {
  const tool = useToolState("color-converter", { foreground: "#102018", background: "#8ee4b8" });
  const fg = parseColor(tool.state.foreground);
  const bg = parseColor(tool.state.background);
  const ratio = fg && bg ? wcag(fg, bg) : null;
  return (
    <div className="workbench stack">
      <div className="split">
        <ColorField id="fg" label="Foreground" value={tool.state.foreground} onChange={(foreground) => tool.patch({ foreground })} />
        <ColorField id="bg" label="Background" value={tool.state.background} onChange={(background) => tool.patch({ background })} />
      </div>
      {fg && bg && ratio ? (
        <>
          <div className="swatch" style={{ background: toHex(bg), color: toHex(fg) }}>
            The quick brown fox jumps over the lazy dog.
          </div>
          <p>Contrast {formatRatio(ratio.ratio)}</p>
          <ul>
            <li className={ratio.aaNormal ? "pass" : "fail"}>AA normal text {ratio.aaNormal ? "passes" : "fails"} (4.5:1)</li>
            <li className={ratio.aaLarge ? "pass" : "fail"}>AA large text {ratio.aaLarge ? "passes" : "fails"} (3:1)</li>
            <li className={ratio.aaaNormal ? "pass" : "fail"}>AAA normal text {ratio.aaaNormal ? "passes" : "fails"} (7:1)</li>
            <li className={ratio.aaaLarge ? "pass" : "fail"}>AAA large text {ratio.aaaLarge ? "passes" : "fails"} (4.5:1)</li>
          </ul>
          <div className="split">
            <pre className="output">{`Foreground\n${toHex(fg)}\n${toRgbString(fg)}\n${toHslString(fg)}`}</pre>
            <pre className="output">{`Background\n${toHex(bg)}\n${toRgbString(bg)}\n${toHslString(bg)}`}</pre>
          </div>
        </>
      ) : <p className="error" role="alert">Use hex, rgb(), or hsl().</p>}
      <HistoryList tool="color-converter" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const parsed = parseColor(value);
  return (
    <label className="field" htmlFor={id}>{label}
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      <input aria-label={`${label} picker`} type="color" value={parsed ? toHex({ ...parsed, a: 1 }).slice(0, 7) : "#000000"} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function IgnoreTool() {
  const tool = useToolState("gitignore-generator", { ids: ["node", "env"] as string[] });
  const [status, setStatus] = useState("");
  const output = useMemo(() => buildGitignore(tool.state.ids), [tool.state.ids]);
  const groups = [...new Set(gitignoreOptions.map((option) => option.group))];
  usePrimaryAction(() => {
    void copyText(output).then(setStatus);
    remember("gitignore-generator", "gitignore", tool.state.ids.join(","), tool.state);
  });
  return (
    <div className="workbench stack">
      {groups.map((group) => (
        <fieldset key={group}>
          <legend>{group}</legend>
          <div className="choice-row">
            {gitignoreOptions.filter((option) => option.group === group).map((option) => (
              <label key={option.id}>
                <input
                  type="checkbox"
                  checked={tool.state.ids.includes(option.id)}
                  onChange={() => {
                    const ids = tool.state.ids.includes(option.id) ? tool.state.ids.filter((id) => id !== option.id) : [...tool.state.ids, option.id];
                    tool.patch({ ids });
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => void copyText(output).then(setStatus)}>Copy</button>
        <button type="button" className="btn" onClick={() => downloadText(".gitignore", output)}>Download</button>
      </div>
      <pre className="output">{output || "Select at least one section."}</pre>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="gitignore-generator" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as { ids: string[] }) : undefined} />
    </div>
  );
}

function ReadmeTool() {
  const tool = useToolState("readme-generator", {
    name: "example",
    description: "A small tool that does one job well.",
    install: "npm install example",
    usage: "Run `example --help`.",
    license: "MIT",
    contributing: true,
  });
  const [status, setStatus] = useState("");
  const markdown = useMemo(() => buildReadme(tool.state), [tool.state]);
  usePrimaryAction(() => {
    void copyText(markdown).then(setStatus);
    remember("readme-generator", "readme", tool.state.name, tool.state);
  });
  return (
    <div className="workbench stack">
      <div className="split">
        <div className="stack">
          {(["name", "description", "install", "usage"] as const).map((key) => (
            <label key={key} className="field" htmlFor={`readme-${key}`}>{key}
              {key === "description" || key === "usage" ? (
                <textarea id={`readme-${key}`} value={tool.state[key]} onChange={(event) => tool.patch({ [key]: event.target.value })} />
              ) : (
                <input id={`readme-${key}`} value={tool.state[key]} onChange={(event) => tool.patch({ [key]: event.target.value })} />
              )}
            </label>
          ))}
          <label className="field" htmlFor="readme-license">License
            <select id="readme-license" value={tool.state.license} onChange={(event) => tool.patch({ license: event.target.value })}>
              <option>MIT</option>
              <option>Apache-2.0</option>
              <option value="none">No license section</option>
            </select>
          </label>
          <label><input type="checkbox" checked={tool.state.contributing} onChange={(event) => tool.patch({ contributing: event.target.checked })} /> Include a contributing section</label>
        </div>
        <div>
          <div className="editor-bar"><h2>Markdown</h2><button type="button" className="btn btn-primary" onClick={() => void copyText(markdown).then(setStatus)}>Copy</button></div>
          <pre className="output">{markdown}</pre>
          <div className="preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
        </div>
      </div>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="readme-generator" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { HistoryList } from "@/components/editor";
import { copyText, remember, usePrimaryAction, useToolState } from "@/components/tool-state";
import { formatRun, nextRuns, parseCron } from "@/lib/cron/cron";
import { interpretTime } from "@/lib/time/unix";

export function TimeTools({ id, preset }: { id: string; preset?: string }) {
  if (id === "cron") return <CronTool preset={preset} />;
  if (id === "unix-timestamp") return <UnixTool />;
  return null;
}

function CronTool({ preset }: { preset?: string }) {
  const tool = useToolState("cron", { expression: preset || "*/5 * * * *" }, !preset);
  const [now, setNow] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const parsed = useMemo(() => {
    try {
      return {
        ok: true as const,
        value: parseCron(tool.state.expression),
        runs: now === null ? [] : nextRuns(tool.state.expression, new Date(now), 5),
      };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Could not read that expression." };
    }
  }, [now, tool.state.expression]);
  usePrimaryAction(() => {
    void copyText(tool.state.expression).then(setStatus);
    remember("cron", "cron", tool.state.expression, tool.state);
  });
  return (
    <div className="workbench stack">
      <label className="field" htmlFor="cron-expression">Cron expression
        <input id="cron-expression" value={tool.state.expression} onChange={(event) => tool.patch({ expression: event.target.value })} spellCheck={false} />
      </label>
      <div className="toolbar">
        {["* * * * *", "*/5 * * * *", "0 * * * *", "0 0 * * *", "0 9 * * 1-5", "@daily"].map((expression) => (
          <button key={expression} type="button" className="btn" onClick={() => tool.patch({ expression })}>{expression}</button>
        ))}
        <button type="button" className="btn btn-primary" onClick={() => void copyText(tool.state.expression).then(setStatus)}>Copy</button>
      </div>
      {parsed.ok ? (
        <>
          <p>{parsed.value.summary}</p>
          <ul>
            {parsed.value.fields.map((field) => (
              <li key={field.name}><strong>{field.name}</strong>: <code>{field.raw}</code> — {field.detail}</li>
            ))}
          </ul>
          <h2>Next 5 runs</h2>
          <ol>
            {parsed.runs.map((run) => <li key={run.toISOString()}>{formatRun(run)}</li>)}
          </ol>
          <p className="hint">Times use this computer&apos;s local timezone.</p>
        </>
      ) : <p className="error" role="alert">{parsed.error}</p>}
      <p className="status" role="status">{status}</p>
      <HistoryList tool="cron" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as { expression: string }) : undefined} />
    </div>
  );
}

function UnixTool() {
  const tool = useToolState("unix-timestamp", { input: "1700000000" });
  const [status, setStatus] = useState("");
  const reading = useMemo(() => {
    try {
      return { ok: true as const, value: interpretTime(tool.state.input) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Could not read that time." };
    }
  }, [tool.state.input]);
  usePrimaryAction(() => {
    if (!reading.ok) return;
    void copyText(String(reading.value.seconds)).then(setStatus);
    remember("unix-timestamp", "time", tool.state.input, tool.state);
  });
  return (
    <div className="workbench stack">
      <label className="field" htmlFor="time-input">Timestamp or date
        <input id="time-input" value={tool.state.input} onChange={(event) => tool.patch({ input: event.target.value })} />
      </label>
      <div className="toolbar">
        <button type="button" className="btn" onClick={() => tool.patch({ input: String(Math.floor(Date.now() / 1000)) })}>Use current time</button>
        <button type="button" className="btn btn-primary" onClick={() => reading.ok && void copyText(String(reading.value.seconds)).then(setStatus)}>Copy seconds</button>
      </div>
      {reading.ok ? (
        <dl className="stack">
          <div><dt>Seconds</dt><dd className="mono">{reading.value.seconds}</dd></div>
          <div><dt>Milliseconds</dt><dd className="mono">{reading.value.milliseconds}</dd></div>
          <div><dt>ISO 8601</dt><dd className="mono">{reading.value.iso}</dd></div>
          <div><dt>UTC</dt><dd className="mono">{reading.value.utc}</dd></div>
          <div><dt>Local</dt><dd className="mono">{reading.value.local}</dd></div>
        </dl>
      ) : <p className="error" role="alert">{reading.error}</p>}
      <p className="hint">Fewer than 11 digits are seconds. Longer numbers are milliseconds.</p>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="unix-timestamp" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as { input: string }) : undefined} />
    </div>
  );
}

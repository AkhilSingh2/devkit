"use client";

import { useEffect, useMemo, useState } from "react";
import { Editor, HistoryList } from "@/components/editor";
import { HASH_ALGORITHMS, hashBytes, hashText, type HashAlgorithm } from "@/lib/codec/hash";
import { decodeUrlComponent, encodeForm, encodeUrl, encodeUrlComponent } from "@/lib/codec/url";
import { base64ToBytes, bytesToBase64, decodeBase64, decodeBase64Url, encodeBase64, encodeBase64Url } from "@/lib/codec/base64";
import { decodeJwt, jwtExpiry, sampleJwt } from "@/lib/jwt/decode";
import { copyText, downloadText, remember, usePrimaryAction, useToolState } from "@/components/tool-state";

export function EncodeTools({ id, preset }: { id: string; preset?: string }) {
  if (id === "jwt-decoder") return <JwtTool />;
  if (id === "base64") return <Base64Tool preset={preset} />;
  if (id === "url-encode") return <UrlTool />;
  if (id === "hash-generator") return <HashTool preset={preset} />;
  return null;
}

function JwtTool() {
  const tool = useToolState("jwt-decoder", { token: sampleJwt() });
  const [now, setNow] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const decoded = useMemo(() => {
    try {
      return { ok: true as const, value: decodeJwt(tool.state.token) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Could not decode that token." };
    }
  }, [tool.state.token]);
  const expiry = decoded.ok && now !== null ? jwtExpiry(decoded.value.expiresAt, now) : null;
  usePrimaryAction(() => {
    if (!decoded.ok) return;
    void copyText(JSON.stringify({ header: decoded.value.header, payload: decoded.value.payload }, null, 2)).then(setStatus);
    remember("jwt-decoder", "JWT", "decoded token", { token: "" });
  });
  return (
    <div className="workbench stack">
      <div className="banner" role="note">
        Decoding happens in this browser. The token is not sent to a server, and the signature is not verified. Do not treat the claims as authentic until your own verifier checks them.
      </div>
      <Editor id="jwt-input" label="JSON Web Token" value={tool.state.token} onChange={(token) => tool.patch({ token })} />
      <div className="toolbar">
        <button type="button" className="btn" onClick={() => tool.patch({ token: sampleJwt() })}>Load example</button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const header = sampleJwt().split(".")[0];
            const exp = Math.floor(Date.now() / 1000) - 3600;
            const payload = btoa(JSON.stringify({ sub: "usr_demo", exp })).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
            tool.patch({ token: `${header}.${payload}.expired-example` });
          }}
        >
          Load expired example
        </button>
      </div>
      {decoded.ok ? (
        <>
          <p className="status" role="status">
            {expiry ? (expiry.expired ? "Expired." : `Expires in ${expiry.label}.`) : "No exp claim."} {status}
          </p>
          <div className="split">
            <div>
              <h2>Header</h2>
              <pre className="output">{JSON.stringify(decoded.value.header, null, 2)}</pre>
            </div>
            <div>
              <h2>Payload</h2>
              <pre className="output">{JSON.stringify(decoded.value.payload, null, 2)}</pre>
            </div>
          </div>
          <p className="fine">Signature (not verified): <code>{decoded.value.signature || "none"}</code></p>
        </>
      ) : (
        <p className="error" role="alert">{decoded.error}</p>
      )}
      <HistoryList tool="jwt-decoder" onRestore={(payload) => payload && typeof payload === "object" && "token" in payload ? tool.setState(payload as { token: string }) : undefined} />
    </div>
  );
}

function Base64Tool({ preset }: { preset?: string }) {
  const tool = useToolState("base64", {
    mode: preset === "decode" ? "decode" as const : "encode" as const,
    text: preset === "decode" ? "aGVsbG8=" : "hello",
    urlSafe: false,
  }, !preset);
  const [status, setStatus] = useState("");
  const output = useMemo(() => {
    try {
      if (tool.state.mode === "encode") {
        return { ok: true as const, text: tool.state.urlSafe ? encodeBase64Url(tool.state.text) : encodeBase64(tool.state.text) };
      }
      return { ok: true as const, text: tool.state.urlSafe ? decodeBase64Url(tool.state.text) : decodeBase64(tool.state.text) };
    } catch (error) {
      return { ok: false as const, text: error instanceof Error ? error.message : "Could not convert Base64." };
    }
  }, [tool.state.mode, tool.state.text, tool.state.urlSafe]);
  usePrimaryAction(() => {
    if (!output.ok) return;
    void copyText(output.text).then(setStatus);
    remember("base64", tool.state.mode, tool.state.text.slice(0, 80), tool.state);
  });
  return (
    <div className="workbench stack">
      <div className="choice-row">
        <label><input type="radio" name="b64" checked={tool.state.mode === "encode"} onChange={() => tool.patch({ mode: "encode" })} /> Encode</label>
        <label><input type="radio" name="b64" checked={tool.state.mode === "decode"} onChange={() => tool.patch({ mode: "decode" })} /> Decode</label>
        <label><input type="checkbox" checked={tool.state.urlSafe} onChange={(event) => tool.patch({ urlSafe: event.target.checked })} /> URL-safe</label>
        <label className="btn btn-ghost">
          File
          <input
            className="sr-only"
            type="file"
            aria-label="Encode or decode a file"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (file.size > 8_000_000) {
                setStatus("Files over 8 MB are skipped.");
                return;
              }
              if (tool.state.mode === "encode") {
                const encoded = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
                tool.patch({ text: tool.state.urlSafe ? encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "") : encoded });
                setStatus(`Encoded ${file.name}.`);
              } else {
                tool.patch({ text: await file.text() });
                setStatus(`Loaded ${file.name} as Base64 text.`);
              }
            }}
          />
        </label>
      </div>
      <Editor id="base64-input" label={tool.state.mode === "encode" ? "Text to encode" : "Base64 to decode"} value={tool.state.text} onChange={(text) => tool.patch({ text })} />
      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => output.ok && void copyText(output.text).then(setStatus)}>Copy</button>
        {tool.state.mode === "decode" && output.ok ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              const data = base64ToBytes(tool.state.text);
              const blob = new Blob([Uint8Array.from(data)]);
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "decoded.bin";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download bytes
          </button>
        ) : null}
      </div>
      {output.ok ? <pre className="output">{output.text}</pre> : <p className="error" role="alert">{output.text}</p>}
      <p className="status" role="status">{status}</p>
      <HistoryList tool="base64" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

function UrlTool() {
  const tool = useToolState("url-encode", { text: "a b/c?", mode: "component" as "component" | "full" | "form" | "decode" });
  const [status, setStatus] = useState("");
  const output = useMemo(() => {
    try {
      if (tool.state.mode === "component") return encodeUrlComponent(tool.state.text);
      if (tool.state.mode === "full") return encodeUrl(tool.state.text);
      if (tool.state.mode === "form") return encodeForm(tool.state.text);
      return decodeUrlComponent(tool.state.text);
    } catch (error) {
      return error instanceof Error ? error.message : "Could not decode that text.";
    }
  }, [tool.state.mode, tool.state.text]);
  usePrimaryAction(() => {
    void copyText(output).then(setStatus);
    remember("url-encode", tool.state.mode, tool.state.text.slice(0, 80), tool.state);
  });
  return (
    <div className="workbench stack">
      <div className="choice-row" role="radiogroup" aria-label="URL mode">
        {([
          ["component", "Encode component"],
          ["full", "Encode full URL"],
          ["form", "Encode form"],
          ["decode", "Decode"],
        ] as const).map(([mode, label]) => (
          <label key={mode}><input type="radio" name="url-mode" checked={tool.state.mode === mode} onChange={() => tool.patch({ mode })} /> {label}</label>
        ))}
      </div>
      <Editor id="url-input" label="Text" value={tool.state.text} onChange={(text) => tool.patch({ text })} />
      <button type="button" className="btn btn-primary" onClick={() => void copyText(output).then(setStatus)}>Copy</button>
      <pre className="output">{output}</pre>
      <p className="status" role="status">{status}</p>
      <HistoryList tool="url-encode" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

function HashTool({ preset }: { preset?: string }) {
  const initial = (preset === "SHA-256" || preset === "SHA-512" || preset === "SHA-1" || preset === "SHA-384" ? preset : "SHA-256") as HashAlgorithm;
  const tool = useToolState("hash-generator", { algorithm: initial, text: "abc" }, !preset);
  const [digest, setDigest] = useState<{ hex: string; base64: string } | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    let cancelled = false;
    hashText(tool.state.algorithm, tool.state.text)
      .then((result) => {
        if (!cancelled) {
          setDigest(result);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Web Crypto could not hash that input.");
      });
    return () => {
      cancelled = true;
    };
  }, [tool.state.algorithm, tool.state.text]);
  usePrimaryAction(() => {
    if (!digest) return;
    void copyText(digest.hex).then(setStatus);
    remember("hash-generator", tool.state.algorithm, tool.state.text.slice(0, 80), tool.state);
  });
  return (
    <div className="workbench stack">
      <div className="banner">SHA digests are checksums. Do not use them to store passwords.</div>
      <label className="field" htmlFor="hash-alg">Algorithm
        <select id="hash-alg" value={tool.state.algorithm} onChange={(event) => tool.patch({ algorithm: event.target.value as HashAlgorithm })}>
          {HASH_ALGORITHMS.map((algorithm) => <option key={algorithm}>{algorithm}</option>)}
        </select>
      </label>
      <Editor id="hash-input" label="Text to hash" value={tool.state.text} onChange={(text) => tool.patch({ text })} />
      <label className="btn">
        Hash a file
        <input
          className="sr-only"
          type="file"
          aria-label="Hash a file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (file.size > 32_000_000) {
              setError("Files over 32 MB are skipped.");
              return;
            }
            const result = await hashBytes(tool.state.algorithm, await file.arrayBuffer());
            setDigest(result);
            setStatus(`Hashed ${file.name}.`);
          }}
        />
      </label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      {digest ? (
        <div className="stack">
          <div className="editor-bar"><h2>Hex</h2><button type="button" className="btn btn-primary" onClick={() => void copyText(digest.hex).then(setStatus)}>Copy hex</button></div>
          <pre className="output">{digest.hex}</pre>
          <div className="editor-bar"><h2>Base64</h2><button type="button" className="btn" onClick={() => void copyText(digest.base64).then(setStatus)}>Copy base64</button></div>
          <pre className="output">{digest.base64}</pre>
        </div>
      ) : null}
      <p className="status" role="status">{status}</p>
      <HistoryList tool="hash-generator" onRestore={(payload) => payload && typeof payload === "object" ? tool.setState(payload as typeof tool.state) : undefined} />
    </div>
  );
}

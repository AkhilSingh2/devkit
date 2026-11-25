export type CurlRequest = {
  method: string;
  url: string;
  headers: Array<{ name: string; value: string }>;
  body?: string;
};

export function parseCurl(input: string): CurlRequest {
  const tokens = tokenizeShell(input.trim());
  if (tokens.length === 0 || tokens[0] !== "curl") {
    throw new Error("Paste a command that starts with curl.");
  }
  let method = "";
  let url = "";
  const headers: Array<{ name: string; value: string }> = [];
  const data: string[] = [];
  let basic: string | undefined;
  let query = false;
  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = () => {
      i += 1;
      if (i >= tokens.length) throw new Error(`Missing a value after ${token}`);
      return tokens[i];
    };
    if (token === "-X" || token === "--request") method = next().toUpperCase();
    else if (token === "-H" || token === "--header") {
      const raw = next();
      const split = raw.indexOf(":");
      if (split < 0) throw new Error(`Header "${raw}" needs a colon.`);
      headers.push({ name: raw.slice(0, split).trim(), value: raw.slice(split + 1).trim() });
    } else if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary" || token === "--data-urlencode") {
      data.push(next());
    } else if (token === "-u" || token === "--user") basic = next();
    else if (token === "-A" || token === "--user-agent") headers.push({ name: "User-Agent", value: next() });
    else if (token === "--url") url = next();
    else if (token === "-G" || token === "--get") query = true;
    else if (token === "-I" || token === "--head") method = method || "HEAD";
    else if (token === "-L" || token === "--location" || token === "-k" || token === "--insecure" || token === "-s" || token === "--silent" || token === "-v" || token === "--verbose" || token === "-i" || token === "--include") {
      continue;
    } else if (token.startsWith("-")) {
      throw new Error(`Unsupported curl flag ${token}. Supported flags include -X, -H, -d, -u, -A, -G, and --url.`);
    } else if (!url) url = token;
    else throw new Error(`Unexpected extra argument "${token}".`);
  }
  if (!url) throw new Error("The curl command has no URL.");
  if (basic && !headers.some((header) => header.name.toLowerCase() === "authorization")) {
    headers.push({ name: "Authorization", value: `Basic ${encodeBasic(basic)}` });
  }
  let body = data.length ? data.join("&") : undefined;
  if (query && body) {
    url += `${url.includes("?") ? "&" : "?"}${body}`;
    body = undefined;
  }
  if (!method) method = body ? "POST" : "GET";
  return { method, url, headers, body };
}

export function curlToFetch(request: CurlRequest): string {
  const init: string[] = [`  method: ${JSON.stringify(request.method)},`];
  if (request.headers.length) init.push(`  headers: ${JSON.stringify(Object.fromEntries(request.headers.map((header) => [header.name, header.value])), null, 2).replace(/\n/g, "\n  ")},`);
  if (request.body !== undefined) init.push(`  body: ${JSON.stringify(request.body)},`);
  return `const response = await fetch(${JSON.stringify(request.url)}, {\n${init.join("\n")}\n});\nconst data = await response.json();\n`;
}

export function curlToAxios(request: CurlRequest): string {
  const config: string[] = [`  method: ${JSON.stringify(request.method.toLowerCase())},`, `  url: ${JSON.stringify(request.url)},`];
  if (request.headers.length) config.push(`  headers: ${JSON.stringify(Object.fromEntries(request.headers.map((header) => [header.name, header.value])), null, 2).replace(/\n/g, "\n  ")},`);
  if (request.body !== undefined) config.push(`  data: ${maybeJson(request.body)},`);
  return `import axios from "axios";\n\nconst { data } = await axios({\n${config.join("\n")}\n});\n`;
}

export function curlToPython(request: CurlRequest): string {
  const method = request.method.toLowerCase();
  const lines = ["import requests", "", `response = requests.${method in { get: 1, post: 1, put: 1, patch: 1, delete: 1, head: 1 } ? method : "request"}(`];
  if (!(method in { get: 1, post: 1, put: 1, patch: 1, delete: 1, head: 1 })) lines.push(`    ${JSON.stringify(request.method)},`);
  lines.push(`    ${JSON.stringify(request.url)},`);
  if (request.headers.length) {
    lines.push("    headers={");
    for (const header of request.headers) lines.push(`        ${JSON.stringify(header.name)}: ${JSON.stringify(header.value)},`);
    lines.push("    },");
  }
  if (request.body !== undefined) {
    const json = tryJson(request.body);
    if (json !== undefined && contentType(request)?.includes("json")) lines.push(`    json=${pyLiteral(json)},`);
    else lines.push(`    data=${JSON.stringify(request.body)},`);
  }
  lines.push(")", "print(response.status_code)");
  return `${lines.join("\n")}\n`;
}

export function curlToGo(request: CurlRequest): string {
  const body = request.body === undefined ? "nil" : `strings.NewReader(${JSON.stringify(request.body)})`;
  const headerLines = request.headers.map((header) => `\treq.Header.Set(${JSON.stringify(header.name)}, ${JSON.stringify(header.value)})`).join("\n");
  return `package main

import (
	"fmt"
	"io"
	"net/http"
	${request.body === undefined ? "" : '\t"strings"\n'}
)

func main() {
	req, err := http.NewRequest(${JSON.stringify(request.method)}, ${JSON.stringify(request.url)}, ${body})
	if err != nil {
		panic(err)
	}
${headerLines ? `${headerLines}\n` : ""}	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Printf("%s\\n%s\\n", res.Status, body)
}
`;
}

function contentType(request: CurlRequest): string | undefined {
  return request.headers.find((header) => header.name.toLowerCase() === "content-type")?.value.toLowerCase();
}

function tryJson(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

function maybeJson(body: string): string {
  const parsed = tryJson(body);
  if (parsed === undefined) return JSON.stringify(body);
  return JSON.stringify(parsed, null, 2).replace(/\n/g, "\n  ");
}

function pyLiteral(value: unknown): string {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => pyLiteral(item)).join(", ")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${JSON.stringify(key)}: ${pyLiteral(item)}`)
      .join(", ")}}`;
  }
  return "None";
}

function encodeBasic(raw: string): string {
  const bytes = new TextEncoder().encode(raw);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function tokenizeShell(input: string): string[] {
  const source = input.replace(/\\\r?\n/g, " ");
  const tokens: string[] = [];
  let i = 0;
  while (i < source.length) {
    while (i < source.length && /\s/.test(source[i])) i += 1;
    if (i >= source.length) break;
    const quote = source[i];
    if (quote === "'" || quote === '"') {
      i += 1;
      let value = "";
      while (i < source.length && source[i] !== quote) {
        if (quote === '"' && source[i] === "\\" && i + 1 < source.length) {
          value += source[i + 1];
          i += 2;
          continue;
        }
        value += source[i];
        i += 1;
      }
      if (source[i] !== quote) throw new Error("A quoted string is missing its closing quote.");
      i += 1;
      tokens.push(value);
      continue;
    }
    let value = "";
    while (i < source.length && !/\s/.test(source[i])) {
      if (source[i] === "\\" && i + 1 < source.length) {
        value += source[i + 1];
        i += 2;
        continue;
      }
      value += source[i];
      i += 1;
    }
    tokens.push(value);
  }
  return tokens;
}

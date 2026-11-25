export function minifyHtml(input: string): string {
  const withoutComments = input.replace(/<!--[\s\S]*?-->/g, "");
  let out = "";
  let i = 0;
  while (i < withoutComments.length) {
    const raw = rawBlock(withoutComments, i);
    if (raw) {
      out += raw.text;
      i = raw.next;
      continue;
    }
    if (withoutComments[i] === "<") {
      const end = withoutComments.indexOf(">", i);
      const tag = end === -1 ? withoutComments.slice(i) : withoutComments.slice(i, end + 1);
      out += tag.replace(/\s+/g, " ").replace(/\s*>/g, ">").replace(/\s+\/>/g, "/>");
      i += tag.length;
      continue;
    }
    const next = withoutComments.indexOf("<", i);
    const text = withoutComments.slice(i, next === -1 ? undefined : next);
    out += text.replace(/\s+/g, " ");
    i = next === -1 ? withoutComments.length : next;
  }
  return out.replace(/>\s+</g, "><").trim();
}

export function beautifyHtml(input: string): string {
  const tokens = htmlTokens(input).filter((token) => token.kind !== "text" || token.value.trim());
  let indent = 0;
  const lines: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const next = tokens[index + 1];
    const after = tokens[index + 2];
    if (token.kind === "open" && next?.kind === "text" && after?.kind === "close" && !next.value.includes("\n")) {
      lines.push(`${"  ".repeat(indent)}${token.value.trim()}${next.value.trim()}${after.value.trim()}`);
      index += 2;
      continue;
    }
    if (token.kind === "close") indent = Math.max(0, indent - 1);
    if (token.kind === "text") {
      const text = token.value.trim();
      if (text) lines.push(`${"  ".repeat(indent)}${text}`);
    } else lines.push(`${"  ".repeat(indent)}${token.value.trim()}`);
    if (token.kind === "open") indent += 1;
  }
  return `${lines.join("\n")}\n`;
}

export function minifyCss(input: string): string {
  return stripCssComments(input).replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1").replace(/;}/g, "}").trim();
}

export function beautifyCss(input: string): string {
  const source = stripCssComments(input).trim();
  let out = "";
  let indent = 0;
  let quote: string | null = null;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      out += char;
      if (char === "\\" && i + 1 < source.length) {
        out += source[i + 1];
        i += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      out += char;
      continue;
    }
    if (char === "{") {
      out = `${out.trimEnd()} {\n${"  ".repeat(++indent)}`;
      continue;
    }
    if (char === "}") {
      indent = Math.max(0, indent - 1);
      out = `${out.trimEnd()}\n${"  ".repeat(indent)}}\n${"  ".repeat(indent)}`;
      continue;
    }
    if (char === ";") {
      out = `${out.trimEnd()};\n${"  ".repeat(indent)}`;
      continue;
    }
    if (char === ":") {
      out = `${out.trimEnd()}: `;
      continue;
    }
    if (/\s/.test(char)) {
      if (out && !/\s$/.test(out)) out += " ";
      continue;
    }
    out += char;
  }
  return `${out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

export function minifyJs(input: string): string {
  const tokens = jsTokens(input, true);
  let out = "";
  for (const token of tokens) {
    if (token.kind === "space") continue;
    if (/[A-Za-z0-9_$]/.test(out.slice(-1)) && /^[A-Za-z0-9_$]/.test(token.value)) out += " ";
    if (out.endsWith(")") && token.value === "(") {
      /* call */
    }
    out += token.value;
  }
  return out.trim();
}

export function beautifyJs(input: string): string {
  const tokens = jsTokens(input, false);
  let out = "";
  let indent = 0;
  for (const token of tokens) {
    if (token.kind === "space") continue;
    if (token.value === "}") {
      indent = Math.max(0, indent - 1);
      out = out.trimEnd();
      out += `\n${"  ".repeat(indent)}}`;
      continue;
    }
    if (token.value === "{") {
      out = `${out.trimEnd()} {\n${"  ".repeat(++indent)}`;
      continue;
    }
    if (token.value === ";") {
      out += `;\n${"  ".repeat(indent)}`;
      continue;
    }
    if (token.kind === "comment") {
      out += `${out.endsWith("\n") || out === "" ? "" : "\n"}${"  ".repeat(indent)}${token.value}\n${"  ".repeat(indent)}`;
      continue;
    }
    if (needsSpace(out, token.value)) out += " ";
    out += token.value;
  }
  return `${out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function needsSpace(out: string, next: string): boolean {
  if (!out || /[\s([{]$/.test(out)) return false;
  if (/^[)\]},.;:]/.test(next) || next === "(") return false;
  const prev = out.slice(-1);
  if (/[A-Za-z0-9_$]/.test(prev) && /^[A-Za-z0-9_$]/.test(next)) return true;
  if ("=<>!+-*/%&|?".includes(prev) || "=<>!+-*/%&|?".includes(next[0] ?? "")) return true;
  return false;
}

type HtmlToken = { kind: "open" | "close" | "void" | "text" | "raw"; value: string };

const VOID_TAGS = new Set("area base br col embed hr img input link meta source track wbr".split(" "));

function htmlTokens(input: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] === "<") {
      const end = input.indexOf(">", i);
      const value = end === -1 ? input.slice(i) : input.slice(i, end + 1);
      const name = /^<\/?\s*([A-Za-z0-9]+)/.exec(value)?.[1]?.toLowerCase() ?? "";
      const kind = value.startsWith("</") ? "close" : VOID_TAGS.has(name) || value.endsWith("/>") ? "void" : "open";
      tokens.push({ kind, value });
      i += value.length;
      if (kind === "open" && (name === "script" || name === "style" || name === "pre" || name === "textarea")) {
        const close = new RegExp(`</${name}\\s*>`, "i");
        const rest = input.slice(i);
        const found = close.exec(rest);
        if (found) {
          tokens.push({ kind: "raw", value: rest.slice(0, found.index) });
          tokens.push({ kind: "close", value: found[0] });
          i += found.index + found[0].length;
        }
      }
      continue;
    }
    const next = input.indexOf("<", i);
    tokens.push({ kind: "text", value: input.slice(i, next === -1 ? undefined : next) });
    i = next === -1 ? input.length : next;
  }
  return tokens;
}

function rawBlock(input: string, index: number): { text: string; next: number } | null {
  const open = /^<(script|style|pre|textarea)\b[^>]*>/i.exec(input.slice(index));
  if (!open) return null;
  const name = open[1];
  const closeAt = input.toLowerCase().indexOf(`</${name.toLowerCase()}`, index + open[0].length);
  if (closeAt < 0) return { text: input.slice(index), next: input.length };
  const closeEnd = input.indexOf(">", closeAt);
  const next = closeEnd < 0 ? input.length : closeEnd + 1;
  return { text: input.slice(index, next), next };
}

function stripCssComments(input: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quote) {
      out += char;
      if (char === "\\" && i + 1 < input.length) {
        out += input[++i];
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      out += char;
      continue;
    }
    if (char === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      i = end < 0 ? input.length : end + 1;
      continue;
    }
    out += char;
  }
  return out;
}

type JsToken = { kind: "code" | "string" | "comment" | "space"; value: string };

function jsTokens(input: string, dropComments: boolean): JsToken[] {
  const tokens: JsToken[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) {
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) j += 1;
      tokens.push({ kind: "space", value: input.slice(i, j) });
      i = j;
      continue;
    }
    if (char === "/" && input[i + 1] === "/") {
      const end = input.indexOf("\n", i);
      const value = end < 0 ? input.slice(i) : input.slice(i, end);
      if (!dropComments) tokens.push({ kind: "comment", value });
      i = end < 0 ? input.length : end;
      continue;
    }
    if (char === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      const value = end < 0 ? input.slice(i) : input.slice(i, end + 2);
      if (!dropComments) tokens.push({ kind: "comment", value });
      i += value.length;
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      let j = i + 1;
      while (j < input.length && /[A-Za-z0-9_$]/.test(input[j])) j += 1;
      tokens.push({ kind: "code", value: input.slice(i, j) });
      i = j;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let j = i + 1;
      while (j < input.length && /[0-9.]/.test(input[j])) j += 1;
      tokens.push({ kind: "code", value: input.slice(i, j) });
      i = j;
      continue;
    }
    const pair = input.slice(i, i + 3);
    const op = ["===", "!==", "==", "!=", "<=", ">=", "&&", "||", "=>", "++", "--", "**", "+=", "-=", "*=", "/="].find((item) => pair.startsWith(item));
    if (op) {
      tokens.push({ kind: "code", value: op });
      i += op.length;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      let j = i + 1;
      let value = char;
      while (j < input.length) {
        value += input[j];
        if (input[j] === "\\") {
          if (j + 1 < input.length) value += input[++j];
          j += 1;
          continue;
        }
        if (input[j] === char) {
          j += 1;
          break;
        }
        j += 1;
      }
      tokens.push({ kind: "string", value });
      i = j;
      continue;
    }
    tokens.push({ kind: "code", value: char });
    i += 1;
  }
  return tokens;
}

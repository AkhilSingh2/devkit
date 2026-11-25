type Cmp = "==" | "!=" | "<" | "<=" | ">" | ">=";

type Segment =
  | { kind: "prop"; name: string }
  | { kind: "wild" }
  | { kind: "descend"; name: string }
  | { kind: "index"; index: number }
  | { kind: "slice"; start: number | null; end: number | null }
  | { kind: "filter"; path: string[]; op: Cmp; value: string | number | boolean | null };

export function queryJsonPath(data: unknown, expression: string): unknown[] {
  const segments = parseJsonPath(expression.trim());
  let current: unknown[] = [data];
  for (const segment of segments) current = applySegment(current, segment);
  return current;
}

export function parseJsonPath(expression: string): Segment[] {
  if (!expression.startsWith("$")) {
    throw new Error("JSONPath must start with $");
  }
  const segments: Segment[] = [];
  let i = 1;
  while (i < expression.length) {
    if (expression.startsWith("..", i)) {
      i += 2;
      const ident = readIdent(expression, i);
      if (!ident) throw new Error("Expected a name after ..");
      segments.push({ kind: "descend", name: ident.value });
      i = ident.next;
      continue;
    }
    if (expression[i] === ".") {
      i += 1;
      if (expression[i] === "*") {
        segments.push({ kind: "wild" });
        i += 1;
        continue;
      }
      const ident = readIdent(expression, i);
      if (!ident) throw new Error("Expected a property name");
      segments.push({ kind: "prop", name: ident.value });
      i = ident.next;
      continue;
    }
    if (expression[i] === "[") {
      const end = expression.indexOf("]", i);
      if (end < 0) throw new Error("Unclosed [");
      segments.push(parseBracket(expression.slice(i + 1, end)));
      i = end + 1;
      continue;
    }
    throw new Error(`Unexpected "${expression[i]}" in JSONPath`);
  }
  return segments;
}

function readIdent(input: string, start: number): { value: string; next: number } | null {
  const match = /^[A-Za-z_][A-Za-z0-9_$-]*/.exec(input.slice(start));
  if (!match) return null;
  return { value: match[0], next: start + match[0].length };
}

function parseBracket(body: string): Segment {
  const raw = body.trim();
  if (raw === "*") return { kind: "wild" };
  if (/^-?\d+$/.test(raw)) return { kind: "index", index: Number(raw) };
  const slice = /^(-?\d+)?:(-?\d+)?$/.exec(raw);
  if (slice) {
    return {
      kind: "slice",
      start: slice[1] === undefined ? null : Number(slice[1]),
      end: slice[2] === undefined ? null : Number(slice[2]),
    };
  }
  const quoted = /^['"](.+)['"]$/.exec(raw);
  if (quoted) return { kind: "prop", name: quoted[1] };
  if (raw.startsWith("?(") && raw.endsWith(")")) {
    return parseFilter(raw.slice(2, -1).trim());
  }
  throw new Error(`Unsupported selector [${body}]`);
}

function parseFilter(source: string): Segment {
  const match = /^@((?:\.[A-Za-z_][A-Za-z0-9_]*)+)\s*(==|!=|<=|>=|<|>)\s*(.+)$/.exec(source);
  if (!match) throw new Error(`Unsupported filter ${source}`);
  return {
    kind: "filter",
    path: match[1].slice(1).split("."),
    op: match[2] as Cmp,
    value: parseLiteral(match[3].trim()),
  };
}

function parseLiteral(raw: string): string | number | boolean | null {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const quoted = /^['"]([\s\S]*)['"]$/.exec(raw);
  if (quoted) return quoted[1];
  throw new Error(`Unsupported filter value ${raw}`);
}

function applySegment(values: unknown[], segment: Segment): unknown[] {
  if (segment.kind === "descend") {
    const found: unknown[] = [];
    for (const value of values) collectKey(value, segment.name, found);
    return found;
  }
  const next: unknown[] = [];
  for (const value of values) {
    if (segment.kind === "prop") {
      if (isRecord(value) && Object.prototype.hasOwnProperty.call(value, segment.name)) {
        next.push(value[segment.name]);
      }
    } else if (segment.kind === "wild") {
      if (Array.isArray(value)) next.push(...value);
      else if (isRecord(value)) next.push(...Object.values(value));
    } else if (segment.kind === "index" && Array.isArray(value)) {
      const index = segment.index < 0 ? value.length + segment.index : segment.index;
      if (index >= 0 && index < value.length) next.push(value[index]);
    } else if (segment.kind === "slice" && Array.isArray(value)) {
      next.push(...value.slice(segment.start ?? 0, segment.end ?? undefined));
    } else if (segment.kind === "filter" && Array.isArray(value)) {
      for (const item of value) {
        if (matchesFilter(item, segment)) next.push(item);
      }
    }
  }
  return next;
}

function collectKey(node: unknown, name: string, found: unknown[]) {
  if (Array.isArray(node)) {
    for (const item of node) collectKey(item, name, found);
    return;
  }
  if (!isRecord(node)) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === name) found.push(value);
    collectKey(value, name, found);
  }
}

function matchesFilter(item: unknown, segment: Extract<Segment, { kind: "filter" }>): boolean {
  let current: unknown = item;
  for (const key of segment.path) {
    if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, key)) return false;
    current = current[key];
  }
  const expected = segment.value;
  switch (segment.op) {
    case "==":
      return current === expected;
    case "!=":
      return current !== expected;
    case "<":
    case "<=":
    case ">":
    case ">=":
      if (typeof current !== "number" || typeof expected !== "number") return false;
      if (segment.op === "<") return current < expected;
      if (segment.op === "<=") return current <= expected;
      if (segment.op === ">") return current > expected;
      return current >= expected;
    default:
      return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

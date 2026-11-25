const KEYWORDS = new Set(
  "select from where group by order having limit offset union all insert into values update set delete create table with join left right inner outer full cross on and or as distinct case when then else end asc desc null is not in like between primary key references default true false".split(
    " ",
  ),
);

const BREAK_BEFORE = new Set(["SELECT", "FROM", "WHERE", "GROUP", "ORDER", "HAVING", "LIMIT", "OFFSET", "UNION", "INSERT", "UPDATE", "DELETE", "VALUES", "SET", "WITH", "JOIN"]);
const JOIN_MODIFIER = new Set(["LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS"]);

type Token = { kind: "word" | "string" | "comment" | "symbol"; value: string };

export function formatSql(sql: string): string {
  const tokens = tokenize(sql).filter((token) => token.kind !== "comment");
  let out = "";
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const upper = token.kind === "word" ? token.value.toUpperCase() : "";
    if (token.kind === "word" && (BREAK_BEFORE.has(upper) || JOIN_MODIFIER.has(upper))) {
      const line = out.trimEnd().split("\n").pop()?.trim() ?? "";
      const stay =
        (upper === "JOIN" && JOIN_MODIFIER.has(line)) ||
        (upper === "OUTER" && JOIN_MODIFIER.has(line)) ||
        (upper === "BY" && (line === "GROUP" || line === "ORDER"));
      if (stay) {
        out += ` ${upper}`;
        continue;
      }
      out = out.replace(/[ \t]+$/g, "");
      out += `${out ? "\n" : ""}${upper}`;
      continue;
    }
    if (token.kind === "word" && (upper === "AND" || upper === "OR")) {
      out = out.replace(/[ \t]+$/g, "");
      out += `\n  ${upper}`;
      continue;
    }
    if (token.kind === "word") {
      const rendered = KEYWORDS.has(upper.toLowerCase()) ? upper : token.value;
      out += needsSpace(out) ? ` ${rendered}` : rendered;
      continue;
    }
    if (token.kind === "string") {
      out += needsSpace(out) ? ` ${token.value}` : token.value;
      continue;
    }
    if (token.value === ",") {
      out += ", ";
      continue;
    }
    if (token.value === "(" || token.value === ")") {
      if (token.value === "(") out += "(";
      else out = `${out.trimEnd()})`;
      continue;
    }
    if ("=<>!".includes(token.value)) {
      out += ` ${token.value} `;
      continue;
    }
    out += token.value;
  }
  return out
    .split("\n")
    .map((line) => {
      const indent = /^\s*/.exec(line)?.[0] ?? "";
      return indent + line.trim().replace(/[ \t]{2,}/g, " ");
    })
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function needsSpace(out: string): boolean {
  if (!out) return false;
  return !/[\s(]$/.test(out);
}

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < sql.length) {
    const char = sql[i];
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }
    if (char === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      tokens.push({ kind: "comment", value: end === -1 ? sql.slice(i) : sql.slice(i, end) });
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (char === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      const slice = end === -1 ? sql.slice(i) : sql.slice(i, end + 2);
      tokens.push({ kind: "comment", value: slice });
      i += slice.length;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      let j = i + 1;
      let value = char;
      while (j < sql.length) {
        value += sql[j];
        if (sql[j] === char) {
          if (sql[j + 1] === char) {
            value += sql[j + 1];
            j += 2;
            continue;
          }
          j += 1;
          break;
        }
        j += 1;
      }
      tokens.push({ kind: "string", value });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j])) j += 1;
      tokens.push({ kind: "word", value: sql.slice(i, j) });
      i = j;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let j = i + 1;
      while (j < sql.length && /[0-9.]/.test(sql[j])) j += 1;
      tokens.push({ kind: "word", value: sql.slice(i, j) });
      i = j;
      continue;
    }
    tokens.push({ kind: "symbol", value: char });
    i += 1;
  }
  return tokens;
}

type NumberKind = "int" | "float";

export type IR =
  | { kind: "string"; nullable: boolean }
  | { kind: "number"; numberKind: NumberKind; nullable: boolean }
  | { kind: "boolean"; nullable: boolean }
  | { kind: "null" }
  | { kind: "unknown"; nullable: boolean }
  | { kind: "array"; item: IR; nullable: boolean }
  | { kind: "object"; name: string; fields: Field[]; nullable: boolean }
  | { kind: "union"; options: IR[]; nullable: boolean };

type Field = { key: string; optional: boolean; type: IR };

export type CodegenResult = {
  typescript: string;
  zod: string;
  go: string;
};

export function generateModels(value: unknown, rootName = "Root"): CodegenResult {
  const used = new Set<string>();
  const root = inferValue(value, sanitiseName(rootName), used, true);
  return {
    typescript: emitTypeScript(root),
    zod: emitZod(root),
    go: emitGo(root),
  };
}

export function jsonToTypeScript(input: string, rootName = "Root"): string {
  return generateModels(JSON.parse(input) as unknown, rootName).typescript;
}

export function jsonToZod(input: string, rootName = "Root"): string {
  return generateModels(JSON.parse(input) as unknown, rootName).zod;
}

export function jsonToGo(input: string, rootName = "Root"): string {
  return generateModels(JSON.parse(input) as unknown, rootName).go;
}

function inferValue(value: unknown, name: string, used: Set<string>, reserveName: boolean): IR {
  if (value === null) return { kind: "null" };
  if (typeof value === "string") return { kind: "string", nullable: false };
  if (typeof value === "boolean") return { kind: "boolean", nullable: false };
  if (typeof value === "number") {
    return { kind: "number", numberKind: Number.isInteger(value) ? "int" : "float", nullable: false };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", item: { kind: "unknown", nullable: false }, nullable: false };
    let item = inferValue(value[0], singular(name), used, false);
    for (const entry of value.slice(1)) {
      item = mergeIR(item, inferValue(entry, singular(name), used, false), singular(name), used);
    }
    return { kind: "array", item, nullable: false };
  }
  if (typeof value === "object") {
    const typeName = reserveName ? claim(name, used) : claim(name, used);
    const fields = Object.entries(value as Record<string, unknown>).map(([key, entry]) => ({
      key,
      optional: false,
      type: inferValue(entry, pascal(key) || "Field", used, false),
    }));
    return { kind: "object", name: typeName, fields, nullable: false };
  }
  return { kind: "unknown", nullable: false };
}

function mergeIR(a: IR, b: IR, name: string, used: Set<string>): IR {
  if (sameShape(a, b) && a.kind !== "object" && a.kind !== "union") {
    if (a.kind === "number" && b.kind === "number") {
      return { kind: "number", numberKind: a.numberKind === "float" || b.numberKind === "float" ? "float" : "int", nullable: a.nullable || b.nullable };
    }
    if (a.kind === "array" && b.kind === "array") {
      return { kind: "array", item: mergeIR(a.item, b.item, singular(name), used), nullable: a.nullable || b.nullable };
    }
    return a.kind === "null" ? a : { ...a, nullable: "nullable" in a ? a.nullable || ("nullable" in b && b.nullable) : false };
  }
  if (a.kind === "null") return withNullable(b);
  if (b.kind === "null") return withNullable(a);
  if (a.kind === "object" && b.kind === "object") return mergeObjects(a, b);
  const options = flattenUnion(a).concat(flattenUnion(b));
  const unique: IR[] = [];
  for (const option of options) {
    if (!unique.some((existing) => sameShape(existing, option))) unique.push(option);
  }
  if (unique.length === 1) return unique[0];
  return { kind: "union", options: unique, nullable: false };
}

function mergeObjects(a: Extract<IR, { kind: "object" }>, b: Extract<IR, { kind: "object" }>): IR {
  const keys = new Set([...a.fields.map((field) => field.key), ...b.fields.map((field) => field.key)]);
  const fields: Field[] = [];
  for (const key of keys) {
    const left = a.fields.find((field) => field.key === key);
    const right = b.fields.find((field) => field.key === key);
    if (left && right) {
      fields.push({
        key,
        optional: left.optional || right.optional,
        type: mergeIR(left.type, right.type, pascal(key) || "Field", new Set()),
      });
    } else if (left) fields.push({ ...left, optional: true });
    else if (right) fields.push({ ...right, optional: true });
  }
  return { kind: "object", name: a.name, fields, nullable: a.nullable || b.nullable };
}

function withNullable(type: IR): IR {
  if (type.kind === "null") return type;
  if (type.kind === "union") return { ...type, nullable: true };
  return { ...type, nullable: true };
}

function flattenUnion(type: IR): IR[] {
  if (type.kind === "union") return type.options;
  return [type];
}

function sameShape(a: IR, b: IR): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "object" && b.kind === "object") return a.name === b.name;
  if (a.kind === "array" && b.kind === "array") return sameShape(a.item, b.item);
  if (a.kind === "number" && b.kind === "number") return true;
  return true;
}

function emitTypeScript(root: IR): string {
  const blocks: string[] = [];
  const seen = new Set<string>();
  collectObjects(root, blocks, seen, "ts");
  const alias = `export type ${rootName(root)} = ${tsType(root)};`;
  if (root.kind === "object") return blocks.join("\n\n") + "\n";
  return `${blocks.length ? `${blocks.join("\n\n")}\n\n` : ""}${alias}\n`;
}

function emitZod(root: IR): string {
  const helper: string[] = [];
  const seen = new Set<string>();
  collectObjects(root, helper, seen, "zod");
  const schemaName = `${rootName(root)}Schema`;
  const lines = [`import { z } from "zod";`, ""];
  if (helper.length) lines.push(helper.join("\n\n"), "");
  if (root.kind === "object") {
    lines.push(`export type ${root.name} = z.infer<typeof ${root.name}Schema>;`, "");
    return lines.join("\n");
  }
  lines.push(`export const ${schemaName} = ${zodType(root)};`, "", `export type ${rootName(root)} = z.infer<typeof ${schemaName}>;`, "");
  return lines.join("\n");
}

function emitGo(root: IR): string {
  const blocks: string[] = [];
  const seen = new Set<string>();
  collectObjects(root, blocks, seen, "go");
  const lines = ["package types", ""];
  if (root.kind !== "object") {
    lines.push(`type ${rootName(root)} ${goType(root)}`, "");
  }
  lines.push(blocks.join("\n\n"), "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function collectObjects(type: IR, blocks: string[], seen: Set<string>, lang: "ts" | "zod" | "go") {
  if (type.kind === "array") {
    collectObjects(type.item, blocks, seen, lang);
    return;
  }
  if (type.kind === "union") {
    for (const option of type.options) collectObjects(option, blocks, seen, lang);
    return;
  }
  if (type.kind !== "object") return;
  for (const field of type.fields) collectObjects(field.type, blocks, seen, lang);
  if (seen.has(type.name)) return;
  seen.add(type.name);
  if (lang === "ts") blocks.push(tsInterface(type));
  if (lang === "zod") blocks.push(zodObject(type));
  if (lang === "go") blocks.push(goStruct(type));
}

function tsInterface(type: Extract<IR, { kind: "object" }>): string {
  const fields = type.fields
    .map((field) => `  ${tsKey(field.key)}${field.optional ? "?" : ""}: ${tsType(field.type)};`)
    .join("\n");
  return `export interface ${type.name} {\n${fields}\n}`;
}

function zodObject(type: Extract<IR, { kind: "object" }>): string {
  const fields = type.fields
    .map((field) => {
      let value = zodType(field.type);
      if (field.optional) value += ".optional()";
      return `  ${JSON.stringify(field.key)}: ${value},`;
    })
    .join("\n");
  return `export const ${type.name}Schema = z.object({\n${fields}\n});`;
}

function goStruct(type: Extract<IR, { kind: "object" }>): string {
  const fields = type.fields
    .map((field) => {
      let go = goType(field.type);
      if (field.optional && !go.startsWith("*") && field.type.kind !== "union") go = `*${go}`;
      return `\t${goField(field.key)} ${go} \`json:"${field.key}${field.optional ? ",omitempty" : ""}"\``;
    })
    .join("\n");
  return `type ${type.name} struct {\n${fields}\n}`;
}

function tsType(type: IR): string {
  const base = tsBase(type);
  return "nullable" in type && type.nullable ? `${base} | null` : base;
}

function tsBase(type: IR): string {
  switch (type.kind) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "unknown":
      return "unknown";
    case "array":
      return `${wrapArray(tsType(type.item))}[]`;
    case "object":
      return type.name;
    case "union":
      return type.options.map((option) => tsType(option)).join(" | ");
  }
}

function zodType(type: IR): string {
  let base: string;
  switch (type.kind) {
    case "string":
      base = "z.string()";
      break;
    case "number":
      base = "z.number()";
      break;
    case "boolean":
      base = "z.boolean()";
      break;
    case "null":
      return "z.null()";
    case "unknown":
      base = "z.unknown()";
      break;
    case "array":
      base = `z.array(${zodType(type.item)})`;
      break;
    case "object":
      base = `${type.name}Schema`;
      break;
    case "union":
      base = `z.union([${type.options.map((option) => zodType(option)).join(", ")}])`;
      break;
  }
  return "nullable" in type && type.nullable ? `${base}.nullable()` : base;
}

function goType(type: IR): string {
  const base = goBase(type);
  if ("nullable" in type && type.nullable && type.kind !== "object") {
    if (type.kind === "array" || type.kind === "union" || type.kind === "unknown") return base;
    return `*${base}`;
  }
  return base;
}

function goBase(type: IR): string {
  switch (type.kind) {
    case "string":
      return "string";
    case "number":
      return type.numberKind === "int" ? "int" : "float64";
    case "boolean":
      return "bool";
    case "null":
    case "unknown":
      return "any";
    case "array":
      return `[]${goType(type.item)}`;
    case "object":
      return type.name;
    case "union":
      return "any";
  }
}

function wrapArray(type: string): string {
  return type.includes("|") || type.includes(" ") ? `(${type})` : type;
}

function rootName(type: IR): string {
  return type.kind === "object" ? type.name : "Root";
}

function claim(name: string, used: Set<string>): string {
  const base = sanitiseName(name);
  let next = base;
  let i = 2;
  while (used.has(next)) next = `${base}${i++}`;
  used.add(next);
  return next;
}

export function sanitiseName(name: string): string {
  const cleaned = pascal(name);
  if (!cleaned || /^[0-9]/.test(cleaned)) return "Root";
  return cleaned;
}

export function pascal(input: string): string {
  const parts = input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  return parts
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "id") return "ID";
      if (lower === "url") return "URL";
      if (lower === "uri") return "URI";
      if (lower === "api") return "API";
      if (lower === "html") return "HTML";
      if (lower === "css") return "CSS";
      if (lower === "json") return "JSON";
      if (lower === "sql") return "SQL";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function singular(name: string): string {
  const base = sanitiseName(name);
  return base.endsWith("s") && base.length > 1 ? base.slice(0, -1) : `${base}Item`;
}

function tsKey(key: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key);
}

function goField(key: string): string {
  const name = pascal(key);
  if (!name || /^[0-9]/.test(name)) return `Field${name || "Value"}`;
  return name;
}

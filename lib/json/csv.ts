export function jsonToCsv(input: string): string {
  const value = JSON.parse(input) as unknown;
  const rows = toRows(value);
  if (rows.length === 0) throw new Error("JSON has no rows to convert. Use an array of objects or a single object.");
  const headers: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }
  return [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key] ?? "")).join(","))].join("\n");
}

function toRows(value: unknown): Array<Record<string, string>> {
  if (Array.isArray(value)) {
    if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      return value.map((item) => flatten(item as Record<string, unknown>));
    }
    if (value.every((item) => Array.isArray(item))) {
      return (value as unknown[][]).map((item) => {
        const row: Record<string, string> = {};
        item.forEach((cell, index) => {
          row[`column_${index + 1}`] = scalar(cell);
        });
        return row;
      });
    }
    return value.map((item, index) => ({ index: String(index), value: scalar(item) }));
  }
  if (value && typeof value === "object") return [flatten(value as Record<string, unknown>)];
  throw new Error("JSON must be an object or an array.");
}

function flatten(input: Record<string, unknown>, prefix = ""): Record<string, string> {
  const row: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(row, flatten(value as Record<string, unknown>, path));
    } else {
      row[path] = scalar(value);
    }
  }
  return row;
}

function scalar(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

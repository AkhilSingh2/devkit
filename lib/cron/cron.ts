export type CronFieldName = "minute" | "hour" | "day of month" | "month" | "day of week";

export type CronField = {
  name: CronFieldName;
  raw: string;
  detail: string;
  values: number[];
};

export type ParsedCron = {
  expression: string;
  summary: string;
  fields: CronField[];
};

const ALIASES: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const DAYS: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

const FIELD_META: Array<{ name: CronFieldName; min: number; max: number; names?: Record<string, number> }> = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day of month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12, names: MONTHS },
  { name: "day of week", min: 0, max: 7, names: DAYS },
];

export function parseCron(input: string): ParsedCron {
  const trimmed = input.trim().replace(/\s+/g, " ");
  const expression = ALIASES[trimmed.toLowerCase()] ?? trimmed;
  const parts = expression.split(" ");
  if (parts.length !== 5) {
    throw new Error("Use 5 fields: minute hour day-of-month month day-of-week. Quartz seconds are not accepted.");
  }
  const fields = parts.map((raw, index) => {
    const meta = FIELD_META[index];
    const values = [...parseField(raw, meta.min, meta.max, meta.names)];
    if (meta.name === "day of week") {
      const normalised = new Set(values.map((value) => (value === 7 ? 0 : value)));
      return { name: meta.name, raw, detail: describeField(raw, meta), values: [...normalised].sort((a, b) => a - b) };
    }
    values.sort((a, b) => a - b);
    return { name: meta.name, raw, detail: describeField(raw, meta), values };
  });
  return { expression, summary: summarise(expression, fields), fields };
}

export function nextRuns(input: string, from = new Date(), count = 5): Date[] {
  const cron = parseCron(input);
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);
  const runs: Date[] = [];
  for (let guard = 0; runs.length < count && guard < 2_200_000; guard += 1) {
    if (matches(cursor, cron)) runs.push(new Date(cursor.getTime()));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  if (runs.length < count) throw new Error("No matching run time was found in the next four years.");
  return runs;
}

function matches(date: Date, cron: ParsedCron): boolean {
  const minute = cron.fields[0].values;
  const hour = cron.fields[1].values;
  const dom = cron.fields[2].values;
  const month = cron.fields[3].values;
  const dow = cron.fields[4].values;
  if (!minute.includes(date.getMinutes())) return false;
  if (!hour.includes(date.getHours())) return false;
  if (!month.includes(date.getMonth() + 1)) return false;
  const domRestricted = cron.fields[2].raw !== "*" && cron.fields[2].raw !== "?";
  const dowRestricted = cron.fields[4].raw !== "*" && cron.fields[4].raw !== "?";
  const day = date.getDate();
  const week = date.getDay();
  if (domRestricted && dowRestricted) return dom.includes(day) || dow.includes(week);
  if (domRestricted && !dom.includes(day)) return false;
  if (dowRestricted && !dow.includes(week)) return false;
  return true;
}

function parseField(input: string, min: number, max: number, names?: Record<string, number>): Set<number> {
  const raw = input.trim().toLowerCase();
  if (raw === "*" || raw === "?") return fill(min, max, 1, min);
  const values = new Set<number>();
  for (const part of raw.split(",")) {
    if (!part) throw new Error(`Empty item in "${input}"`);
    const [span, stepRaw] = part.split("/");
    if (part.split("/").length > 2) throw new Error(`Invalid step in "${input}"`);
    const step = stepRaw === undefined ? 1 : Number(stepRaw);
    if (!Number.isInteger(step) || step <= 0) throw new Error(`Invalid step in "${input}"`);
    if (span === "*") {
      for (const value of fill(min, max, step, min)) values.add(value);
      continue;
    }
    const [startRaw, endRaw] = span.split("-");
    if (span.split("-").length > 2) throw new Error(`Invalid range in "${input}"`);
    const start = resolveToken(startRaw, names, input);
    const end = endRaw === undefined ? (stepRaw === undefined ? start : max) : resolveToken(endRaw, names, input);
    if (start < min || end > max || start > end) throw new Error(`Value out of range in "${input}"`);
    for (const value of fill(start, end, stepRaw === undefined && endRaw === undefined ? 0 : step, start)) {
      values.add(value);
    }
  }
  return values;
}

function fill(start: number, end: number, step: number, only: number): Set<number> {
  const values = new Set<number>();
  if (step === 0) {
    values.add(only);
    return values;
  }
  for (let value = start; value <= end; value += step) values.add(value);
  return values;
}

function resolveToken(token: string, names: Record<string, number> | undefined, field: string): number {
  if (names && token in names) return names[token];
  if (!/^\d+$/.test(token)) throw new Error(`Invalid value "${token}" in "${field}"`);
  return Number(token);
}

function describeField(raw: string, meta: { name: CronFieldName; min: number; max: number }): string {
  const value = raw.toLowerCase();
  if (value === "*" || value === "?") return `any ${meta.name}`;
  if (/^\*\/\d+$/.test(value)) return `every ${value.slice(2)} ${unit(meta.name)}`;
  if (/^\d+$/.test(value)) return `${meta.name} ${value}`;
  return `${meta.name} matching ${raw}`;
}

function unit(name: CronFieldName): string {
  if (name === "minute") return "minutes";
  if (name === "hour") return "hours";
  if (name === "day of month") return "days";
  if (name === "month") return "months";
  return "days of the week";
}

function summarise(expression: string, fields: CronField[]): string {
  const known: Record<string, string> = {
    "* * * * *": "Every minute.",
    "*/5 * * * *": "Every 5 minutes.",
    "*/15 * * * *": "Every 15 minutes.",
    "0 * * * *": "Every hour, at minute 0.",
    "0 0 * * *": "Every day at 00:00.",
    "0 9 * * 1-5": "At 09:00 on Monday through Friday.",
    "0 0 * * 0": "Every Sunday at 00:00.",
    "0 0 1 * *": "At 00:00 on the first day of every month.",
    "0 0 1 1 *": "At 00:00 on 1 January.",
  };
  if (known[expression]) return known[expression];
  return `Runs when ${fields.map((field) => field.detail).join("; ")}. If both the day-of-month and day-of-week are restricted, either one can match.`;
}

export function formatRun(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${weekdays[date.getDay()]} ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

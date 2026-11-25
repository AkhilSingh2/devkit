export type UnixReading = {
  milliseconds: number;
  seconds: number;
  iso: string;
  utc: string;
  local: string;
};

export function interpretTime(input: string, now = Date.now()): UnixReading {
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === "now") return reading(now);
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const value = Number(trimmed);
    if (!Number.isFinite(value)) throw new Error("That number is not a usable timestamp.");
    const milliseconds = Math.abs(value) >= 1e11 ? value : value * 1000;
    return reading(milliseconds);
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    throw new Error("Use a Unix timestamp, milliseconds, or a date such as 2026-01-01T00:00:00Z.");
  }
  return reading(parsed);
}

function reading(milliseconds: number): UnixReading {
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new Error("That timestamp is outside the range JavaScript can format.");
  return {
    milliseconds: date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: formatLocal(date),
  };
}

export function formatLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export type HistoryItem = {
  id: string;
  tool: string;
  label: string;
  preview: string;
  payload: unknown;
  createdAt: number;
};

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const HISTORY_KEY = "devkit.history.v1";
const LAST_KEY = "devkit.last.v1";
const LIMIT = 40;
const MAX_PAYLOAD = 80_000;

export function readHistory(store: KeyValueStore): HistoryItem[] {
  const raw = store.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function pushHistory(store: KeyValueStore, item: Omit<HistoryItem, "id" | "createdAt"> & { id?: string }): HistoryItem[] {
  const serialised = JSON.stringify(item.payload);
  if (serialised.length > MAX_PAYLOAD) return readHistory(store);
  const next: HistoryItem = {
    id: item.id ?? randomId(),
    tool: item.tool,
    label: item.label,
    preview: item.preview.slice(0, 160),
    payload: item.payload,
    createdAt: Date.now(),
  };
  const items = [next, ...readHistory(store).filter((entry) => entry.preview !== next.preview || entry.tool !== next.tool)].slice(0, LIMIT);
  store.setItem(HISTORY_KEY, JSON.stringify(items));
  return items;
}

export function clearHistory(store: KeyValueStore) {
  store.removeItem(HISTORY_KEY);
  store.removeItem(LAST_KEY);
}

export function writeLast(store: KeyValueStore, tool: string, payload: unknown) {
  const serialised = JSON.stringify(payload);
  if (serialised.length > MAX_PAYLOAD) return;
  const all = readLastMap(store);
  all[tool] = payload;
  store.setItem(LAST_KEY, JSON.stringify(all));
}

export function readLast(store: KeyValueStore, tool: string): unknown {
  return readLastMap(store)[tool];
}

function readLastMap(store: KeyValueStore): Record<string, unknown> {
  const raw = store.getItem(LAST_KEY);
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `h_${Date.now().toString(36)}`;
}

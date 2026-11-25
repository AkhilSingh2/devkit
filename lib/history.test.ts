import { describe, expect, it } from "vitest";
import { clearHistory, pushHistory, readHistory, readLast, writeLast, type KeyValueStore } from "./history";

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("history", () => {
  it("stores, dedupes, and clears snapshots", () => {
    const store = memoryStore();
    pushHistory(store, { tool: "json-formatter", label: "JSON", preview: "{ }", payload: { input: "{ }" } });
    pushHistory(store, { tool: "json-formatter", label: "JSON", preview: "{ }", payload: { input: "{ }" } });
    pushHistory(store, { tool: "cron", label: "Cron", preview: "* * * * *", payload: { expression: "* * * * *" } });
    expect(readHistory(store)).toHaveLength(2);
    expect(readHistory(store)[0].tool).toBe("cron");
    clearHistory(store);
    expect(readHistory(store)).toEqual([]);
  });

  it("remembers the last payload per tool", () => {
    const store = memoryStore();
    writeLast(store, "base64", { text: "hello" });
    expect(readLast(store, "base64")).toEqual({ text: "hello" });
    clearHistory(store);
    expect(readLast(store, "base64")).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { interpretTime } from "./unix";

describe("interpretTime", () => {
  it("treats short numbers as seconds and long numbers as milliseconds", () => {
    expect(interpretTime("1700000000").milliseconds).toBe(1_700_000_000_000);
    expect(interpretTime("1700000000000").seconds).toBe(1_700_000_000);
    expect(interpretTime("1700000000").iso).toBe("2023-11-14T22:13:20.000Z");
  });

  it("parses ISO dates and now", () => {
    expect(interpretTime("2026-01-01T00:00:00Z").iso).toBe("2026-01-01T00:00:00.000Z");
    expect(interpretTime("now", 1_700_000_000_000).seconds).toBe(1_700_000_000);
  });

  it("rejects text that is not a date", () => {
    expect(() => interpretTime("tomorrow")).toThrow(/Unix timestamp/i);
  });
});

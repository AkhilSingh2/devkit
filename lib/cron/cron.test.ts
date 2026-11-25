import { describe, expect, it } from "vitest";
import { nextRuns, parseCron } from "./cron";

describe("cron", () => {
  it("explains a step expression and lists the next runs five minutes apart", () => {
    const parsed = parseCron("*/5 * * * *");
    expect(parsed.summary).toMatch(/every 5 minutes/i);
    const from = new Date(2026, 0, 1, 10, 1, 30);
    const runs = nextRuns("*/5 * * * *", from, 5);
    expect(runs.map((date) => date.getMinutes())).toEqual([5, 10, 15, 20, 25]);
  });

  it("keeps weekday jobs on weekdays", () => {
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = nextRuns("0 9 * * 1-5", from, 3);
    expect(runs.every((date) => date.getHours() === 9 && date.getDay() >= 1 && date.getDay() <= 5)).toBe(true);
  });

  it("accepts nicknames and month names", () => {
    expect(parseCron("@hourly").expression).toBe("0 * * * *");
    expect(parseCron("0 0 1 JAN MON").fields[3].values).toEqual([1]);
    expect(parseCron("0 0 * * 7").fields[4].values).toEqual([0]);
  });

  it("rejects a sixth field and an out-of-range minute", () => {
    expect(() => parseCron("0 0 * * * *")).toThrow(/5 fields/);
    expect(() => parseCron("60 * * * *")).toThrow(/out of range/i);
  });
});

import { describe, expect, it } from "vitest";
import { diffLines, diffStats, sideBySide } from "./diff";

describe("diffLines", () => {
  it("pairs a replacement and keeps equal lines", () => {
    const ops = diffLines("alpha\nbeta\ngamma", "alpha\nBETA\ngamma");
    expect(ops.map((op) => op.type)).toEqual(["equal", "delete", "insert", "equal"]);
    expect(diffStats(ops)).toEqual({ added: 1, removed: 1 });
    const rows = sideBySide(ops);
    expect(rows[1].left?.text).toBe("beta");
    expect(rows[1].right?.text).toBe("BETA");
  });

  it("treats CRLF and a trailing newline as the same lines", () => {
    expect(diffLines("a\r\nb\n", "a\nb").every((op) => op.type === "equal")).toBe(true);
  });
});

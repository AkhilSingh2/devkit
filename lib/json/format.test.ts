import { describe, expect, it } from "vitest";
import { formatJson, jsonErrorLabel, parseJson } from "./format";

describe("formatJson", () => {
  it("pretty-prints and minifies", () => {
    const result = formatJson('{"b":1,"a":[2,3]}', 2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.formatted).toBe('{\n  "b": 1,\n  "a": [\n    2,\n    3\n  ]\n}');
    expect(result.minified).toBe('{"b":1,"a":[2,3]}');
  });

  it("supports tab indent", () => {
    const result = formatJson('{"a":1}', "tab");
    expect(result.ok && result.formatted.startsWith("{\n\t")).toBe(true);
  });

  it("reports a line and column for syntax errors", () => {
    const result = parseJson('{\n  "a":\n}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.line).toBeGreaterThan(1);
    expect(jsonErrorLabel(result)).toMatch(/line \d+, column \d+/);
  });
});

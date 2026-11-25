import { describe, expect, it } from "vitest";
import { explainRegex, summariseRegex, testRegex } from "./regex";

describe("regex", () => {
  it("explains tokens in order", () => {
    const tokens = explainRegex("^\\d{2,4}[a-z]+");
    expect(tokens.map((token) => token.source)).toEqual(["^", "\\d", "{2,4}", "[a-z]", "+"]);
    expect(tokens[1].explanation).toMatch(/digit/i);
    expect(summariseRegex("^\\d+")).toMatch(/start/i);
  });

  it("finds global matches and groups", () => {
    const result = testRegex("(\\w+)@example\\.com", "gi", "a@example.com and B@example.com");
    expect(result.error).toBeUndefined();
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].groups).toEqual(["a"]);
  });

  it("returns an error for an invalid pattern", () => {
    expect(testRegex("[", "", "abc").error).toBeTruthy();
  });
});

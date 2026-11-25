import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "./share";

describe("share hash", () => {
  it("round-trips unicode tool state", () => {
    const payload = { v: 1 as const, tool: "json-formatter", data: { input: "café — 测试" } };
    expect(decodeShare(`#${encodeShare(payload)}`)).toEqual(payload);
  });

  it("ignores unrelated hashes", () => {
    expect(decodeShare("#heading")).toBeNull();
  });
});

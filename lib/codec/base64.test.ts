import { describe, expect, it } from "vitest";
import { decodeBase64, decodeBase64Url, encodeBase64, encodeBase64Url } from "./base64";

describe("base64", () => {
  it("round-trips ascii and unicode", () => {
    expect(encodeBase64("hello")).toBe("aGVsbG8=");
    expect(decodeBase64("aGVsbG8=")).toBe("hello");
    expect(decodeBase64(encodeBase64("café ✓"))).toBe("café ✓");
  });

  it("supports the url-safe alphabet", () => {
    const encoded = encodeBase64Url("subjects?_>");
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeBase64Url(encoded)).toBe("subjects?_>");
  });

  it("rejects junk", () => {
    expect(() => decodeBase64("%%%%")).toThrow(/not valid base64/i);
  });
});

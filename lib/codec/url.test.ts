import { describe, expect, it } from "vitest";
import { decodeUrlComponent, encodeForm, encodeUrl, encodeUrlComponent } from "./url";

describe("url codec", () => {
  it("percent-encodes reserved characters and preserves a full URI", () => {
    expect(encodeUrlComponent("a b/c?")).toBe("a%20b%2Fc%3F");
    expect(decodeUrlComponent("a%20b%2Fc%3F")).toBe("a b/c?");
    expect(decodeUrlComponent("a+b")).toBe("a b");
    expect(encodeUrl("https://example.com/a b")).toBe("https://example.com/a%20b");
  });

  it("uses plus signs for form encoding", () => {
    expect(encodeForm("hello world")).toBe("hello+world");
  });
});

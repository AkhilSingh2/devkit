import { describe, expect, it } from "vitest";
import { hashText } from "./hash";

describe("hashText", () => {
  it("matches the known SHA-256 of abc", async () => {
    const result = await hashText("SHA-256", "abc");
    expect(result.hex).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("changes with the algorithm", async () => {
    const sha1 = await hashText("SHA-1", "abc");
    const sha512 = await hashText("SHA-512", "abc");
    expect(sha1.hex).not.toBe(sha512.hex);
    expect(sha1.hex).toHaveLength(40);
    expect(sha512.hex).toHaveLength(128);
  });
});

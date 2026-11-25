import { describe, expect, it } from "vitest";
import { isUuid, nanoid, ulid, uuid } from "./ids";

describe("ids", () => {
  it("creates a UUID v4", () => {
    const value = uuid();
    expect(isUuid(value)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });

  it("creates a URL-safe nanoid of the requested length", () => {
    const value = nanoid(12);
    expect(value).toHaveLength(12);
    expect(value).toMatch(/^[0-9A-Za-z_-]+$/);
  });

  it("encodes a ULID that sorts by time", () => {
    const random = new Uint8Array(10).fill(1);
    const earlier = ulid(1_700_000_000_000, random);
    const later = ulid(1_700_000_000_001, random);
    expect(earlier).toHaveLength(26);
    expect(earlier < later).toBe(true);
    expect(earlier).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});

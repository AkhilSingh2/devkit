import { describe, expect, it } from "vitest";
import { decodeJwt, encodeJwtPart, jwtExpiry, sampleJwt } from "./decode";

describe("decodeJwt", () => {
  it("decodes header and payload without verifying the signature", () => {
    const decoded = decodeJwt(sampleJwt(1_700_000_000_000));
    expect(decoded.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(decoded.payload).toMatchObject({ sub: "usr_demo", name: "Example User" });
    expect(decoded.signature).toBe("demo-signature-not-verified");
  });

  it("strips a Bearer prefix and reports expiry", () => {
    const token = `Bearer ${encodeJwtPart({ alg: "none", typ: "JWT" })}.${encodeJwtPart({ exp: 1_600_000_000 })}.sig`;
    const decoded = decodeJwt(token);
    expect(decoded.expiresAt).toBe(1_600_000_000_000);
    expect(jwtExpiry(decoded.expiresAt, 1_700_000_000_000)?.expired).toBe(true);
    expect(jwtExpiry(1_700_000_000_000 + 90_000, 1_700_000_000_000)?.label).toBe("1m 30s");
  });

  it("rejects a token that is not dotted base64url json", () => {
    expect(() => decodeJwt("not-a-jwt")).toThrow(/two or three/);
  });
});

import { describe, expect, it } from "vitest";
import { fromOctal, toOctal, toSymbolic } from "./chmod";

describe("chmod", () => {
  it("converts common modes", () => {
    expect(toSymbolic(fromOctal("755"))).toBe("rwxr-xr-x");
    expect(toOctal(fromOctal("0644"))).toBe("644");
    expect(toSymbolic(fromOctal("4755"))).toBe("rwsr-xr-x");
    expect(toOctal(fromOctal("4755"))).toBe("4755");
    expect(toSymbolic(fromOctal("1777"))).toBe("rwxrwxrwt");
    expect(toSymbolic(fromOctal("2755"))).toBe("rwxr-sr-x");
  });

  it("shows a capital S when setuid is set without execute", () => {
    expect(toSymbolic(fromOctal("4644"))).toBe("rwSr--r--");
  });

  it("rejects decimal-looking junk", () => {
    expect(() => fromOctal("999")).toThrow(/octal/i);
  });
});

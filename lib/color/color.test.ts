import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio, parseColor, toHex, toHslString, toRgbString, wcag } from "./color";

describe("parseColor", () => {
  it("parses short and long hex", () => {
    expect(parseColor("#0f0")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parseColor("#112233")).toEqual({ r: 17, g: 34, b: 51, a: 1 });
    expect(toHex(parseColor("#11223388")!)).toBe("#11223388");
  });

  it("parses rgb and hsl", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    const hsl = parseColor("hsl(0, 100%, 50%)");
    expect(hsl && toHex(hsl)).toBe("#ff0000");
    expect(toRgbString(parseColor("#fff")!)).toBe("rgb(255, 255, 255)");
    expect(toHslString(parseColor("#ff0000")!)).toBe("hsl(0, 100%, 50%)");
  });

  it("rejects unknown input", () => {
    expect(parseColor("not-a-color")).toBeNull();
  });
});

describe("contrast", () => {
  it("matches the known black on white ratio", () => {
    const ratio = contrastRatio(parseColor("#000")!, parseColor("#fff")!);
    expect(ratio).toBeCloseTo(21, 1);
    expect(wcag(parseColor("#000")!, parseColor("#fff")!).aaaNormal).toBe(true);
    expect(formatRatio(21)).toBe("21.00:1");
  });

  it("keeps DevKit theme pairs at WCAG AA for body text", () => {
    const pairs: Array<[string, string]> = [
      ["#e7f2ec", "#101614"],
      ["#c5ddd0", "#101614"],
      ["#102018", "#8ee4b8"],
      ["#14211b", "#f5f7f6"],
      ["#3c5248", "#f5f7f6"],
      ["#f4fff8", "#0f7a48"],
    ];
    for (const [fg, bg] of pairs) {
      const ratio = contrastRatio(parseColor(fg)!, parseColor(bg)!);
      expect(ratio, `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

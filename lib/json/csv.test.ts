import { describe, expect, it } from "vitest";
import { jsonToCsv } from "./csv";

describe("jsonToCsv", () => {
  it("flattens objects and unions headers", () => {
    const csv = jsonToCsv(JSON.stringify([{ id: 1, address: { city: "Pune" } }, { id: 2, note: "a,b" }]));
    expect(csv.split("\n")[0]).toBe("id,address.city,note");
    expect(csv).toContain("1,Pune,");
    expect(csv).toContain('"a,b"');
  });

  it("escapes quotes", () => {
    expect(jsonToCsv(JSON.stringify([{ name: 'say "hi"' }]))).toContain('"say ""hi"""');
  });

  it("rejects an empty array", () => {
    expect(() => jsonToCsv("[]")).toThrow(/no rows/i);
  });
});

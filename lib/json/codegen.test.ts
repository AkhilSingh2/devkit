import { describe, expect, it } from "vitest";
import { jsonToGo, jsonToTypeScript, jsonToZod } from "./codegen";

const sample = JSON.stringify({
  id: 1,
  name: "Ada",
  site_url: "https://example.com",
  active: true,
  score: 1.5,
  tags: ["a"],
  address: { city: "Pune" },
  nickname: null,
});

describe("json code generation", () => {
  it("emits a TypeScript interface with nested types", () => {
    const ts = jsonToTypeScript(sample, "User");
    expect(ts).toContain("export interface User");
    expect(ts).toContain("site_url: string;");
    expect(ts).toContain("tags: string[];");
    expect(ts).toContain("export interface Address");
    expect(ts).toContain("nickname: null;");
  });

  it("marks keys missing from some array items as optional", () => {
    const ts = jsonToTypeScript(JSON.stringify([{ a: 1, b: 2 }, { a: 1 }]), "Row");
    expect(ts).toContain("b?:");
  });

  it("emits zod and go from the same inference", () => {
    const zod = jsonToZod(sample, "User");
    expect(zod).toContain('import { z } from "zod"');
    expect(zod).toContain("UserSchema");
    expect(zod).toContain("z.array(z.string())");
    const go = jsonToGo(sample, "User");
    expect(go).toContain("type User struct");
    expect(go).toContain('SiteURL string `json:"site_url"`');
    expect(go).toContain("Score float64");
    expect(go).toContain("ID int");
    expect(go).toContain("type Address struct");
  });

  it("uses a union for mixed arrays", () => {
    const ts = jsonToTypeScript("[1, \"a\"]");
    expect(ts).toContain("number | string");
  });
});

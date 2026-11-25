import { describe, expect, it } from "vitest";
import { buildGitignore } from "./gitignore";
import { buildReadme } from "./readme";

describe("generators", () => {
  it("joins selected gitignore sections", () => {
    const text = buildGitignore(["node", "env"]);
    expect(text).toContain("node_modules/");
    expect(text).toContain("!.env.example");
    expect(text).not.toContain("__pycache__/");
    expect(buildGitignore([])).toBe("");
  });

  it("builds a readme without inventing a license section", () => {
    const text = buildReadme({
      name: "example",
      description: "A small demo.",
      install: "npm install",
      usage: "Run it.",
      license: "none",
      contributing: true,
    });
    expect(text).toContain("# example");
    expect(text).toContain("## Install");
    expect(text).toContain("## Contributing");
    expect(text).not.toContain("## License");
  });
});

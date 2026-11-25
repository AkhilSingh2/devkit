import { describe, expect, it } from "vitest";
import { beautifyCss, beautifyHtml, beautifyJs, minifyCss, minifyHtml, minifyJs } from "./minify";

describe("minify and beautify", () => {
  it("collapses html without eating preformatted text", () => {
    const html = "<div>\n  <pre>a  b</pre>\n</div>";
    expect(minifyHtml(html)).toBe("<div><pre>a  b</pre></div>");
    expect(beautifyHtml("<ul><li>One</li></ul>")).toContain("  <li>One</li>");
  });

  it("formats css and preserves strings", () => {
    expect(minifyCss("a { color: red; } /* x */")).toBe("a{color:red}");
    expect(beautifyCss("a{content:\"{x}\"}")).toContain('content: "{x}"');
  });

  it("does not treat braces inside strings as blocks", () => {
    const source = 'const a = "{ not a block }";\nconst b = 1;';
    expect(minifyJs(`/* note */ ${source}`)).toBe('const a="{ not a block }";const b=1;');
    const pretty = beautifyJs(source);
    expect(pretty).toContain('"{ not a block }"');
    expect(pretty).toContain("const b = 1;");
  });
});

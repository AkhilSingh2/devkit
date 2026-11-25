import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders headings, lists, emphasis, and fenced code", () => {
    const html = renderMarkdown("# Title\n\nA **bold** and *em* word.\n\n- One\n- Two\n\n```js\nconst a = 1;\n```");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>em</em>");
    expect(html).toContain("<li>One</li>");
    expect(html).toContain("<code class=\"language-js\">const a = 1;</code>");
  });

  it("escapes html and drops javascript links", () => {
    const html = renderMarkdown("<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n[docs](https://example.com)");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://example.com"');
  });

  it("renders a table", () => {
    const html = renderMarkdown("| A | B |\n| --- | --- |\n| 1 | 2 |");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>2</td>");
  });
});

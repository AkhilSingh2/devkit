import { describe, expect, it } from "vitest";
import { contentFor } from "./content";
import { pages } from "./registry";

describe("pages", () => {
  it("has unique slugs, copy, and at least three questions each", () => {
    const slugs = pages.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(pages.filter((page) => page.nav).length).toBeGreaterThanOrEqual(22);
    for (const page of pages) {
      expect(page.title.length).toBeGreaterThan(8);
      expect(page.title.length).toBeLessThanOrEqual(70);
      expect(page.description.length).toBeGreaterThanOrEqual(80);
      expect(page.description.length).toBeLessThanOrEqual(200);
      expect(page.h1.length).toBeGreaterThan(3);
      const content = contentFor(page.slug);
      expect(content, page.slug).toBeTruthy();
      expect(content?.faqs.length).toBeGreaterThanOrEqual(3);
      expect(content?.howTo.length).toBeGreaterThanOrEqual(2);
      for (const related of page.related) {
        expect(slugs, `${page.slug} -> ${related}`).toContain(related);
      }
    }
  });
});

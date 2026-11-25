import { describe, expect, it } from "vitest";
import { formatSql } from "./format";

describe("formatSql", () => {
  it("breaks major clauses onto their own lines and keeps strings", () => {
    const formatted = formatSql("select a,b from users where id=1 and name='a b' order by a");
    expect(formatted).toBe(`SELECT a, b
FROM users
WHERE id = 1
  AND name = 'a b'
ORDER BY a`);
  });

  it("drops comments and keeps join modifiers with the join keyword on a new line", () => {
    const formatted = formatSql("select * from a left join b on a.id = b.id -- note");
    expect(formatted).not.toContain("note");
    expect(formatted).toContain("LEFT");
    expect(formatted).toContain("JOIN b");
  });
});

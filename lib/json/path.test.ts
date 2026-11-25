import { describe, expect, it } from "vitest";
import { queryJsonPath } from "./path";

const store = {
  store: {
    book: [
      { title: "Notebook", price: 8, author: "Ada" },
      { title: "Pencil", price: 14, author: "Lin" },
    ],
    bicycle: { price: 190 },
  },
};

describe("queryJsonPath", () => {
  it("reads a property path and an index", () => {
    expect(queryJsonPath(store, "$.store.book[0].title")).toEqual(["Notebook"]);
    expect(queryJsonPath(store, "$.store.book[-1].author")).toEqual(["Lin"]);
  });

  it("supports wildcards, slices, and recursive descent", () => {
    expect(queryJsonPath(store, "$.store.book[*].author")).toEqual(["Ada", "Lin"]);
    expect(queryJsonPath(store, "$.store.book[0:1].title")).toEqual(["Notebook"]);
    expect(queryJsonPath(store, "$..price")).toEqual([8, 14, 190]);
  });

  it("filters with comparisons", () => {
    expect(queryJsonPath(store, "$.store.book[?(@.price<10)].title")).toEqual(["Notebook"]);
    expect(queryJsonPath(store, "$.store.book[?(@.author=='Lin')].price")).toEqual([14]);
  });

  it("rejects a path that does not start at the root", () => {
    expect(() => queryJsonPath(store, "store.book")).toThrow(/start with \$/);
  });
});

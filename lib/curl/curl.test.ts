import { describe, expect, it } from "vitest";
import { curlToFetch, curlToGo, curlToPython, parseCurl } from "./curl";

describe("parseCurl", () => {
  it("reads method, headers, and a JSON body across continued lines", () => {
    const request = parseCurl(`curl -X POST https://example.com/v1/items \\
      -H 'Content-Type: application/json' \\
      -H "Accept: application/json" \\
      -d '{"ok": true}'`);
    expect(request.method).toBe("POST");
    expect(request.url).toBe("https://example.com/v1/items");
    expect(request.headers).toEqual([
      { name: "Content-Type", value: "application/json" },
      { name: "Accept", value: "application/json" },
    ]);
    expect(request.body).toBe('{"ok": true}');
    expect(curlToFetch(request)).toContain("await fetch(");
    expect(curlToPython(request)).toContain("requests.post(");
    expect(curlToPython(request)).toContain("json=");
    expect(curlToGo(request)).toContain("http.NewRequest");
  });

  it("defaults to GET and encodes basic auth", () => {
    const request = parseCurl("curl -u demo:secret https://example.com/private");
    expect(request.method).toBe("GET");
    expect(request.headers[0]?.value.startsWith("Basic ")).toBe(true);
  });

  it("rejects a command that is not curl", () => {
    expect(() => parseCurl("wget https://example.com")).toThrow(/starts with curl/i);
  });
});

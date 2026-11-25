import { describe, expect, it } from "vitest";
import { jsonToYaml, yamlToJson } from "./convert";
import { yamlSamples } from "./samples";

describe("yaml conversion", () => {
  it("converts mappings, lists, and nested kubernetes manifests", () => {
    const json = yamlToJson(yamlSamples.kubernetes);
    const value = JSON.parse(json) as { kind: string; spec: { replicas: number; template: { spec: { containers: Array<{ name: string }> } } } };
    expect(value.kind).toBe("Deployment");
    expect(value.spec.replicas).toBe(2);
    expect(value.spec.template.spec.containers[0].name).toBe("api");
  });

  it("round-trips JSON through YAML", () => {
    const original = { name: "example", ports: [80, 443], on: true };
    const yaml = jsonToYaml(JSON.stringify(original));
    expect(yaml).toContain("name: example");
    expect(JSON.parse(yamlToJson(yaml))).toEqual(original);
  });

  it("parses the other samples", () => {
    for (const sample of Object.values(yamlSamples)) {
      expect(() => JSON.parse(yamlToJson(sample))).not.toThrow();
    }
  });
});

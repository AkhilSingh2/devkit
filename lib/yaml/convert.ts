import { parse, stringify } from "yaml";

export function yamlToJson(input: string, indent: 2 | 4 = 2): string {
  const value = parse(input);
  if (typeof value === "undefined") throw new Error("YAML document is empty.");
  return JSON.stringify(value, null, indent);
}

export function jsonToYaml(input: string): string {
  const value = JSON.parse(input) as unknown;
  return stringify(value);
}

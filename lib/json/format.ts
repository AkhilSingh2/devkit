export type FormatIndent = 2 | 4 | "tab";

export type JsonSuccess = {
  ok: true;
  value: unknown;
  formatted: string;
  minified: string;
};

export type JsonFailure = {
  ok: false;
  error: string;
  line?: number;
  column?: number;
};

export function parseJson(input: string): JsonSuccess | JsonFailure {
  try {
    const value = JSON.parse(input) as unknown;
    return {
      ok: true,
      value,
      formatted: JSON.stringify(value, null, 2),
      minified: JSON.stringify(value),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    const located = locateJsonError(input);
    return {
      ok: false,
      error: message,
      line: located?.line,
      column: located?.column,
    };
  }
}

export function locateJsonError(input: string): { index: number; line: number; column: number } | null {
  let index = 0;
  const fail = (): never => {
    const error = new Error("invalid json") as Error & { index: number };
    error.index = index;
    throw error;
  };
  const skip = () => {
    while (index < input.length && " \n\r\t".includes(input[index])) index += 1;
  };
  const parseValue = () => {
    skip();
    if (index >= input.length) fail();
    const char = input[index];
    if (char === "{") return parseObject();
    if (char === "[") return parseArray();
    if (char === '"') return parseString();
    if (char === "-" || (char >= "0" && char <= "9")) return parseNumber();
    if (input.startsWith("true", index) || input.startsWith("null", index)) {
      index += 4;
      return;
    }
    if (input.startsWith("false", index)) {
      index += 5;
      return;
    }
    fail();
  };
  const parseObject = () => {
    index += 1;
    skip();
    if (input[index] === "}") {
      index += 1;
      return;
    }
    while (index < input.length) {
      skip();
      if (input[index] !== '"') fail();
      parseString();
      skip();
      if (input[index] !== ":") fail();
      index += 1;
      parseValue();
      skip();
      if (input[index] === "}") {
        index += 1;
        return;
      }
      if (input[index] !== ",") fail();
      index += 1;
    }
    fail();
  };
  const parseArray = () => {
    index += 1;
    skip();
    if (input[index] === "]") {
      index += 1;
      return;
    }
    while (index < input.length) {
      parseValue();
      skip();
      if (input[index] === "]") {
        index += 1;
        return;
      }
      if (input[index] !== ",") fail();
      index += 1;
    }
    fail();
  };
  const parseString = () => {
    index += 1;
    while (index < input.length) {
      const char = input[index];
      if (char === '"') {
        index += 1;
        return;
      }
      if (char === "\\") {
        index += 2;
        continue;
      }
      if (char === "\n") fail();
      index += 1;
    }
    fail();
  };
  const parseNumber = () => {
    if (input[index] === "-") index += 1;
    if (input[index] === "0") index += 1;
    else if (input[index] >= "1" && input[index] <= "9") {
      while (input[index] >= "0" && input[index] <= "9") index += 1;
    } else fail();
    if (input[index] === ".") {
      index += 1;
      if (!(input[index] >= "0" && input[index] <= "9")) fail();
      while (input[index] >= "0" && input[index] <= "9") index += 1;
    }
    if (input[index] === "e" || input[index] === "E") {
      index += 1;
      if (input[index] === "+" || input[index] === "-") index += 1;
      if (!(input[index] >= "0" && input[index] <= "9")) fail();
      while (input[index] >= "0" && input[index] <= "9") index += 1;
    }
  };
  try {
    parseValue();
    skip();
    if (index !== input.length) fail();
    return null;
  } catch (error) {
    const at = typeof (error as { index?: number }).index === "number" ? (error as { index: number }).index : index;
    const upto = input.slice(0, at);
    const lines = upto.split("\n");
    return { index: at, line: lines.length, column: lines[lines.length - 1].length + 1 };
  }
}

export function formatJson(input: string, indent: FormatIndent = 2): JsonSuccess | JsonFailure {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  const space = indent === "tab" ? "\t" : indent;
  return {
    ...parsed,
    formatted: JSON.stringify(parsed.value, null, space),
  };
}

export function jsonErrorLabel(failure: JsonFailure): string {
  if (failure.line && failure.column) {
    return `${failure.error} (line ${failure.line}, column ${failure.column})`;
  }
  return failure.error;
}

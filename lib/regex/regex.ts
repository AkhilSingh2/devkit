export type RegexToken = { source: string; explanation: string };

export type RegexMatch = {
  index: number;
  value: string;
  groups: Array<string | undefined>;
};

const ESCAPES: Record<string, string> = {
  d: "a digit (0-9)",
  D: "a character that is not a digit",
  w: "a word character (letter, digit, or underscore)",
  W: "a character that is not a word character",
  s: "whitespace",
  S: "a character that is not whitespace",
  b: "a word boundary",
  B: "a position that is not a word boundary",
  n: "a newline",
  t: "a tab",
  r: "a carriage return",
  "0": "a null character",
};

export function explainRegex(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;
  while (i < pattern.length) {
    const char = pattern[i];
    if (char === "\\") {
      const next = pattern[i + 1] ?? "";
      tokens.push({ source: pattern.slice(i, i + 2), explanation: ESCAPES[next] ?? `the literal character "${next || "\\"}"` });
      i += next ? 2 : 1;
      continue;
    }
    if (char === "[") {
      const end = pattern.indexOf("]", i + 1);
      const slice = end === -1 ? pattern.slice(i) : pattern.slice(i, end + 1);
      const negated = pattern[i + 1] === "^";
      tokens.push({ source: slice, explanation: negated ? "any character not in this set" : "any one character in this set" });
      i += slice.length;
      continue;
    }
    if (char === "(") {
      if (pattern.startsWith("(?:", i)) {
        tokens.push({ source: "(?:", explanation: "start of a group that does not capture" });
        i += 3;
      } else if (pattern.startsWith("(?=", i)) {
        tokens.push({ source: "(?=", explanation: "start of a positive lookahead" });
        i += 3;
      } else if (pattern.startsWith("(?!", i)) {
        tokens.push({ source: "(?!", explanation: "start of a negative lookahead" });
        i += 3;
      } else {
        tokens.push({ source: "(", explanation: "start of a capturing group" });
        i += 1;
      }
      continue;
    }
    if (char === ")" ) {
      tokens.push({ source: ")", explanation: "end of the group" });
      i += 1;
      continue;
    }
    if (char === "{") {
      const end = pattern.indexOf("}", i);
      const slice = end === -1 ? "{" : pattern.slice(i, end + 1);
      tokens.push({ source: slice, explanation: quantifierText(slice) });
      i += slice.length;
      continue;
    }
    tokens.push({ source: char, explanation: single(char) });
    i += 1;
  }
  return tokens;
}

export function summariseRegex(pattern: string): string {
  const tokens = explainRegex(pattern);
  if (tokens.length === 0) return "Empty pattern. It matches the empty string.";
  return tokens.map((token) => token.explanation).join(", ") + ".";
}

function quantifierText(source: string): string {
  const match = /^\{(\d+)(,(\d+)?)?\}$/.exec(source);
  if (!match) return "a counted repeat";
  if (!match[2]) return `exactly ${match[1]} times`;
  if (!match[3]) return `at least ${match[1]} times`;
  return `between ${match[1]} and ${match[3]} times`;
}

function single(char: string): string {
  switch (char) {
    case ".":
      return "any character except a newline";
    case "^":
      return "the start of the text (or a line, with the m flag)";
    case "$":
      return "the end of the text (or a line, with the m flag)";
    case "*":
      return "repeat the previous item zero or more times";
    case "+":
      return "repeat the previous item one or more times";
    case "?":
      return "the previous item is optional";
    case "|":
      return "or";
    default:
      return `the literal character "${char}"`;
  }
}

export function testRegex(pattern: string, flags: string, text: string): { matches: RegexMatch[]; error?: string } {
  let expression: RegExp;
  try {
    expression = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  } catch (error) {
    return { matches: [], error: error instanceof Error ? error.message : "Invalid regular expression" };
  }
  const matches: RegexMatch[] = [];
  for (const match of text.matchAll(expression)) {
    if (match[0] === "" && expression.lastIndex === match.index) expression.lastIndex += 1;
    matches.push({ index: match.index ?? 0, value: match[0], groups: match.slice(1) });
    if (matches.length >= 200) break;
  }
  return { matches };
}

export const regexCheatSheet: Array<{ token: string; meaning: string }> = [
  { token: ".", meaning: "Any character except newline" },
  { token: "\\d \\w \\s", meaning: "Digit, word character, whitespace" },
  { token: "\\D \\W \\S", meaning: "Not a digit, word character, or whitespace" },
  { token: "^ $", meaning: "Start and end of the text" },
  { token: "* + ?", meaning: "Zero or more, one or more, optional" },
  { token: "{2,4}", meaning: "Between 2 and 4 times" },
  { token: "[abc] [^abc]", meaning: "One character from the set, or not in the set" },
  { token: "(abc) (?:abc)", meaning: "Capturing group, or a group that does not capture" },
  { token: "a|b", meaning: "a or b" },
  { token: "\\b", meaning: "Word boundary" },
  { token: "(?=a) (?!a)", meaning: "Followed by a, or not followed by a" },
  { token: "g i m s", meaning: "All matches, ignore case, multiline, dot matches newline" },
];

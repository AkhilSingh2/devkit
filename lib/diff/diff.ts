export type DiffOp = {
  type: "equal" | "insert" | "delete";
  text: string;
  left?: number;
  right?: number;
};

export type SideRow = {
  left?: { text: string; type: "equal" | "delete"; line: number };
  right?: { text: string; type: "equal" | "insert"; line: number };
};

export function diffLines(left: string, right: string): DiffOp[] {
  const a = splitLines(left);
  const b = splitLines(right);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (endA >= start && endB >= start && a[endA] === b[endB]) {
    endA -= 1;
    endB -= 1;
  }
  const prefix: DiffOp[] = a.slice(0, start).map((text, index) => ({
    type: "equal",
    text,
    left: index + 1,
    right: index + 1,
  }));
  const middle = diffMiddle(a.slice(start, endA + 1), b.slice(start, endB + 1), start + 1, start + 1);
  const suffixStart = endA + 1;
  const suffix: DiffOp[] = a.slice(suffixStart).map((text, index) => ({
    type: "equal",
    text,
    left: suffixStart + index + 1,
    right: endB + 1 + index + 1,
  }));
  return [...prefix, ...middle, ...suffix];
}

export function sideBySide(ops: DiffOp[]): SideRow[] {
  const rows: SideRow[] = [];
  let index = 0;
  while (index < ops.length) {
    const op = ops[index];
    if (op.type === "equal") {
      rows.push({
        left: { text: op.text, type: "equal", line: op.left ?? 0 },
        right: { text: op.text, type: "equal", line: op.right ?? 0 },
      });
      index += 1;
      continue;
    }
    const deleted: DiffOp[] = [];
    const inserted: DiffOp[] = [];
    while (index < ops.length && ops[index].type === "delete") deleted.push(ops[index++]);
    while (index < ops.length && ops[index].type === "insert") inserted.push(ops[index++]);
    const length = Math.max(deleted.length, inserted.length);
    for (let row = 0; row < length; row += 1) {
      rows.push({
        left: deleted[row] ? { text: deleted[row].text, type: "delete", line: deleted[row].left ?? 0 } : undefined,
        right: inserted[row] ? { text: inserted[row].text, type: "insert", line: inserted[row].right ?? 0 } : undefined,
      });
    }
  }
  return rows;
}

export function diffStats(ops: DiffOp[]): { added: number; removed: number } {
  return {
    added: ops.filter((op) => op.type === "insert").length,
    removed: ops.filter((op) => op.type === "delete").length,
  };
}

function splitLines(input: string): string[] {
  if (input === "") return [];
  return input.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
}

function diffMiddle(a: string[], b: string[], leftStart: number, rightStart: number): DiffOp[] {
  if (a.length * b.length > 1_000_000) {
    return [
      ...a.map((text, index) => ({ type: "delete" as const, text, left: leftStart + index })),
      ...b.map((text, index) => ({ type: "insert" as const, text, right: rightStart + index })),
    ];
  }
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", text: a[i], left: leftStart + i, right: rightStart + j });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "delete", text: a[i], left: leftStart + i });
      i += 1;
    } else {
      ops.push({ type: "insert", text: b[j], right: rightStart + j });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: "delete", text: a[i], left: leftStart + i });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: "insert", text: b[j], right: rightStart + j });
    j += 1;
  }
  return ops;
}

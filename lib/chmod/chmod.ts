export type Triad = [boolean, boolean, boolean];

export type PermissionState = {
  user: Triad;
  group: Triad;
  other: Triad;
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
};

const EMPTY: Triad = [false, false, false];

export function emptyPermissions(): PermissionState {
  return { user: [...EMPTY], group: [...EMPTY], other: [...EMPTY], setuid: false, setgid: false, sticky: false };
}

export function fromOctal(input: string): PermissionState {
  const digits = input.trim().replace(/^0o/i, "");
  if (!/^[0-7]{3,4}$/.test(digits)) throw new Error("Use a 3 or 4 digit octal mode such as 755 or 0644.");
  const padded = digits.padStart(4, "0");
  const special = Number(padded[0]);
  return {
    setuid: Boolean(special & 4),
    setgid: Boolean(special & 2),
    sticky: Boolean(special & 1),
    user: triad(Number(padded[1])),
    group: triad(Number(padded[2])),
    other: triad(Number(padded[3])),
  };
}

export function toOctal(state: PermissionState, forceSpecial = false): string {
  const special = (state.setuid ? 4 : 0) + (state.setgid ? 2 : 0) + (state.sticky ? 1 : 0);
  const body = `${digit(state.user)}${digit(state.group)}${digit(state.other)}`;
  return special || forceSpecial ? `${special}${body}` : body;
}

export function toSymbolic(state: PermissionState): string {
  return [
    triadSymbol(state.user, state.setuid, "s", "S"),
    triadSymbol(state.group, state.setgid, "s", "S"),
    triadSymbol(state.other, state.sticky, "t", "T"),
  ].join("");
}

export function describeMode(state: PermissionState): string {
  const who = [
    ["owner", state.user],
    ["group", state.group],
    ["others", state.other],
  ] as const;
  const lines = who.map(([name, bits]) => `${name}: ${bits[0] ? "read" : "no read"}, ${bits[1] ? "write" : "no write"}, ${bits[2] ? "execute" : "no execute"}`);
  if (state.setuid) lines.push("setuid: the file runs as its owner");
  if (state.setgid) lines.push("setgid: the file runs as its group, or new files inherit the directory group");
  if (state.sticky) lines.push("sticky: only the owner can rename or delete files in this directory");
  return lines.join("\n");
}

function triad(value: number): Triad {
  return [Boolean(value & 4), Boolean(value & 2), Boolean(value & 1)];
}

function digit(bits: Triad): number {
  return (bits[0] ? 4 : 0) + (bits[1] ? 2 : 0) + (bits[2] ? 1 : 0);
}

function triadSymbol(bits: Triad, special: boolean, on: string, off: string): string {
  const read = bits[0] ? "r" : "-";
  const write = bits[1] ? "w" : "-";
  const exec = bits[2] ? (special ? on : "x") : special ? off : "-";
  return read + write + exec;
}

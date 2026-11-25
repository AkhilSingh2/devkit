export type DecodedJwt = {
  header: unknown;
  payload: unknown;
  signature: string;
  expiresAt: number | null;
  issuedAt: number | null;
};

export function decodeJwt(token: string): DecodedJwt {
  const trimmed = token.trim().replace(/^Bearer\s+/i, "");
  const parts = trimmed.split(".");
  if (parts.length < 2 || parts.length > 3) {
    throw new Error("A JWT has two or three base64url parts separated by dots.");
  }
  const header = JSON.parse(decodeBase64Url(parts[0])) as unknown;
  const payload = JSON.parse(decodeBase64Url(parts[1])) as unknown;
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  return {
    header,
    payload,
    signature: parts[2] ?? "",
    expiresAt: typeof record.exp === "number" ? record.exp * 1000 : null,
    issuedAt: typeof record.iat === "number" ? record.iat * 1000 : null,
  };
}

export function jwtExpiry(expiresAt: number | null, now = Date.now()): { label: string; expired: boolean } | null {
  if (expiresAt === null) return null;
  const delta = expiresAt - now;
  if (delta <= 0) return { label: "Expired", expired: true };
  const total = Math.floor(delta / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts = [
    days ? `${days}d` : "",
    hours || days ? `${hours}h` : "",
    `${minutes}m`,
    `${seconds}s`,
  ].filter(Boolean);
  return { label: parts.join(" "), expired: false };
}

export function encodeJwtPart(value: unknown): string {
  return encodeBase64Url(JSON.stringify(value));
}

export function sampleJwt(now = Date.now()): string {
  const header = encodeJwtPart({ alg: "HS256", typ: "JWT" });
  const payload = encodeJwtPart({
    sub: "usr_demo",
    name: "Example User",
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 60 * 60 * 24 * 30,
  });
  return `${header}.${payload}.demo-signature-not-verified`;
}

function decodeBase64Url(input: string): string {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

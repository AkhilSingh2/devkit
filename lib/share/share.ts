export type SharePayload = { v: 1; tool: string; data: unknown };

const MAX_HASH = 80_000;

export function encodeShare(payload: SharePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return `d=${bytesToBase64Url(bytes)}`;
}

export function decodeShare(hash: string): SharePayload | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith("d=")) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(raw.slice(2)));
    const value = JSON.parse(json) as SharePayload;
    if (!value || value.v !== 1 || typeof value.tool !== "string") return null;
    return value;
  } catch {
    return null;
  }
}

export function shareTooLarge(payload: SharePayload): boolean {
  return encodeShare(payload).length > MAX_HASH;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

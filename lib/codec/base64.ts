export function encodeBase64(input: string): string {
  return bytesToBase64(new TextEncoder().encode(input));
}

export function decodeBase64(input: string): string {
  return new TextDecoder().decode(base64ToBytes(input.trim()));
}

export function encodeBase64Url(input: string): string {
  return encodeBase64(input).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export function decodeBase64Url(input: string): string {
  return new TextDecoder().decode(base64ToBytes(input.trim().replaceAll("-", "+").replaceAll("_", "/")));
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(input: string): Uint8Array {
  const compact = input.replace(/\s/g, "");
  const padded = compact + "=".repeat((4 - (compact.length % 4)) % 4);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) {
    throw new Error("Input is not valid base64.");
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const HASH_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export async function hashBytes(algorithm: HashAlgorithm, data: BufferSource): Promise<{ hex: string; base64: string }> {
  const digest = await crypto.subtle.digest(algorithm, data);
  const bytes = new Uint8Array(digest);
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { hex, base64: btoa(binary) };
}

export async function hashText(algorithm: HashAlgorithm, text: string): Promise<{ hex: string; base64: string }> {
  return hashBytes(algorithm, new TextEncoder().encode(text));
}

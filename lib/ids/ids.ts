const URL_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function uuid(): string {
  return crypto.randomUUID();
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

export function nanoid(size = 21, alphabet = URL_ALPHABET): string {
  if (!Number.isInteger(size) || size < 1 || size > 128) throw new Error("Length must be between 1 and 128.");
  if (alphabet.length < 2) throw new Error("Alphabet needs at least two characters.");
  const mask = (2 << Math.floor(Math.log(alphabet.length - 1) / Math.LN2)) - 1;
  const step = Math.ceil((1.6 * mask * size) / alphabet.length);
  let id = "";
  while (id.length < size) {
    const bytes = crypto.getRandomValues(new Uint8Array(step));
    for (let i = 0; i < bytes.length && id.length < size; i += 1) {
      const index = bytes[i] & mask;
      if (index < alphabet.length) id += alphabet[index];
    }
  }
  return id;
}

export function ulid(time = Date.now(), randomness?: Uint8Array): string {
  if (!Number.isInteger(time) || time < 0 || time > 2 ** 48 - 1) {
    throw new Error("ULID time must be a positive millisecond timestamp that fits in 48 bits.");
  }
  const random = randomness ?? crypto.getRandomValues(new Uint8Array(10));
  if (random.length !== 10) throw new Error("ULID randomness is 10 bytes.");
  let remaining = time;
  const timeChars = Array.from({ length: 10 }, () => "0");
  for (let i = 9; i >= 0; i -= 1) {
    timeChars[i] = CROCKFORD[remaining % 32];
    remaining = Math.floor(remaining / 32);
  }
  let bits = 0;
  let value = 0;
  let randomChars = "";
  for (const byte of random) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      randomChars += CROCKFORD[(value >>> bits) & 31];
    }
  }
  return timeChars.join("") + randomChars;
}

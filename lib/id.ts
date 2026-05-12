/** Tiny URL-safe ID generator (12 chars, ~70 bits entropy — enough for personal use). */
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"

export function id(length = 12): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("crypto.getRandomValues is required")
  }
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ""
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] & 63]
  return out
}

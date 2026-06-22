export async function encryptText(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: bytes(iv) }, key, new TextEncoder().encode(text));
  return JSON.stringify({
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted))
  });
}

export async function decryptText(payload: string, password: string): Promise<string> {
  const parsed = JSON.parse(payload) as { salt: string; iv: string; data: string };
  const salt = fromBase64(parsed.salt);
  const iv = fromBase64(parsed.iv);
  const key = await deriveKey(password, salt);
  const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(iv) }, key, bytes(fromBase64(parsed.data)));
  return new TextDecoder().decode(clear);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: bytes(salt), iterations: 210_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

function bytes(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

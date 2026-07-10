import { createHash } from "crypto";

export async function sha256(input: File | Buffer | ArrayBuffer): Promise<string> {
  let buffer: Buffer;
  if (input instanceof File) {
    buffer = Buffer.from(await input.arrayBuffer());
  } else if (input instanceof ArrayBuffer) {
    buffer = Buffer.from(input);
  } else {
    buffer = input;
  }
  const hash = createHash("sha256").update(buffer).digest("hex");
  return `0x${hash}`;
}

export function normalizeHash(hash: string): string {
  const cleaned = hash.replace(/^0x/i, "").toLowerCase();
  return `0x${cleaned}`;
}

export function hashesMatch(a: string, b: string): boolean {
  return normalizeHash(a) === normalizeHash(b);
}

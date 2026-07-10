export async function sha256(input: File | Buffer | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;
  if (input instanceof File) {
    buffer = await input.arrayBuffer();
  } else if (input instanceof Buffer) {
    buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  } else {
    buffer = input;
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "documents");

export async function saveDocument(file: File): Promise<{ url: string; localPath: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const localPath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(localPath, buffer);
  const url = `/api/files/${filename}`;
  return { url, localPath };
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

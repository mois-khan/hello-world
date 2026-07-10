import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getUploadDir } from "@/lib/storage";
import { fail } from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safe = path.basename(filename);
    const filePath = path.join(getUploadDir(), safe);
    const buffer = await readFile(filePath);
    const ext = safe.split(".").pop()?.toLowerCase();
    const mime =
      ext === "pdf" ? "application/pdf" :
      ext === "png" ? "image/png" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      "application/octet-stream";
    return new Response(buffer, { headers: { "Content-Type": mime } });
  } catch {
    return fail("File not found", 404);
  }
}

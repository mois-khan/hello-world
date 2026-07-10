import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { sha256 } from "@/lib/hash";
import { saveDocument } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const parcelIdStr = form.get("parcelId") as string | null;
    if (!file) return fail("file is required");

    const { url } = await saveDocument(file);
    const hash = await sha256(file);

    if (parcelIdStr) {
      const parcelId = parseInt(parcelIdStr, 10);
      const doc = await prisma.document.create({
        data: {
          parcelId,
          storageUrl: url,
          sha256: hash,
          uploadedBy: "system",
        },
      });
      await prisma.parcelMeta.update({
        where: { id: parcelId },
        data: { currentDocId: doc.id },
      });
    }

    return ok({ url, sha256: hash });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Upload failed", 500);
  }
}

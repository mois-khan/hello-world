import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { buildAiReport } from "@/lib/fraud";
import { prisma } from "@/lib/db";
import { getParcel } from "@/lib/chain";
import { ensureSeeded } from "@/lib/seed";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { documentId, url, parcelId } = body as {
      documentId?: string;
      url?: string;
      parcelId?: number;
    };

    let sha256Value: string | undefined;
    let docParcelId = parcelId;

    if (documentId) {
      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) return fail("Document not found", 404);
      sha256Value = doc.sha256;
      docParcelId = doc.parcelId;
    } else if (url) {
      const doc = await prisma.document.findFirst({ where: { storageUrl: url } });
      sha256Value = doc?.sha256;
      docParcelId = doc?.parcelId ?? parcelId;
    } else {
      return fail("documentId or url required");
    }

    if (!sha256Value) return fail("Could not resolve document hash");

    let onChainHash: string | null = null;
    if (docParcelId) {
      const parcel = await getParcel(docParcelId);
      onChainHash = parcel?.documentHash ?? null;
    }

    // Get the storage URL to pass to Gemini
    let docUrl = url;
    if (documentId) {
      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (doc) docUrl = doc.storageUrl;
    }

    const report = await buildAiReport(sha256Value, onChainHash, docUrl);

    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: { aiReport: JSON.stringify(report) },
      });
    }

    return ok(report);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "AI verification failed", 500);
  }
}

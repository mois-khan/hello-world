import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getHistory } from "@/lib/chain";
import { mergeParcelWithMeta, findParcelIdByUlpin } from "@/lib/seed";
import { ensureSeeded } from "@/lib/seed";
import type { AiReport } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await params;
    let parcelId = parseInt(id, 10);
    if (isNaN(parcelId)) {
      const byUlpin = await findParcelIdByUlpin(id);
      if (!byUlpin) return fail("Parcel not found", 404);
      parcelId = byUlpin;
    }

    const parcel = await mergeParcelWithMeta(parcelId);
    if (!parcel) return fail("Parcel not found", 404);

    const user = await prisma.user.findUnique({ where: { wallet: parcel.owner } });
    if (user && user.name) {
      parcel.ownerName = user.name;
    }

    const meta = await prisma.parcelMeta.findUnique({ where: { id: parcelId } });
    const history = await getHistory(parcelId);

    let document: { url: string; sha256: string; aiReport: AiReport | null } | null = null;
    if (meta?.currentDocId) {
      const doc = await prisma.document.findUnique({ where: { id: meta.currentDocId } });
      if (doc) {
        document = {
          url: doc.storageUrl,
          sha256: doc.sha256,
          aiReport: doc.aiReport ? (JSON.parse(doc.aiReport) as AiReport) : null,
        };
      }
    }

    return ok({
      parcel,
      meta: meta
        ? {
            id: meta.id,
            surveyNumber: meta.surveyNumber,
            district: meta.district,
            addressText: meta.addressText,
            lat: meta.lat,
            lng: meta.lng,
            area: meta.area,
            currentDocId: meta.currentDocId,
            ulpin: meta.ulpin ?? undefined,
            ownerWallet: meta.ownerWallet,
          }
        : null,
      document,
      history,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to get parcel", 500);
  }
}

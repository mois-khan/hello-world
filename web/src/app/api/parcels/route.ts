import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { mergeParcelWithMeta } from "@/lib/seed";
import { ensureSeeded } from "@/lib/seed";
import type { Parcel } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();
    const owner = searchParams.get("owner")?.toLowerCase();
    const district = searchParams.get("district")?.toLowerCase();

    const metas = await prisma.parcelMeta.findMany();
    const simParcels = await prisma.simParcel.findMany();
    
    const allParcelIds = Array.from(new Set([
      ...metas.map(m => m.id),
      ...simParcels.map(sp => sp.id)
    ]));

    const parcels: Parcel[] = [];

    // Fetch all chain data in parallel to avoid sequential blocking
    const mergedResults = await Promise.all(
      allParcelIds.map(id => mergeParcelWithMeta(id))
    );

    for (const merged of mergedResults) {
      if (!merged) continue;
      if (owner && merged.owner.toLowerCase() !== owner) continue;
      if (district && !merged.district.toLowerCase().includes(district)) continue;
      if (q) {
        const hay = `${merged.surveyNumber} ${merged.district} ${merged.ulpin ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      parcels.push(merged as Parcel);
    }

    return ok(parcels);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list parcels", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { parcelId, surveyNumber, district, addressText, lat, lng, area, ownerWallet, docUrl, sha256: docHash } = body;

    const meta = await prisma.parcelMeta.upsert({
      where: { id: parcelId },
      create: {
        id: parcelId,
        surveyNumber,
        district,
        addressText,
        lat,
        lng,
        area,
        ownerWallet: ownerWallet.toLowerCase(),
      },
      update: { surveyNumber, district, addressText, lat, lng, area, ownerWallet: ownerWallet.toLowerCase() },
    });

    if (docUrl && docHash) {
      const doc = await prisma.document.create({
        data: {
          parcelId,
          storageUrl: docUrl,
          sha256: docHash,
          uploadedBy: ownerWallet,
        },
      });
      await prisma.parcelMeta.update({ where: { id: parcelId }, data: { currentDocId: doc.id } });
    }

    return ok(meta);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create parcel meta", 500);
  }
}

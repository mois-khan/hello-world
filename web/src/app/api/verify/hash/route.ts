import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get("hash");

  if (!hash) {
    return fail("hash parameter is required", 400);
  }

  try {
    let doc = await prisma.document.findFirst({
      where: { sha256: hash },
      orderBy: { createdAt: "desc" },
    });

    let parcelId = doc?.parcelId;
    let createdAt = doc?.createdAt;

    if (!doc) {
      const simParcel = await prisma.simParcel.findFirst({
        where: { documentHash: hash },
      });
      if (simParcel) {
        parcelId = simParcel.id;
        createdAt = new Date(Number(simParcel.registeredAt));
      }
    }

    if (!parcelId) {
      return ok({ exists: false });
    }

    const parcelMeta = await prisma.parcelMeta.findUnique({
      where: { id: parcelId }
    });

    return ok({
      exists: true,
      parcelId: parcelId,
      ulpin: parcelMeta?.ulpin,
      createdAt: createdAt,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Internal error", 500);
  }
}


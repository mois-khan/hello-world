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
    const doc = await prisma.document.findFirst({
      where: { sha256: hash },
      orderBy: { createdAt: "desc" },
    });

    if (!doc) {
      return ok({ exists: false });
    }

    const parcelMeta = await prisma.parcelMeta.findUnique({
      where: { id: doc.parcelId }
    });

    return ok({
      exists: true,
      parcelId: doc.parcelId,
      ulpin: parcelMeta?.ulpin,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Internal error", 500);
  }
}


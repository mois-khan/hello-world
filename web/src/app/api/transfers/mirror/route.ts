import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { scanTransfer } from "@/lib/fraud";
import { ensureSeeded } from "@/lib/seed";
import type { TransferStatus } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { transferId, parcelId, seller, buyer, status, newDocumentHash } = body as {
      transferId: number;
      parcelId: number;
      seller: string;
      buyer: string;
      status: TransferStatus;
      newDocumentHash?: string;
    };

    const meta = await prisma.transferMeta.upsert({
      where: { id: transferId },
      create: {
        id: transferId,
        parcelId,
        seller: seller.toLowerCase(),
        buyer: buyer.toLowerCase(),
        status,
        newDocumentHash: newDocumentHash ?? null,
      },
      update: { status, newDocumentHash: newDocumentHash ?? undefined },
    });

    await scanTransfer(transferId);
    return ok({
      id: meta.id,
      parcelId: meta.parcelId,
      seller: meta.seller,
      buyer: meta.buyer,
      newDocumentHash: meta.newDocumentHash ?? "",
      status: meta.status as TransferStatus,
      createdAt: Math.floor(meta.createdAt.getTime() / 1000),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to mirror transfer", 500);
  }
}

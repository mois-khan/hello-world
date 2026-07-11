import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import * as sim from "@/lib/simulator";
import { scanTransfer } from "@/lib/fraud";
import { prisma } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "initiate": {
        const { seller, sellerName, parcelId, buyer, buyerName, newDocumentHash } = body;
        const result = await sim.simInitiateTransfer(seller, parcelId, buyer, newDocumentHash);
        await prisma.transferMeta.upsert({
          where: { id: result.transferId },
          create: {
            id: result.transferId,
            parcelId,
            seller: seller.toLowerCase(),
            sellerName,
            buyer: buyer.toLowerCase(),
            buyerName,
            status: "PendingBuyer",
            newDocumentHash,
          },
          update: { status: "PendingBuyer" },
        });
        await scanTransfer(result.transferId);
        await logAudit(seller, "TRANSFER_INITIATE", parcelId.toString(), JSON.stringify({ buyer, transferId: result.transferId }));
        return ok(result);
      }
      case "buyerApprove": {
        const { buyer, transferId, finalDocumentHash } = body;
        const result = await sim.simBuyerApprove(buyer, transferId, finalDocumentHash);
        await prisma.transferMeta.update({
          where: { id: transferId },
          data: { status: "PendingRegistrar", newDocumentHash: finalDocumentHash },
        });
        await logAudit(buyer, "TRANSFER_APPROVE", transferId.toString());
        return ok(result);
      }
      case "registrarFinalize": {
        const { registrar, transferId, finalDocumentHash } = body;
        const result = await sim.simRegistrarFinalize(registrar, transferId, finalDocumentHash);
        const t = await prisma.transferMeta.findUnique({ where: { id: transferId } });
        if (t) {
          const timestamp = Date.now();
          const dataToHash = `${transferId}${t.seller}${t.buyer}${t.parcelId}${timestamp}${result.txHash}`;
          const verificationHash = crypto.createHash("sha256").update(dataToHash).digest("hex");
          
          await prisma.transferMeta.update({ 
            where: { id: transferId }, 
            data: { status: "Completed", verificationHash } 
          });
          await prisma.parcelMeta.update({
            where: { id: t.parcelId },
            data: { ownerWallet: t.buyer },
          });
          await logAudit(registrar, "TRANSFER_FINALIZE", transferId.toString(), JSON.stringify({ verificationHash }));
        }
        return ok(result);
      }
      case "reject": {
        const { actor, transferId, reason } = body;
        const result = await sim.simRejectTransfer(actor, transferId, reason);
        await prisma.transferMeta.update({ where: { id: transferId }, data: { status: "Rejected", rejectionReason: reason } });
        await logAudit(actor, "TRANSFER_REJECT", transferId.toString(), JSON.stringify({ reason }));
        return ok(result);
      }
      case "register": {
        const { owner, surveyNumber, district, geo, area, documentHash, parcelId, ulpin } = body;
        const result = await sim.simRegisterParcel({
          owner,
          surveyNumber,
          district,
          geo,
          area,
          documentHash,
          parcelId,
        });
        const [lat, lng] = geo.split(",").map(Number);
        await prisma.parcelMeta.upsert({
          where: { id: result.parcelId },
          create: {
            id: result.parcelId,
            ulpin,
            surveyNumber,
            district,
            addressText: `${district}`,
            lat: lat || 0,
            lng: lng || 0,
            area,
            ownerWallet: owner.toLowerCase(),
          },
          update: { ownerWallet: owner.toLowerCase(), ulpin },
        });
        await logAudit(owner, "PARCEL_REGISTER", result.parcelId.toString());
        return ok(result);
      }
      default:
        return fail(`Unknown action: ${action}`);
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Chain action failed", 500);
  }
}

export async function GET() {
  const available = await sim.isChainAvailable();
  return ok({ mode: available && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? "hardhat" : "simulator" });
}

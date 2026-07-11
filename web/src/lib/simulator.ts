import type {
  Parcel,
  TransferRequest,
  TimelineEvent,
  ParcelStatus,
  TransferStatus,
} from "./types";
import { parcelStatusFromChain, transferStatusFromChain } from "./types";
import { prisma } from "./db";

let nextParcelId = 1;
let nextTransferId = 1;

async function ensureCounters() {
  const maxParcel = await prisma.simParcel.aggregate({ _max: { id: true } });
  const maxTransfer = await prisma.simTransfer.aggregate({ _max: { id: true } });
  nextParcelId = Math.max(1, (maxParcel._max.id ?? 0) + 1);
  nextTransferId = Math.max(1, (maxTransfer._max.id ?? 0) + 1);
}

export async function simRegisterParcel(args: {
  owner: string;
  surveyNumber: string;
  district: string;
  geo: string;
  area: number;
  documentHash: string;
  parcelId?: number;
}): Promise<{ parcelId: number; txHash: string }> {
  await ensureCounters();
  const id = args.parcelId ?? nextParcelId++;
  const now = Math.floor(Date.now() / 1000);
  await prisma.simParcel.upsert({
    where: { id },
    create: {
      id,
      surveyNumber: args.surveyNumber,
      district: args.district,
      geo: args.geo,
      area: args.area,
      documentHash: args.documentHash,
      registeredAt: now,
      status: "Active",
      ownerWallet: args.owner.toLowerCase(),
    },
    update: {
      surveyNumber: args.surveyNumber,
      district: args.district,
      geo: args.geo,
      area: args.area,
      documentHash: args.documentHash,
      status: "Active",
      ownerWallet: args.owner.toLowerCase(),
    },
  });
  const txHash = `sim-register-${id}-${now}`;
  await prisma.chainEvent.create({
    data: {
      parcelId: id,
      type: "REGISTERED",
      toAddr: args.owner.toLowerCase(),
      txHash,
      blockNum: now,
      at: now,
    },
  });
  return { parcelId: id, txHash };
}

export async function simInitiateTransfer(
  seller: string,
  parcelId: number,
  buyer: string,
  newDocumentHash: string
): Promise<{ transferId: number; txHash: string }> {
  await ensureCounters();
  const parcel = await prisma.simParcel.findUnique({ where: { id: parcelId } });
  if (!parcel) throw new Error("Parcel not found");
  if (parcel.ownerWallet !== seller.toLowerCase()) throw new Error("Not owner");
  if (parcel.status === "InTransfer") throw new Error("Parcel busy");

  const active = await prisma.simTransfer.findFirst({
    where: { parcelId, status: { in: ["PendingBuyer", "PendingRegistrar"] } },
  });
  if (active) throw new Error("Parcel busy");

  const tid = nextTransferId++;
  const now = Math.floor(Date.now() / 1000);
  await prisma.simTransfer.create({
    data: {
      id: tid,
      parcelId,
      seller: seller.toLowerCase(),
      buyer: buyer.toLowerCase(),
      newDocumentHash,
      status: "PendingBuyer",
      createdAt: now,
    },
  });
  await prisma.simParcel.update({ where: { id: parcelId }, data: { status: "InTransfer" } });
  const txHash = `sim-init-${tid}`;
  await prisma.chainEvent.create({
    data: {
      parcelId,
      transferId: tid,
      type: "INITIATED",
      fromAddr: seller.toLowerCase(),
      toAddr: buyer.toLowerCase(),
      txHash,
      blockNum: now,
      at: now,
    },
  });
  return { transferId: tid, txHash };
}

export async function simBuyerApprove(buyer: string, transferId: number, finalDocumentHash: string): Promise<{ txHash: string }> {
  const t = await prisma.simTransfer.findUnique({ where: { id: transferId } });
  if (!t || t.status !== "PendingBuyer") throw new Error("Wrong state");
  if (t.buyer !== buyer.toLowerCase()) throw new Error("Not buyer");
  const now = Math.floor(Date.now() / 1000);
  await prisma.simTransfer.update({ where: { id: transferId }, data: { status: "PendingRegistrar", newDocumentHash: finalDocumentHash } });
  const txHash = `sim-buyer-${transferId}`;
  await prisma.chainEvent.create({
    data: {
      parcelId: t.parcelId,
      transferId,
      type: "APPROVED",
      toAddr: buyer.toLowerCase(),
      txHash,
      blockNum: now,
      at: now,
      fromAddr: "buyer",
    },
  });
  return { txHash };
}

export async function simRegistrarFinalize(registrar: string, transferId: number, finalDocumentHash?: string): Promise<{ txHash: string }> {
  const t = await prisma.simTransfer.findUnique({ where: { id: transferId } });
  if (!t || t.status !== "PendingRegistrar") throw new Error("Wrong state");
  const now = Math.floor(Date.now() / 1000);
  
  const finalHash = finalDocumentHash || t.newDocumentHash;

  await prisma.simTransfer.update({ where: { id: transferId }, data: { status: "Completed", newDocumentHash: finalHash } });
  await prisma.simParcel.update({
    where: { id: t.parcelId },
    data: {
      status: "Active",
      ownerWallet: t.buyer,
      documentHash: finalHash,
    },
  });
  const txHash = `sim-finalize-${transferId}`;
  await prisma.chainEvent.create({
    data: {
      parcelId: t.parcelId,
      transferId,
      type: "TRANSFERRED",
      fromAddr: t.seller,
      toAddr: t.buyer,
      txHash,
      blockNum: now,
      at: now,
    },
  });
  return { txHash };
}

export async function simRejectTransfer(
  actor: string,
  transferId: number,
  reason: string
): Promise<{ txHash: string }> {
  const t = await prisma.simTransfer.findUnique({ where: { id: transferId } });
  if (!t) throw new Error("Transfer not found");
  if (!["PendingBuyer", "PendingRegistrar"].includes(t.status)) throw new Error("Cannot reject");
  const now = Math.floor(Date.now() / 1000);
  await prisma.simTransfer.update({ where: { id: transferId }, data: { status: "Rejected" } });
  await prisma.simParcel.update({ where: { id: t.parcelId }, data: { status: "Active" } });
  const txHash = `sim-reject-${transferId}`;
  await prisma.chainEvent.create({
    data: {
      parcelId: t.parcelId,
      transferId,
      type: "REJECTED",
      fromAddr: actor.toLowerCase(),
      toAddr: reason,
      txHash,
      blockNum: now,
      at: now,
    },
  });
  return { txHash };
}

export async function simGetParcel(id: number): Promise<Parcel | null> {
  const p = await prisma.simParcel.findUnique({ where: { id } });
  if (!p) return null;
  const meta = await prisma.parcelMeta.findUnique({ where: { id } });
  return {
    id: p.id,
    surveyNumber: p.surveyNumber,
    district: p.district,
    geo: p.geo,
    area: p.area,
    documentHash: p.documentHash,
    registeredAt: p.registeredAt,
    status: p.status as ParcelStatus,
    owner: p.ownerWallet,
    ulpin: meta?.ulpin ?? undefined,
  };
}

export async function simOwnerOf(id: number): Promise<string> {
  const p = await prisma.simParcel.findUnique({ where: { id } });
  if (!p) throw new Error("Parcel not found");
  return p.ownerWallet;
}

export async function simGetTransfer(id: number): Promise<TransferRequest | null> {
  const t = await prisma.simTransfer.findUnique({ where: { id } });
  if (!t) return null;
  return {
    id: t.id,
    parcelId: t.parcelId,
    seller: t.seller,
    buyer: t.buyer,
    newDocumentHash: t.newDocumentHash,
    status: t.status as TransferStatus,
    createdAt: t.createdAt,
  };
}

export async function simActiveTransferOf(parcelId: number): Promise<number> {
  const t = await prisma.simTransfer.findFirst({
    where: {
      parcelId,
      status: { in: ["PendingBuyer", "PendingRegistrar"] },
    },
  });
  return t?.id ?? 0;
}

export async function simGetHistory(parcelId: number): Promise<TimelineEvent[]> {
  const events = await prisma.chainEvent.findMany({
    where: { parcelId },
    orderBy: { at: "asc" },
  });
  return events.map((e) => ({
    type: e.type as TimelineEvent["type"],
    from: e.fromAddr ?? undefined,
    to: e.toAddr ?? "",
    at: e.at,
    txHash: e.txHash,
    role: e.fromAddr === "buyer" ? "buyer" : undefined,
    reason: e.type === "REJECTED" ? e.toAddr ?? undefined : undefined,
  }));
}

export async function simListParcelsByOwner(owner: string): Promise<Parcel[]> {
  const rows = await prisma.simParcel.findMany({
    where: { ownerWallet: owner.toLowerCase() },
  });
  const parcels: Parcel[] = [];
  for (const p of rows) {
    const full = await simGetParcel(p.id);
    if (full) parcels.push(full);
  }
  return parcels;
}

export async function simListTransfers(filter?: {
  wallet?: string;
  role?: string;
}): Promise<TransferRequest[]> {
  const where: Record<string, unknown> = {};
  if (filter?.wallet) {
    const w = filter.wallet.toLowerCase();
    if (filter.role === "REGISTRAR") {
      where.status = "PendingRegistrar";
    } else {
      where.OR = [{ seller: w }, { buyer: w }];
    }
  }
  const rows = await prisma.simTransfer.findMany({ where, orderBy: { createdAt: "desc" } });
  return rows.map((t) => ({
    id: t.id,
    parcelId: t.parcelId,
    seller: t.seller,
    buyer: t.buyer,
    newDocumentHash: t.newDocumentHash,
    status: t.status as TransferStatus,
    createdAt: t.createdAt,
  }));
}

export async function isChainAvailable(): Promise<boolean> {
  const rpc = process.env.NEXT_PUBLIC_CHAIN_RPC;
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!rpc || !address) return false;
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function parcelStatusFromSim(status: string): ParcelStatus {
  return parcelStatusFromChain(status === "InTransfer" ? 1 : 0);
}

export function transferStatusFromSim(status: string): TransferStatus {
  const map: Record<string, number> = {
    None: 0,
    PendingBuyer: 1,
    PendingRegistrar: 2,
    Completed: 3,
    Rejected: 4,
  };
  return transferStatusFromChain(map[status] ?? 0);
}

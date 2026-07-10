import { prisma } from "./db";
import * as sim from "./simulator";

import { DEMO_WALLETS } from "./demo-constants";

const SEED_PARCELS = [
  {
    id: 1,
    ulpin: "29KA0482017452",
    surveyNumber: "142/2A",
    district: "Medak",
    addressText: "Village Shankarpally, Medak, Telangana",
    lat: 17.75,
    lng: 78.05,
    area: 8094,
    ownerWallet: DEMO_WALLETS.seller,
    documentHash: "0x" + "a".repeat(64),
  },
  {
    id: 2,
    ulpin: "27MH1234056789",
    surveyNumber: "89/B",
    district: "Pune",
    addressText: "Baner Road, Pune, Maharashtra",
    lat: 18.52,
    lng: 73.85,
    area: 111,
    ownerWallet: DEMO_WALLETS.buyer,
    documentHash: "0x" + "b".repeat(64),
  },
  {
    id: 3,
    ulpin: "29KA0482017453",
    surveyNumber: "145/1",
    district: "Medak",
    addressText: "Village Shankarpally, Medak, Telangana",
    lat: 17.76,
    lng: 78.06,
    area: 6070,
    ownerWallet: DEMO_WALLETS.owner3,
    documentHash: "0x" + "c".repeat(64),
  },
];

export async function seedDatabase(): Promise<void> {
  for (const p of SEED_PARCELS) {
    await prisma.parcelMeta.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        ulpin: p.ulpin,
        surveyNumber: p.surveyNumber,
        district: p.district,
        addressText: p.addressText,
        lat: p.lat,
        lng: p.lng,
        area: p.area,
        ownerWallet: p.ownerWallet.toLowerCase(),
      },
      update: {
        ulpin: p.ulpin,
        surveyNumber: p.surveyNumber,
        district: p.district,
        addressText: p.addressText,
        lat: p.lat,
        lng: p.lng,
        area: p.area,
        ownerWallet: p.ownerWallet.toLowerCase(),
      },
    });

    await sim.simRegisterParcel({
      parcelId: p.id,
      owner: p.ownerWallet,
      surveyNumber: p.surveyNumber,
      district: p.district,
      geo: `${p.lat},${p.lng}`,
      area: p.area,
      documentHash: p.documentHash,
    });
  }

  await prisma.transferMeta.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      parcelId: 2,
      seller: DEMO_WALLETS.buyer.toLowerCase(),
      buyer: DEMO_WALLETS.seller.toLowerCase(),
      status: "PendingRegistrar",
      newDocumentHash: "0x" + "d".repeat(64),
    },
    update: { status: "PendingRegistrar" },
  });

  const existingTransfer = await prisma.simTransfer.findFirst({ where: { parcelId: 2 } });
  if (!existingTransfer) {
    const { transferId } = await sim.simInitiateTransfer(
      DEMO_WALLETS.buyer,
      2,
      DEMO_WALLETS.seller,
      "0x" + "d".repeat(64)
    );
    await sim.simBuyerApprove(DEMO_WALLETS.seller, transferId);
    await prisma.transferMeta.upsert({
      where: { id: transferId },
      create: {
        id: transferId,
        parcelId: 2,
        seller: DEMO_WALLETS.buyer.toLowerCase(),
        buyer: DEMO_WALLETS.seller.toLowerCase(),
        status: "PendingRegistrar",
        newDocumentHash: "0x" + "d".repeat(64),
      },
      update: { status: "PendingRegistrar" },
    });
  }

  await prisma.user.upsert({
    where: { wallet: DEMO_WALLETS.registrar.toLowerCase() },
    create: { wallet: DEMO_WALLETS.registrar.toLowerCase(), name: "Registrar Rao", role: "REGISTRAR" },
    update: { role: "REGISTRAR" },
  });
}

export async function findParcelIdByUlpin(ulpin: string): Promise<number | null> {
  const normalized = ulpin.replace(/-/g, "").toUpperCase();
  const meta = await prisma.parcelMeta.findFirst({
    where: { ulpin: normalized },
  });
  return meta?.id ?? null;
}

export async function mergeParcelWithMeta(parcelId: number) {
  const meta = await prisma.parcelMeta.findUnique({ where: { id: parcelId } });
  const chain = await sim.simGetParcel(parcelId);
  if (!chain && !meta) return null;
  return {
    id: parcelId,
    surveyNumber: chain?.surveyNumber ?? meta?.surveyNumber ?? "",
    district: chain?.district ?? meta?.district ?? "",
    geo: chain?.geo ?? `${meta?.lat},${meta?.lng}`,
    area: chain?.area ?? meta?.area ?? 0,
    documentHash: chain?.documentHash ?? "0x0",
    registeredAt: chain?.registeredAt ?? 0,
    status: chain?.status ?? "Active",
    owner: chain?.owner ?? meta?.ownerWallet ?? "",
    ulpin: meta?.ulpin,
  };
}

export { DEMO_WALLETS } from "./demo-constants";

let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const count = await prisma.parcelMeta.count();
  if (count === 0) await seedDatabase();
  seeded = true;
}

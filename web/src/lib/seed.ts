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
    ownerWallet: DEMO_WALLETS.seller,
    documentHash: "0x" + "c".repeat(64),
  },
  {
    id: 4,
    ulpin: "30KA1111000001",
    surveyNumber: "10/A",
    district: "Hyderabad",
    addressText: "Banjara Hills, Hyderabad, Telangana",
    lat: 17.41,
    lng: 78.44,
    area: 2500,
    ownerWallet: DEMO_WALLETS.seller,
    documentHash: "0x" + "e".repeat(64),
  },
  {
    id: 5,
    ulpin: "30KA1111000002",
    surveyNumber: "11/B",
    district: "Hyderabad",
    addressText: "Jubilee Hills, Hyderabad, Telangana",
    lat: 17.43,
    lng: 78.40,
    area: 3200,
    ownerWallet: DEMO_WALLETS.seller,
    documentHash: "0x" + "f".repeat(64),
  },
  {
    id: 6,
    ulpin: "30KA1111000003",
    surveyNumber: "45/1",
    district: "Bangalore",
    addressText: "Koramangala, Bangalore, Karnataka",
    lat: 12.93,
    lng: 77.62,
    area: 1200,
    ownerWallet: DEMO_WALLETS.buyer,
    documentHash: "0x" + "1".repeat(64),
  },
  {
    id: 7,
    ulpin: "30KA1111000004",
    surveyNumber: "46/2",
    district: "Bangalore",
    addressText: "Indiranagar, Bangalore, Karnataka",
    lat: 12.97,
    lng: 77.64,
    area: 1800,
    ownerWallet: DEMO_WALLETS.buyer,
    documentHash: "0x" + "2".repeat(64),
  },
  {
    id: 8,
    ulpin: "30KA1111000005",
    surveyNumber: "112/A",
    district: "Mumbai",
    addressText: "Andheri West, Mumbai, Maharashtra",
    lat: 19.11,
    lng: 72.82,
    area: 2500,
    ownerWallet: DEMO_WALLETS.seller,
    documentHash: "0x" + "3".repeat(64),
  },
  {
    id: 9,
    ulpin: "30KA1111000006",
    surveyNumber: "113/B",
    district: "Mumbai",
    addressText: "Bandra East, Mumbai, Maharashtra",
    lat: 19.06,
    lng: 72.84,
    area: 3100,
    ownerWallet: DEMO_WALLETS.seller,
    documentHash: "0x" + "4".repeat(64),
  },
  {
    id: 10,
    ulpin: "30KA1111000007",
    surveyNumber: "201/1",
    district: "Delhi",
    addressText: "Connaught Place, New Delhi",
    lat: 28.63,
    lng: 77.21,
    area: 1500,
    ownerWallet: DEMO_WALLETS.buyer,
    documentHash: "0x" + "5".repeat(64),
  },
  {
    id: 11,
    ulpin: "30KA1111000008",
    surveyNumber: "202/2",
    district: "Delhi",
    addressText: "Vasant Kunj, New Delhi",
    lat: 28.52,
    lng: 77.15,
    area: 4200,
    ownerWallet: DEMO_WALLETS.buyer,
    documentHash: "0x" + "6".repeat(64),
  },
  {
    id: 12,
    ulpin: "30KA1111000009",
    surveyNumber: "55/C",
    district: "Chennai",
    addressText: "Adyar, Chennai, Tamil Nadu",
    lat: 13.00,
    lng: 80.25,
    area: 2800,
    ownerWallet: DEMO_WALLETS.seller,
    documentHash: "0x" + "7".repeat(64),
  },
];

export async function seedDatabase(): Promise<void> {
  for (const p of SEED_PARCELS) {
    const meta = await prisma.parcelMeta.upsert({
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

    const doc = await prisma.document.findFirst({ where: { sha256: p.documentHash } });
    if (!doc) {
      const newDoc = await prisma.document.create({
        data: {
          parcelId: p.id,
          storageUrl: "/placeholder.pdf",
          sha256: p.documentHash,
          uploadedBy: "seed",
        },
      });
      await prisma.parcelMeta.update({
        where: { id: p.id },
        data: { currentDocId: newDoc.id },
      });
    }

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
    await sim.simBuyerApprove(DEMO_WALLETS.seller, transferId, "0x" + "d".repeat(64));
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
    
    const docHash = "0x" + "d".repeat(64);
    const existingDoc = await prisma.document.findFirst({ where: { sha256: docHash } });
    if (!existingDoc) {
      await prisma.document.create({
        data: {
          parcelId: 2,
          storageUrl: "/placeholder-transfer.pdf",
          sha256: docHash,
          uploadedBy: "seed",
        },
      });
    }
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

export async function mergeParcelWithMeta(parcelId: number): Promise<import("./types").Parcel | null> {
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
    status: (chain?.status ?? "Active") as import("./types").ParcelStatus,
    owner: chain?.owner ?? meta?.ownerWallet ?? "",
    ulpin: meta?.ulpin || undefined,
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

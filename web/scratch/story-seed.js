const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  const parcelId = 999;
  
  // Clean up any existing records for 999
  await prisma.chainEvent.deleteMany({ where: { parcelId } });
  await prisma.transferMeta.deleteMany({ where: { parcelId } });
  await prisma.simTransfer.deleteMany({ where: { parcelId } });
  await prisma.document.deleteMany({ where: { parcelId } });
  await prisma.parcelMeta.deleteMany({ where: { id: parcelId } });
  await prisma.simParcel.deleteMany({ where: { id: parcelId } });

  const owner1 = "0x1111111111111111111111111111111111111111";
  const owner2 = "0x2222222222222222222222222222222222222222";
  const owner3 = "0x46dca42BCDad539Ab02c5bC3288C233DD9b47644"; // Yogesh (Current Owner)

  const district = "Hyderabad Central";
  const surveyNumber = "SY-999-STORY";
  const geo = "17.4065,78.4772"; // Hussain Sagar area
  const area = 15000;
  const docHashBase = "0x" + "a".repeat(64);

  const startYear = new Date("1995-04-12T10:00:00Z").getTime() / 1000;
  const trans1Year = new Date("2008-08-24T14:30:00Z").getTime() / 1000;
  const trans2Year = new Date("2024-01-15T09:15:00Z").getTime() / 1000;

  // 1. Initial Grant to Owner 1 (1995)
  await prisma.simParcel.create({
    data: {
      id: parcelId,
      surveyNumber,
      district,
      geo,
      area,
      documentHash: docHashBase,
      registeredAt: Math.floor(startYear),
      status: "Active",
      ownerWallet: owner3.toLowerCase(), // Set the current owner state to Owner 3
    }
  });

  await prisma.parcelMeta.create({
    data: {
      id: parcelId,
      surveyNumber,
      district,
      addressText: "Prime Estate, Banjara Hills",
      lat: 17.4065,
      lng: 78.4772,
      area,
      ownerWallet: owner3.toLowerCase(),
      ulpin: "IND-TL-999-999-999",
    }
  });

  // Seed User profiles for nice names in history
  await prisma.user.upsert({
    where: { wallet: owner1.toLowerCase() },
    update: { name: "Anand Rao" },
    create: { wallet: owner1.toLowerCase(), name: "Anand Rao" }
  });
  await prisma.user.upsert({
    where: { wallet: owner2.toLowerCase() },
    update: { name: "Meera Reddy" },
    create: { wallet: owner2.toLowerCase(), name: "Meera Reddy" }
  });
  
  // Create Chain Events
  
  // Event 1: Initial Registration
  await prisma.chainEvent.create({
    data: {
      parcelId,
      type: "REGISTERED",
      fromAddr: "STATE",
      toAddr: owner1.toLowerCase(),
      txHash: "0x8fa1c9" + crypto.randomBytes(29).toString('hex'),
      blockNum: 100,
      at: Math.floor(startYear)
    }
  });

  // Event 2: Transfer Anand -> Meera
  await prisma.chainEvent.create({
    data: {
      parcelId,
      transferId: 9991,
      type: "TRANSFERRED",
      fromAddr: owner1.toLowerCase(),
      toAddr: owner2.toLowerCase(),
      txHash: "0x3bc4d2" + crypto.randomBytes(29).toString('hex'),
      blockNum: 54000,
      at: Math.floor(trans1Year)
    }
  });

  // Event 3: Transfer Meera -> Yogesh
  await prisma.chainEvent.create({
    data: {
      parcelId,
      transferId: 9992,
      type: "TRANSFERRED",
      fromAddr: owner2.toLowerCase(),
      toAddr: owner3.toLowerCase(),
      txHash: "0x7ef9b1" + crypto.randomBytes(29).toString('hex'),
      blockNum: 1800000,
      at: Math.floor(trans2Year)
    }
  });

  console.log("Successfully seeded story parcel: 999");
}

main().catch(console.error);

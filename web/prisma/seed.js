const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// These hardcoded addresses match the deterministic Hardhat Node addresses (Index 2, 3, 4)
const citizen1 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const citizen2 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
const citizen3 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";

async function main() {
  console.log('Seeding Prisma database for Demo...');
  
  const citizens = [
    { wallet: citizen1, name: "Rahul Sharma", maskedId: "XXXX-XXXX-1234" },
    { wallet: citizen2, name: "Priya Patel", maskedId: "XXXX-XXXX-5678" },
    { wallet: citizen3, name: "Amit Kumar", maskedId: "XXXX-XXXX-9012" }
  ];

  console.log("Inserting Citizens...");
  for (const c of citizens) {
    await prisma.user.upsert({
      where: { wallet: c.wallet },
      update: {},
      create: { wallet: c.wallet, name: c.name, maskedId: c.maskedId, role: 'CITIZEN' }
    });
  }
  
  const parcelsData = [
    { id: 1, owner: citizen1, surveyNumber: "MH-PUN-101", district: "Pune-Maharashtra", geo: "18.5204,73.8567", area: 2500 },
    { id: 2, owner: citizen2, surveyNumber: "TG-RAN-202", district: "Rangareddy-Telangana", geo: "17.3850,78.4867", area: 4500 },
    { id: 3, owner: citizen3, surveyNumber: "KA-BLR-303", district: "Bengaluru Urban-Karnataka", geo: "12.9716,77.5946", area: 1200 },
    { id: 4, owner: citizen1, surveyNumber: "MH-PUN-104", district: "Pune-Maharashtra", geo: "18.5210,73.8570", area: 3000 },
    { id: 5, owner: citizen2, surveyNumber: "TG-RAN-205", district: "Rangareddy-Telangana", geo: "17.3860,78.4870", area: 5500 },
    { id: 6, owner: citizen3, surveyNumber: "KA-BLR-306", district: "Bengaluru Urban-Karnataka", geo: "12.9720,77.5950", area: 1800 },
    { id: 7, owner: citizen1, surveyNumber: "MH-PUN-107", district: "Pune-Maharashtra", geo: "18.5220,73.8580", area: 4000 },
    { id: 8, owner: citizen2, surveyNumber: "TG-RAN-208", district: "Rangareddy-Telangana", geo: "17.3870,78.4880", area: 6500 }
  ];

  console.log("Inserting ParcelMeta rows...");
  for (const p of parcelsData) {
    const [lat, lng] = p.geo.split(',').map(Number);
    await prisma.parcelMeta.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        surveyNumber: p.surveyNumber,
        district: p.district,
        addressText: p.district,
        lat,
        lng,
        area: p.area,
        currentDocId: 'mock-doc-hash-123'
      }
    });
  }
  console.log('✅ Prisma seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

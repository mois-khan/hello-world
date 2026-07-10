import hre from "hardhat";

async function main() {
  const signers = await hre.ethers.getSigners();
  // Use deterministic Hardhat accounts
  const registrar = signers[1];
  const citizen1 = signers[2];
  const citizen2 = signers[3];
  const citizen3 = signers[4];

  console.log("Deploying fresh LandRegistry for seeding...");
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  const address = await landRegistry.getAddress();
  
  console.log("✅ LandRegistry deployed to:", address);

  const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();
  await landRegistry.grantRole(REGISTRAR_ROLE, registrar.address);
  console.log("✅ Granted REGISTRAR_ROLE to:", registrar.address);

  const parcelsData = [
    { owner: citizen1.address, surveyNumber: "MH-PUN-101", district: "Pune-Maharashtra", geo: "18.5204,73.8567", area: 2500 },
    { owner: citizen2.address, surveyNumber: "TG-RAN-202", district: "Rangareddy-Telangana", geo: "17.3850,78.4867", area: 4500 },
    { owner: citizen3.address, surveyNumber: "KA-BLR-303", district: "Bengaluru Urban-Karnataka", geo: "12.9716,77.5946", area: 1200 },
    { owner: citizen1.address, surveyNumber: "MH-PUN-104", district: "Pune-Maharashtra", geo: "18.5210,73.8570", area: 3000 },
    { owner: citizen2.address, surveyNumber: "TG-RAN-205", district: "Rangareddy-Telangana", geo: "17.3860,78.4870", area: 5500 },
    { owner: citizen3.address, surveyNumber: "KA-BLR-306", district: "Bengaluru Urban-Karnataka", geo: "12.9720,77.5950", area: 1800 },
    { owner: citizen1.address, surveyNumber: "MH-PUN-107", district: "Pune-Maharashtra", geo: "18.5220,73.8580", area: 4000 },
    { owner: citizen2.address, surveyNumber: "TG-RAN-208", district: "Rangareddy-Telangana", geo: "17.3870,78.4880", area: 6500 }
  ];

  const summary = [];

  console.log("\nRegistering 8 parcels on-chain...");
  for (let i = 0; i < parcelsData.length; i++) {
    const p = parcelsData[i];
    const docHash = hre.ethers.id(`doc-${i}`); // mock sha256 bytes32
    
    const tx = await landRegistry.connect(registrar).registerParcel(
      p.owner, p.surveyNumber, p.district, p.geo, p.area, docHash
    );
    const receipt = await tx.wait();
    
    // Find ParcelRegistered event to extract the precise ID
    let parcelId = i + 1;
    for (const log of receipt.logs) {
      try {
        const parsed = landRegistry.interface.parseLog(log);
        if (parsed && parsed.name === 'ParcelRegistered') {
          parcelId = Number(parsed.args[0]);
        }
      } catch (e) {}
    }
    
    summary.push({ parcelId, owner: p.owner, surveyNumber: p.surveyNumber });
  }

  console.table(summary);
  console.log("\n🎉 Chain seed completed!");
  console.log("Run the Prisma seed separately to populate the DB.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

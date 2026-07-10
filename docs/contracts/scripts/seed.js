const hre = require("hardhat");

const DEMO_PARCELS = [
  {
    ownerIndex: 1,
    surveyNumber: "142/2A",
    district: "Medak",
    geo: "17.75,78.05",
    area: 8094,
    documentHash: "0x" + "a".repeat(64),
    ulpin: "29KA0482017452",
  },
  {
    ownerIndex: 2,
    surveyNumber: "89/B",
    district: "Pune",
    geo: "18.52,73.85",
    area: 111,
    documentHash: "0x" + "b".repeat(64),
    ulpin: "27MH1234056789",
  },
  {
    ownerIndex: 3,
    surveyNumber: "145/1",
    district: "Medak",
    geo: "17.76,78.06",
    area: 6070,
    documentHash: "0x" + "c".repeat(64),
    ulpin: "29KA0482017453",
  },
];

async function main() {
  const [deployer, seller, buyer, owner3] = await hre.ethers.getSigners();
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  let registry;
  if (address) {
    registry = await hre.ethers.getContractAt("LandRegistry", address);
  } else {
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    registry = await LandRegistry.deploy();
    await registry.waitForDeployment();
    console.log("Deployed for seed:", await registry.getAddress());
  }

  const owners = [deployer, seller, buyer, owner3];
  const parcelIds = [];

  for (const p of DEMO_PARCELS) {
    const tx = await registry.registerParcel(
      owners[p.ownerIndex].address,
      p.surveyNumber,
      p.district,
      p.geo,
      p.area,
      p.documentHash
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((l) => l.fragment?.name === "ParcelRegistered");
    const parcelId = Number(event.args.parcelId);
    parcelIds.push({ parcelId, ulpin: p.ulpin });
    console.log(`Registered parcel ${parcelId} (${p.ulpin}) → ${owners[p.ownerIndex].address}`);
  }

  console.log("\nDemo wallets:");
  console.log("Registrar/Admin:", deployer.address);
  console.log("Seller:", seller.address);
  console.log("Buyer:", buyer.address);
  console.log("Owner3:", owner3.address);
  console.log("\nParcel mapping:", JSON.stringify(parcelIds));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

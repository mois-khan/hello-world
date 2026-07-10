const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("LandRegistry deployed to:", address);

  const artifact = await hre.artifacts.readArtifact("LandRegistry");
  const abiPath = path.join(__dirname, "../../web/src/lib/contract-abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));

  const envExamplePath = path.join(__dirname, "../../web/.env.local.example");
  let envContent = "";
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf8");
    if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`;
    }
    fs.writeFileSync(envExamplePath, envContent);
  }

  const envLocalPath = path.join(__dirname, "../../web/.env.local");
  if (fs.existsSync(envLocalPath)) {
    let local = fs.readFileSync(envLocalPath, "utf8");
    if (local.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      local = local.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
    } else {
      local += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`;
    }
    fs.writeFileSync(envLocalPath, local);
  } else {
    fs.writeFileSync(
      envLocalPath,
      `NEXT_PUBLIC_CHAIN_RPC=http://127.0.0.1:8545\nNEXT_PUBLIC_CHAIN_ID=31337\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}\nNEXT_PUBLIC_APP_URL=http://localhost:3000\nDATABASE_URL=file:./prisma/dev.db\nDEMO_FORCE_REPORT=false\n`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

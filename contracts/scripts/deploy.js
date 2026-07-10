import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();

  await landRegistry.waitForDeployment();

  const address = await landRegistry.getAddress();
  console.log("LandRegistry deployed to:", address);

  // Copy ABI to web/lib/contract-abi.json
  const artifactPath = path.join(__dirname, "../artifacts/contracts/LandRegistry.sol/LandRegistry.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const webLibDir = path.join(__dirname, "../../web/lib");
  
  if (!fs.existsSync(webLibDir)) {
    fs.mkdirSync(webLibDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(webLibDir, "contract-abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log("ABI copied to web/lib/contract-abi.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

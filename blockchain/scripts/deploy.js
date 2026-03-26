const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function main() {
  const { ethers, artifacts } = hre;

  const factory = await ethers.getContractFactory("TestamentRegistry");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`TestamentRegistry deployed to: ${address}`);

  const artifact = await artifacts.readArtifact("TestamentRegistry");
  const payload = {
    abi: artifact.abi,
    address
  };

  const frontendOutPath = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "contracts",
    "TestamentRegistry.json"
  );
  const backendOutPath = path.join(
    __dirname,
    "..",
    "..",
    "backend",
    "contracts",
    "TestamentRegistry.json"
  );

  ensureDir(path.dirname(frontendOutPath));
  ensureDir(path.dirname(backendOutPath));

  fs.writeFileSync(frontendOutPath, JSON.stringify(payload, null, 2));
  fs.writeFileSync(backendOutPath, JSON.stringify(payload, null, 2));

  console.log(`Wrote ABI+address to:`);
  console.log(`- ${frontendOutPath}`);
  console.log(`- ${backendOutPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


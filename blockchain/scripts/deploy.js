const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, notary, heir, testator] = await hre.ethers.getSigners();

  const TestamentRegistry = await hre.ethers.getContractFactory(
    "TestamentRegistry"
  );
  const contract = await TestamentRegistry.deploy("Admin Notarain");
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("TestamentRegistry deployed to:", address);

  // Ajoute le notaire automatiquement
  await contract.addNotary(
    notary.address,
    "Notaire 1",
    "0x04notaire_public_key"
  );
  console.log("Notaire ajouté:", notary.address);

  // Enregistre le testator
  const testatorContract = contract.connect(testator);
  await testatorContract.registerTestator("testator 1", "alive");
  console.log("✓ Testator ajouté:", testator.address);

  // Enregistre le Hair
  const heirContract = contract.connect(heir);
  await heirContract.registerHeir("Heir Name", "0xheir_public_key");
  console.log("✓ Heir ajouté:", heir.address);
  // On laisse le testateur s'enregistrer lui-même via l'UI

  // Génère ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/TestamentRegistry.sol/TestamentRegistry.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath));
  const output = { address, abi: artifact.abi };
  const outputPathFront = path.join(
    __dirname,
    "../../frontend/src/contracts/TestamentRegistry.json"
  );
  const outputPathBack = path.join(
    __dirname,
    "../../backend/src/contracts/TestamentRegistry.json"
  );
  fs.writeFileSync(outputPathFront, JSON.stringify(output, null, 2));
  fs.writeFileSync(outputPathBack, JSON.stringify(output, null, 2));
  console.log("ABI generated!");

  // Met à jour .env
  const envPath = path.join(__dirname, "../../backend/.env");
  let env = fs.readFileSync(envPath, "utf8");
  env = env.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${address}`);
  fs.writeFileSync(envPath, env);

  const frontenvPath = path.join(__dirname, "../../frontend/.env");
  let frontenv = fs.readFileSync(frontenvPath, "utf8");
  frontenv = frontenv.replace(
    /VITE_CONTRACT_ADDRESS=.*/,
    `VITE_CONTRACT_ADDRESS=${address}`
  );
  fs.writeFileSync(frontenvPath, frontenv);
  console.log("ENV files updated!");

  console.log("\n=== COMPTES ===");
  console.log("Admin:    ", admin.address);
  console.log("Notaire:  ", notary.address);
  console.log("Heir:     ", heir.address);
  console.log("Testator: ", testator.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

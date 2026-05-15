import nacl from "tweetnacl";
import util from "tweetnacl-util";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Client-side function to generate and store key pair
async function generateAndStoreEncryptionKey(signer, message) {
  const signature = await signer.signMessage(message);
  const hexStr = signature.startsWith("0x") ? signature.slice(2) : signature;
  const signatureBytes = new Uint8Array(
    hexStr.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  const seed = signatureBytes.slice(-32);
  const keyPair = nacl.box.keyPair.fromSecretKey(seed);

  // Store the private key securely in localStorage
  const keyData = {
    publicKey: util.encodeBase64(keyPair.publicKey),
    secretKey: util.encodeBase64(keyPair.secretKey),
    registeredAt: new Date().toISOString(),
    notaryAddress: signer.address,
  };

  // Save to your local machine
  const exportDir = path.join(__dirname, "../../backend/keys/");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filePath = path.join(
    __dirname,
    `../../backend/keys/${signer.address}.key.json`
  );
  fs.writeFileSync(filePath, JSON.stringify(keyData, null, 2));

  console.log(`\n🔑 KEY FILE GENERATED: ${filePath}`);
  console.log(`📧 YOU MUST SEND THIS FILE SECURELY TO THE NOTARY`);

  return keyData.publicKey; // Return public key for contract
}

async function main() {
  const [admin, notary, heir1, heir2, heir3, testator] =
    await hre.ethers.getSigners();

  const TestamentRegistry = await hre.ethers.getContractFactory(
    "TestamentRegistry"
  );
  const adminContract = await TestamentRegistry.deploy("Admin Notarain");
  await adminContract.waitForDeployment();
  const address = await adminContract.getAddress();
  console.log("TestamentRegistry deployed to:", address);

  // Ajoute le notaire automatiquement
  const notaryPublicKey = generateAndStoreEncryptionKey(
    notary,
    "0x04notary_public_key"
  );

  await adminContract.addNotary(notary.address, "Notaire 1", notaryPublicKey);
  console.log("Notaire ajouté:", notary.address);

  // Enregistre le testator
  const testatorContract = adminContract.connect(testator);
  await testatorContract.registerTestator("testator 1", "alive");
  console.log("✓ Testator ajouté:", testator.address);

  // Enregistre le Hair
  // Heir 1
  const heirContract1 = adminContract.connect(heir1);
  const heirPublicKey1 = generateAndStoreEncryptionKey(
    heir1,
    "0xheir_public_key"
  );
  await heirContract1.registerHeir("Heir Name", heirPublicKey1);
  console.log("✓ Heir ajouté:", heir1.address);

  // Heir 2
  const heirContract2 = adminContract.connect(heir2);
  const heirPublicKey2 = generateAndStoreEncryptionKey(
    heir2,
    "0xheir_public_key"
  );
  await heirContract2.registerHeir("Heir Name", heirPublicKey2);
  console.log("✓ Heir ajouté:", heir2.address);

  // Heir 3
  const heirContract3 = adminContract.connect(heir3);
  const heirPublicKey3 = generateAndStoreEncryptionKey(
    heir3,
    "0xheir_public_key"
  );
  await heirContract3.registerHeir("Heir Name", heirPublicKey3);
  console.log("✓ Heir ajouté:", heir3.address);

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
  console.log("Heir 1:     ", heir1.address);
  console.log("Heir 2:     ", heir2.address);
  console.log("Heir 3:     ", heir3.address);
  console.log("Testator: ", testator.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

const contractJsonPath = path.join(__dirname, "..", "..", "contracts", "TestamentRegistry.json");

function loadContractConfig() {
  const raw = fs.readFileSync(contractJsonPath, "utf-8");
  const parsed = JSON.parse(raw);
  return parsed;
}

async function getTestament(id) {
  const contractConfig = loadContractConfig();
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

  return contract.testaments(id);
}

async function getTestatorTestaments(address) {
  const contractConfig = loadContractConfig();
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

  return contract.getTestatorTestaments(address);
}

module.exports = { getTestament, getTestatorTestaments };


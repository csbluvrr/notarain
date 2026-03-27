import { BrowserProvider, Contract, ethers } from "ethers";

import contractJson from "../contracts/TestamentRegistry.json";

const { abi, address } = contractJson;

export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask introuvable");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(address, abi, signer);
}


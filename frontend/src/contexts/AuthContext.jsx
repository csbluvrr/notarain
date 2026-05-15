import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import contractData from "../contracts/TestamentRegistry.json";

const AuthContext = createContext(null);
const CHAIN_ID = 31337;
const CONTRACT_ADDRESS = contractData.address;
const CONTRACT_ABI = contractData.abi;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("notarain_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    finally { setLoading(false); }
  }, []);

  const getContract = async (withSigner = false) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask introuvable");

      // Force MetaMask à afficher le sélecteur de compte
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts?.length) throw new Error("Aucun compte trouvé");
      const walletAddress = accounts[0].toLowerCase();

      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      if (Number(chainIdHex) !== CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + CHAIN_ID.toString(16) }]
        });
      }

      // Lire le rôle depuis le smart contract avec le bon signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const roleEnum = await c.getMyRole();
      const roleMap = { 0: "none", 1: "testator", 2: "notary", 3: "heir", 4: "admin" };
      const role = roleMap[Number(roleEnum)] || "none";

      const newUser = { walletAddress, role };
      localStorage.setItem("notarain_user", JSON.stringify(newUser));
      setUser(newUser);

      if (role === "admin") window.location.href = "/admin";
      else if (role === "testator") window.location.href = "/dashboard";
      else if (role === "notary") window.location.href = "/notary";
      else if (role === "heir") window.location.href = "/heir";
      else window.location.href = "/";

    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("notarain_user");
    setUser(null);
    window.location.href = "/";
  };

  const value = useMemo(() => ({
    user,
    loading,
    connectWallet,
    logout,
    getContract,
    isNotary: user?.role === "notary",
    isTestator: user?.role === "testator" || user?.role === "admin",
    isHeir: user?.role === "heir",
    isAdmin: user?.role === "admin",
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
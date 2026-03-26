import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("notarain_token");
      const storedUser = localStorage.getItem("notarain_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // If localStorage parsing fails, just ignore stored values.
    } finally {
      setLoading(false);
    }
  }, []);

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install it.");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      if (!accounts || !accounts.length) {
        throw new Error("No wallet accounts found");
      }

      const walletAddress = accounts[0].toLowerCase();

      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const chainId = Number(chainIdHex);

      const requiredChainId = 11155111;
      if (chainId !== requiredChainId) {
        const chainIdParam = "0x" + requiredChainId.toString(16);
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdParam }]
          });
        } catch (err) {
          throw new Error("Please switch your wallet to Sepolia");
        }
      }

      const nonceRes = await api.post("/api/auth/nonce", { walletAddress });
      const message = nonceRes?.data?.message;
      if (!message) {
        throw new Error("Failed to fetch login nonce");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const verifyRes = await api.post("/api/auth/verify", { walletAddress, signature });
      const newToken = verifyRes?.data?.token;
      const newUser = verifyRes?.data?.user;
      if (!newToken || !newUser) {
        throw new Error("Login failed");
      }

      localStorage.setItem("notarain_token", newToken);
      localStorage.setItem("notarain_user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("notarain_token");
    localStorage.removeItem("notarain_user");
    setUser(null);
    setToken(null);
  };

  const value = useMemo(() => {
    return {
      user,
      token,
      loading,
      connectWallet,
      logout,
      isNotary: user?.role === "notary",
      isTestator: user?.role === "testator" || user?.role === "admin"
    };
  }, [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;


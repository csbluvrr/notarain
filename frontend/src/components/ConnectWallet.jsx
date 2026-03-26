import React from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";

export default function ConnectWallet({ className = "" }) {
  const { connectWallet, isNotary, isTestator } = useAuth();
  const navigate = useNavigate();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected");
      if (isTestator) navigate("/dashboard");
      if (isNotary) navigate("/notary");
    } catch (err) {
      toast.error(err?.message || "Failed to connect wallet");
      throw err;
    }
  };

  return (
    <button
      type="button"
      onClick={onConnect}
      className={`px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold ${className}`}
    >
      Connect Wallet
    </button>
  );
}


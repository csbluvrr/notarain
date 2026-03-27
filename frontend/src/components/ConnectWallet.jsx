import React from "react";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";

export default function ConnectWallet({ className = "" }) {
  const { connectWallet } = useAuth();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected");
    } catch (err) {
      toast.error(err?.message || "Wallet connection failed");
      throw err;
    }
  };

  return (
    <button
      type="button"
      onClick={onConnect}
      className={`btn-primary ${className}`}
    >
      Connect Wallet
    </button>
  );
}


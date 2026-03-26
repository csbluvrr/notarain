import React from "react";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";

export default function ConnectWallet({ className = "" }) {
  const { connectWallet } = useAuth();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Portefeuille connecté");
    } catch (err) {
      toast.error(err?.message || "Connexion au portefeuille impossible");
      throw err;
    }
  };

  return (
    <button
      type="button"
      onClick={onConnect}
      className={`px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold ${className}`}
    >
      Connecter mon portefeuille
    </button>
  );
}


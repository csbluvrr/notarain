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
      toast.error(err?.message || "Échec de connexion au portefeuille");
      throw err;
    }
  };

  return (
    <button
      type="button"
      onClick={onConnect}
      className={`btn-primary ${className}`}
    >
      Connecter le portefeuille
    </button>
  );
}


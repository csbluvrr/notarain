import React from "react";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";

export default function ConnexionWallet() {
  const { connectWallet, loading } = useAuth();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Portefeuille connecté");
    } catch (err) {
      toast.error(err?.message || "Connexion impossible");
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900/60 p-6">
        <h2 className="text-2xl font-bold">Connexion</h2>
        <p className="mt-3 text-gray-300 leading-relaxed">
          Connectez votre portefeuille (MetaMask) puis signez le message afin d’authentifier votre adresse
          et récupérer votre rôle (Testateur, Notaire ou Bénéficiaire).
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={onConnect}
          className="mt-6 w-full px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Connecter mon portefeuille"}
        </button>
      </div>
    </div>
  );
}


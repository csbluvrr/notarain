import React from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";

export default function Accueil() {
  const { user, connectWallet, isNotary, isTestator, isHeir } = useAuth();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Connexion réussie");
    } catch (err) {
      toast.error(err?.message || "Connexion impossible");
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 p-8 md:p-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Notarain
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-200">
              Plateforme décentralisée de gestion des testaments basée sur la blockchain
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {!user ? (
                <button
                  type="button"
                  onClick={onConnect}
                  className="px-7 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
                >
                  Connecter mon portefeuille
                </button>
              ) : (
                <>
                  {isTestator ? (
                    <Link
                      to="/testateur"
                      className="px-7 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-center"
                    >
                      Accéder à mon espace Testateur
                    </Link>
                  ) : null}
                  {isNotary ? (
                    <Link
                      to="/notaire"
                      className="px-7 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 transition font-semibold text-center"
                    >
                      Accéder à mon espace Notaire
                    </Link>
                  ) : null}
                  {isHeir ? (
                    <Link
                      to="/beneficiaire"
                      className="px-7 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition font-semibold text-center"
                    >
                      Accéder à mon espace Bénéficiaire
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
            <div className="text-sm uppercase tracking-wide text-gray-400">Sécurité</div>
            <div className="mt-2 text-xl font-bold">Chiffrement AES</div>
            <p className="mt-3 text-gray-300 leading-relaxed">
              Vos documents sont chiffrés (AES‑256‑GCM) avant l’envoi, pour garantir confidentialité et intégrité.
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
            <div className="text-sm uppercase tracking-wide text-gray-400">Blockchain</div>
            <div className="mt-2 text-xl font-bold">Immutabilité</div>
            <p className="mt-3 text-gray-300 leading-relaxed">
              Le CID IPFS et le hash du document sont enregistrés sur la chaîne pour une preuve infalsifiable.
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
            <div className="text-sm uppercase tracking-wide text-gray-400">Notaire</div>
            <div className="mt-2 text-xl font-bold">Validation légale</div>
            <p className="mt-3 text-gray-300 leading-relaxed">
              Un notaire valide ou rejette le testament. Après confirmation du décès, l’exécution est tracée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


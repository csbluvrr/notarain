import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ethers } from "ethers";

import api from "../services/api";
import TestamentCard from "../components/TestamentCard";
import { getContract } from "../hooks/useContract";

export default function DashboardTestateur() {
  const [testaments, setTestaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/testament/my");
      setTestaments(res?.data?.testaments || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const soumettreAuNotaire = async (t) => {
    try {
      await api.post(`/api/testament/submit/${t._id}`);
      toast.success("Testament soumis au notaire");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Soumission impossible");
    }
  };

  const enregistrerBlockchain = async (t) => {
    if (!t?.ipfsCid || !t?.documentHash) {
      toast.error("CID IPFS ou hash manquant");
      return;
    }
    try {
      const contract = await getContract();

      const hashHex = t.documentHash.startsWith("0x") ? t.documentHash : `0x${t.documentHash}`;
      const documentHashBytes32 = ethers.hexlify(hashHex);

      toast.loading("Transaction en cours...", { id: "tx" });
      const tx = await contract.registerTestament(t.ipfsCid, documentHashBytes32);
      const receipt = await tx.wait();
      toast.success("Enregistré sur la blockchain", { id: "tx" });

      await api.post(`/api/testament/blockchain/${t._id}`, {
        blockchainId: 0,
        txHash: receipt?.hash
      });

      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Enregistrement blockchain impossible");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="nr-card nr-card-hover nr-fade-in-up p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Espace Testateur</h2>
          <p className="text-gray-300 mt-1">Créez et gérez vos testaments.</p>
        </div>
        <Link
          to="/upload"
          className="nr-btn-primary"
        >
          ➕ Créer un testament
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
        </div>
      ) : testaments.length === 0 ? (
        <div className="nr-card nr-card-hover p-6 text-gray-300">
          Aucun testament pour le moment. Cliquez sur “Créer un testament”.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testaments.map((t) => (
            <div key={t._id} className="space-y-3 nr-fade-in-up">
              <TestamentCard testament={t} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/testament/${t._id}`)}
                  className="nr-btn-secondary"
                >
                  👁 Voir détails
                </button>

                {t.status === "draft" ? (
                  <button
                    type="button"
                    onClick={() => soumettreAuNotaire(t)}
                    className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 transition font-semibold shadow-lg shadow-yellow-950/40"
                  >
                    📤 Soumettre au notaire
                  </button>
                ) : null}

                {t.ipfsCid && t.documentHash ? (
                  <button
                    type="button"
                    onClick={() => enregistrerBlockchain(t)}
                    className="nr-btn-primary"
                  >
                    🔗 Enregistrer sur blockchain
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


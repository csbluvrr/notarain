import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { getContract } from "../hooks/useContract";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

function tronquer(text, left = 6, right = 4) {
  const s = String(text || "");
  if (!s) return "";
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function DashboardNotaire() {
  const [onglet, setOnglet] = useState("attente");
  const [enAttente, setEnAttente] = useState([]);
  const [tous, setTous] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const charger = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        api.get("/api/notary/pending"),
        api.get("/api/notary/all")
      ]);
      setEnAttente(pendingRes?.data?.testaments || []);
      setTous(allRes?.data?.testaments || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const confirmer = (message) => {
    return window.confirm(message);
  };

  const approuver = async (t) => {
    if (!confirmer("Confirmer l’approbation de ce testament ?")) return;
    try {
      await api.post(`/api/notary/approve/${t._id}`);

      const blockchainId = Number(t.blockchainId || 0);
      if (blockchainId > 0) {
        const contract = await getContract();
        const tx = await contract.approveTestament(blockchainId);
        await tx.wait();
      }

      toast.success("Testament approuvé");
      await charger();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Approbation impossible");
    }
  };

  const rejeter = async (t) => {
    if (!confirmer("Confirmer le rejet de ce testament ?")) return;
    try {
      await api.post(`/api/notary/reject/${t._id}`);

      const blockchainId = Number(t.blockchainId || 0);
      if (blockchainId > 0) {
        const contract = await getContract();
        const tx = await contract.rejectTestament(blockchainId);
        await tx.wait();
      }

      toast.success("Testament rejeté");
      await charger();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Rejet impossible");
    }
  };

  const confirmerDeces = async (t) => {
    if (!confirmer("Confirmer le décès et exécuter le testament ?")) return;
    try {
      await api.post(`/api/notary/execute/${t._id}`);

      const blockchainId = Number(t.blockchainId || 0);
      if (blockchainId > 0) {
        const contract = await getContract();
        const tx = await contract.confirmDeath(blockchainId);
        await tx.wait();
      }

      toast.success("Décès confirmé (exécuté)");
      await charger();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Action impossible");
    }
  };

  const carte = (t, actions) => {
    const ipfsLink = t.ipfsCid ? `${PINATA_GATEWAY}/${t.ipfsCid}` : null;
    return (
      <div key={t._id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-semibold truncate">{t.originalFileName}</div>
            <div className="mt-1 text-xs text-gray-300">
              Testateur : <span className="font-mono">{tronquer(t.testatorWallet)}</span>
            </div>
            <div className="text-xs text-gray-300">{formatDate(t.createdAt)}</div>
          </div>
          <StatusBadge status={t.status} />
        </div>

        {t.ipfsCid ? (
          <div className="mt-3 text-sm text-gray-200">
            CID IPFS :{" "}
            <a className="text-indigo-300 underline break-all" href={ipfsLink} target="_blank" rel="noreferrer">
              {tronquer(t.ipfsCid, 12, 4)}
            </a>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/testament/${t._id}`)}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition font-semibold"
          >
            👁 Détails
          </button>
          {actions}
        </div>
      </div>
    );
  };

  const liste = onglet === "attente" ? enAttente : tous;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Espace Notaire</h2>
        <p className="text-gray-300 mt-1">Valider ou rejeter les testaments, puis confirmer le décès si nécessaire.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setOnglet("attente")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            onglet === "attente" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          Testaments en attente
        </button>
        <button
          type="button"
          onClick={() => setOnglet("tous")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            onglet === "tous" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          Tous
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
        </div>
      ) : liste.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 text-gray-300">
          Aucun élément à afficher.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {liste.map((t) =>
            carte(
              t,
              onglet === "attente" ? (
                <>
                  <button
                    type="button"
                    onClick={() => approuver(t)}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition font-semibold"
                  >
                    ✅ Approuver
                  </button>
                  <button
                    type="button"
                    onClick={() => rejeter(t)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition font-semibold"
                  >
                    ❌ Rejeter
                  </button>
                </>
              ) : t.status === "approved" ? (
                <button
                  type="button"
                  onClick={() => confirmerDeces(t)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-semibold"
                >
                  ⚰️ Confirmer décès
                </button>
              ) : null
            )
          )}
        </div>
      )}
    </div>
  );
}


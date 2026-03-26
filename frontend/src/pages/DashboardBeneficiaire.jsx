import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import StatusBadge from "../components/StatusBadge";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function DashboardBeneficiaire() {
  const [testaments, setTestaments] = useState([]);
  const [idRecherche, setIdRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ajouterParId = async () => {
    const id = idRecherche.trim();
    if (!id) {
      toast.error("Veuillez saisir un identifiant de testament");
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/api/testament/${id}`);
      const t = res?.data?.testament;
      if (!t) {
        toast.error("Testament introuvable");
        return;
      }

      if (t.status !== "executed") {
        toast.error("Ce testament n’est pas encore exécutable/accessible (statut requis : Exécuté)");
        return;
      }

      setTestaments((prev) => {
        const exists = prev.some((x) => x._id === t._id);
        if (exists) return prev;
        return [t, ...prev];
      });
      setIdRecherche("");
      toast.success("Testament ajouté à votre liste");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Recherche impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Espace Bénéficiaire</h2>
        <p className="text-gray-300 mt-1">
          Consultez les testaments accessibles (uniquement après validation et exécution).
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="font-semibold mb-2">Ajouter un testament accessible</div>
        <div className="text-sm text-gray-300 mb-4">
          Entrez l’identifiant MongoDB du testament (fourni pendant la démonstration) pour l’ajouter à votre liste.
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={idRecherche}
            onChange={(e) => setIdRecherche(e.target.value)}
            placeholder="Identifiant du testament (ex: 65f...)"
            className="flex-1 px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={ajouterParId}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Recherche..." : "Ajouter"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {testaments.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 text-gray-300">
            Aucun testament accessible dans votre liste.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testaments.map((t) => (
              <div key={t._id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.originalFileName}</div>
                    <div className="text-xs text-gray-300 mt-1">
                      Testateur : <span className="font-mono">{t.testatorWallet}</span>
                    </div>
                    <div className="text-xs text-gray-300">Exécuté le : {formatDate(t.updatedAt)}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/testament/${t._id}`)}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition font-semibold"
                >
                  Accéder au document
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


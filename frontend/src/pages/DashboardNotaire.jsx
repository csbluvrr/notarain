import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  decryptWithMetaMask,
  encryptFileForAddress,
} from "../services/encryption";
import { uploadToPinata } from "../services/pinata";

const STATUS_LABEL = {
  0: { label: "Brouillon", color: "var(--text-muted)" },
  1: { label: "En attente", color: "var(--warning)" },
  2: { label: "Approuvé", color: "var(--success)" },
  3: { label: "Rejeté", color: "var(--danger)" },
  4: { label: "Décès signalé", color: "var(--info)" },
  5: { label: "Exécuté", color: "var(--accent)" },
};

export default function DashboardNotaire() {
  const { user, getContract } = useAuth();
  const [testaments, setTestaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({});
  const [processing, setProcessing] = useState({});
  const [heirCounts, setHeirCounts] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await getContract();
      const ids = await c.getNotaryTestaments(user.walletAddress);
      const tests = await Promise.all(ids.map((id) => c.getTestament(id)));
      const counts = {};
      for (let i = 0; i < ids.length; i++) {
        const heirs = await c.getTestamentHeirs(ids[i]);
        counts[ids[i].toString()] = heirs.length;
      }
      setHeirCounts(counts);
      setTestaments(
        tests.map((t, i) => ({
          id: ids[i],
          testator: t[1],
          assignedNotary: t[2],
          ipfsCid: t[3],
          documentHash: t[4],
          status: Number(t[5]),
          deathCertificateCid: t[8],
          rejectionReason: t[9],
        }))
      );
    } catch (e) {
      toast.error("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function decryptAndView(ipfsCid) {
    try {
      toast("Récupération depuis IPFS...", { icon: "⏳" });
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsCid}`);
      const encryptedJson = await res.json();
      toast("Déchiffrement en cours...", { icon: "🔐" });
      const pdfBlob = await decryptWithMetaMask(
        encryptedJson,
        user.walletAddress
      );
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
      toast.success("Testament déchiffré !");
    } catch (e) {
      toast.error("Erreur déchiffrement: " + e.message);
    }
  }

  async function approve(id) {
    try {
      setProcessing((p) => ({ ...p, [id]: true }));
      const c = await getContract(true);
      const tx = await c.approveTestament(id);
      await tx.wait();
      toast.success("Testament approuvé !");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  async function reject(id) {
    const reason = rejectReason[id];
    if (!reason?.trim()) return toast.error("Entrez une raison de rejet");
    try {
      setProcessing((p) => ({ ...p, [id]: true }));
      const c = await getContract(true);
      const tx = await c.rejectTestament(id, reason);
      await tx.wait();
      toast.success("Testament rejeté");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  async function confirmDeath(id) {
    try {
      setProcessing((p) => ({ ...p, [id]: true }));
      toast("Récupération testament...", { icon: "⏳" });

      const testament = testaments.find((t) => t.id === id);
      const res = await fetch(
        `https://gateway.pinata.cloud/ipfs/${testament.ipfsCid}`
      );
      const encryptedJson = await res.json();

      toast("Déchiffrement Notaire...", { icon: "🔐" });
      const pdfBlob = await decryptWithMetaMask(
        encryptedJson,
        user.walletAddress
      );
      const pdfFile = new File([pdfBlob], "testament.pdf");

      toast("Rechiffrement pour les héritiers...", { icon: "🔑" });
      const c = await getContract();
      const heirs = await c.getTestamentHeirs(id);

      const encryptedCids = await Promise.all(
        heirs.map(async (heir) => {
          const heirPubKey = await c.getHeirPublicKey(heir.walletAddress);
          if (!heirPubKey) return "no_key_found";
          const encryptedForHeir = await encryptFileForAddress(
            pdfFile,
            heirPubKey
          );
          return await uploadToPinata(encryptedForHeir);
        })
      );

      const contract = await getContract(true);
      const tx = await contract.confirmDeath(id, encryptedCids);
      await tx.wait();
      toast.success("Décès confirmé — accès transmis !");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading)
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: 120 }}
      >
        <span className="spinner" />
      </div>
    );

  return (
    <div className="page-container">
      <h1 className="page-title">Espace Notaire</h1>
      <p className="page-subtitle">Gérez les testaments assignés</p>

      {testaments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--text-muted)" }}>Aucun testament assigné.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {testaments.map((t, i) => {
            const s = STATUS_LABEL[t.status] || STATUS_LABEL[1];
            const id = t.id;
            return (
              <div key={i} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Testament #{id.toString()}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      Testateur: {String(t.testator).slice(0, 6)}...
                      {String(t.testator).slice(-4)}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      background: s.color + "22",
                      border: `1px solid ${s.color}`,
                      color: s.color,
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                {t.ipfsCid && !t.ipfsCid.startsWith("ipfs_") && (
                  <button
                    className="btn-secondary"
                    style={{ marginBottom: 12 }}
                    onClick={() => decryptAndView(t.ipfsCid)}
                  >
                    🔓 Déchiffrer et lire
                  </button>
                )}

                {t.status === 1 && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <button className="btn-approve" onClick={() => approve(id)}>
                      ✅ Approuver
                    </button>
                    <input
                      className="input"
                      placeholder="Raison rejet..."
                      onChange={(e) =>
                        setRejectReason((r) => ({ ...r, [id]: e.target.value }))
                      }
                    />
                    <button className="btn-danger" onClick={() => reject(id)}>
                      ❌ Rejeter
                    </button>
                  </div>
                )}

                {t.status === 4 && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn-gold-action"
                      disabled={processing[id]}
                      onClick={() => confirmDeath(id)}
                    >
                      {processing[id] ? (
                        <span className="spinner" />
                      ) : (
                        "✅ Confirmer le décès et exécuter"
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

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

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await getContract();
      const ids = await c.getNotaryTestaments(user.walletAddress);
      const tests = await Promise.all(ids.map(id => c.getTestament(id)));
      const counts = {};
      for (let i = 0; i < ids.length; i++) {
        const heirs = await c.getTestamentHeirs(ids[i]);
        counts[ids[i].toString()] = heirs.length;
      }
      setHeirCounts(counts);
      setTestaments(tests.map((t, i) => ({
        id: ids[i],
        testator: t[1],
        assignedNotary: t[2],
        ipfsCid: t[3],
        documentHash: t[4],
        status: Number(t[5]),
        deathCertificateCid: t[8],
        rejectionReason: t[9],
      })));
    } catch (e) {
      toast.error("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id) {
    try {
      setProcessing(p => ({ ...p, [id]: true }));
      const c = await getContract(true);
      const tx = await c.approveTestament(id);
      await tx.wait();
      toast.success("Testament approuvé !");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  }

  async function reject(id) {
    const reason = rejectReason[id];
    if (!reason?.trim()) return toast.error("Entrez une raison de rejet");
    try {
      setProcessing(p => ({ ...p, [id]: true }));
      const c = await getContract(true);
      const tx = await c.rejectTestament(id, reason);
      await tx.wait();
      toast.success("Testament rejeté");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  }

  async function confirmDeath(id) {
    try {
      setProcessing(p => ({ ...p, [id]: true }));
      const count = heirCounts[id.toString()] || 1;
      const fakeCids = Array(count).fill("ipfs_heir_" + Date.now());
      const c = await getContract(true);
      const tx = await c.confirmDeath(id, fakeCids);
      await tx.wait();
      toast.success("Décès confirmé — testament exécuté !");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  }

  if (loading) return (
    <div className="page-container" style={{ textAlign: "center", paddingTop: 120 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className="page-container">
      <h1 className="page-title">Espace Notaire</h1>
      <p className="page-subtitle">Gérez les testaments qui vous sont assignés</p>

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                      Testament #{id.toString()}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      Testateur: {String(t.testator).slice(0,6)}...{String(t.testator).slice(-4)}
                    </div>
                  </div>
                  <span style={{
                    padding: "5px 12px", borderRadius: 999, fontSize: 12,
                    background: s.color + "22", border: `1px solid ${s.color}`, color: s.color
                  }}>
                    {s.label}
                  </span>
                </div>

                {t.status === 1 && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <button className="btn-approve" disabled={processing[id]} onClick={() => approve(id)}>
                      {processing[id] ? <span className="spinner" /> : "✅ Approuver"}
                    </button>
                    <input
                      className="input"
                      placeholder="Raison du rejet..."
                      value={rejectReason[id] || ""}
                      onChange={e => setRejectReason(r => ({ ...r, [id]: e.target.value }))}
                    />
                    <button className="btn-danger" disabled={processing[id]} onClick={() => reject(id)}>
                      {processing[id] ? <span className="spinner" /> : "❌ Rejeter"}
                    </button>
                  </div>
                )}

                {t.status === 4 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ padding: "10px 14px", background: "var(--info-dim)", borderRadius: 8, fontSize: 13, color: "var(--info)", marginBottom: 12 }}>
                      ⚠️ Décès signalé — vérifiez le certificat
                    </div>
                    <button className="btn-gold-action" disabled={processing[id]} onClick={() => confirmDeath(id)}>
                      {processing[id] ? <span className="spinner" /> : "✅ Confirmer le décès et exécuter"}
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
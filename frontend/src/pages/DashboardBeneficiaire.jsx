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

export default function DashboardBeneficiaire() {
  const { user, getContract } = useAuth();
  const [testaments, setTestaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState({});
  const [certFile, setCertFile] = useState({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await getContract();
      const ids = await c.getHeirTestaments(user.walletAddress);
      console.log("heir testament ids:", ids);
      const tests = await Promise.all(ids.map(id => c.getTestament(id)));
      setTestaments(tests.map((t, i) => ({
        id: ids[i],
        testator: t[1],
        status: Number(t[5]),
        deathCertificateCid: t[8],
      })));
    } catch (e) {
      toast.error("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function reportDeath(id) {
    const file = certFile[id];
    if (!file) return toast.error("Ajoutez le certificat de décès");
    try {
      setReporting(r => ({ ...r, [id]: true }));
      const fakeCid = "death_cert_" + Date.now();
      const c = await getContract(true);
      const tx = await c.reportDeath(id, fakeCid);
      await tx.wait();
      toast.success("Décès signalé — le notaire va confirmer");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setReporting(r => ({ ...r, [id]: false }));
    }
  }

  if (loading) return (
    <div className="page-container" style={{ textAlign: "center", paddingTop: 120 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className="page-container">
      <h1 className="page-title">Espace Héritier</h1>
      <p className="page-subtitle">Testaments dont vous êtes bénéficiaire</p>

      {testaments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--text-muted)" }}>Aucun testament disponible.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {testaments.map((t, i) => {
            const s = STATUS_LABEL[t.status] || STATUS_LABEL[2];
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

                {t.status === 2 && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ padding: "10px 14px", background: "var(--warning-dim)", borderRadius: 8, fontSize: 13, color: "var(--warning)" }}>
                      Le testament est approuvé. Si le testateur est décédé, signalez le décès.
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      className="input"
                      style={{ padding: "10px 16px" }}
                      onChange={e => setCertFile(f => ({ ...f, [id]: e.target.files[0] }))}
                    />
                    <button className="btn-gold-action" disabled={reporting[id]} onClick={() => reportDeath(id)}>
                      {reporting[id] ? <span className="spinner" /> : "⚠️ Signaler le décès"}
                    </button>
                  </div>
                )}

                {t.status === 4 && (
                  <div style={{ padding: "10px 14px", background: "var(--info-dim)", borderRadius: 8, fontSize: 13, color: "var(--info)" }}>
                    Décès signalé — en attente de confirmation du notaire...
                  </div>
                )}

                {t.status === 5 && (
                  <div style={{ padding: "10px 14px", background: "var(--success-dim)", borderRadius: 8, fontSize: 13, color: "var(--success)" }}>
                    ✅ Testament exécuté — vous avez accès à l'héritage.
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
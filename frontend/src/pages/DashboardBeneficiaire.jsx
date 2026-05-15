import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { decryptWithStoredKey } from "../services/encryption";
export default function DashboardBeneficiaire() {
  const { user, getContract } = useAuth();
  const [testaments, setTestaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_reporting, setReporting] = useState({});
  const [certFile, setCertFile] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await getContract();
      const ids = await c.getHeirTestaments(user.walletAddress);
      const tests = await Promise.all(ids.map((id) => c.getTestament(id)));
      setTestaments(
        tests.map((t, i) => ({
          id: ids[i],
          testator: t[1],
          status: Number(t[5]),
        }))
      );
    } catch (e) {
      toast.error("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function reportDeath(id) {
    if (!certFile[id]) return toast.error("Ajoutez le certificat de décès");
    try {
      setReporting((r) => ({ ...r, [id]: true }));
      const fakeCid = "death_cert_" + Date.now();
      const c = await getContract(true);
      const tx = await c.reportDeath(id, fakeCid);
      await tx.wait();
      toast.success("Décès signalé !");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setReporting((r) => ({ ...r, [id]: false }));
    }
  }

  async function decryptAndView(id) {
    try {
      toast("Récupération document...", { icon: "⏳" });
      const c = await getContract();
      const heirs = await c.getTestamentHeirs(id);
      const myInfo = heirs.find(
        (h) =>
          h.walletAddress.toLowerCase() === user.walletAddress.toLowerCase()
      );

      if (!myInfo?.encryptedCid) return toast.error("Document non disponible");

      const res = await fetch(
        `https://gateway.pinata.cloud/ipfs/${myInfo.encryptedCid}`
      );
      const encryptedJson = await res.json();

      toast("Déchiffrement personnel...", { icon: "🔐" });
      const pdfBlob = await decryptWithStoredKey(
        encryptedJson.ciphertext,
        encryptedJson.nonce,
        encryptedJson.ephemPublicKey
      );
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (e) {
      toast.error("Erreur: " + e.message);
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
      <h1 className="page-title">Espace Héritier</h1>
      <p className="page-subtitle">Vos droits successoraux</p>

      {testaments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p>Aucun testament vous concernant.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {testaments.map((t, i) => {
            const status = t.status;
            return (
              <div key={i} className="card">
                {status <= 2 && (
                  <div
                    style={{
                      padding: 15,
                      background: "var(--accent-dim)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      📜 Un testament vous concerne
                    </div>
                    <p style={{ fontSize: 12 }}>
                      Il sera accessible après confirmation du décès.
                    </p>
                    {status === 2 && (
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            setCertFile((f) => ({
                              ...f,
                              [t.id]: e.target.files[0],
                            }))
                          }
                        />
                        <button
                          className="btn-gold-action"
                          onClick={() => reportDeath(t.id)}
                        >
                          ⚠️ Signaler Décès
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {status === 4 && (
                  <div className="badge-info">
                    ⏳ Décès signalé - En attente Notaire
                  </div>
                )}

                {status === 5 && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div className="badge-success">✅ Testament exécuté</div>
                    <button
                      className="btn-gold-action"
                      onClick={() => decryptAndView(t.id)}
                    >
                      🔓 Déchiffrer mon testament
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

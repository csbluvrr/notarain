import { uploadToPinata } from "../services/pinata";
import { encryptFile } from "../services/encryption";
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

export default function DashboardTestateur() {
  const { user, getContract } = useAuth();
  const [testaments, setTestaments] = useState([]);
  const [notaries, setNotaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedNotary, setSelectedNotary] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [heirs, setHeirs] = useState([{ address: "", name: "", share: "" }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const c = await getContract();
      const notaryAddrs = await c.getNotaries();
      const notaryInfos = await Promise.all(
        notaryAddrs.map((a) => c.getNotaryInfo(a))
      );
      setNotaries(
        notaryInfos
          .filter((n) => n.isActive)
          .map((n, i) => ({
            address: notaryAddrs[i],
            name: n.name,
          }))
      );
      const ids = await c.getTestatorTestaments(user.walletAddress);
      const tests = await Promise.all(ids.map((id) => c.getTestament(id)));
      setTestaments(
        tests.map((t, i) => ({
          id: ids[i],
          testator: t[1],
          assignedNotary: t[2],
          ipfsCid: t[3],
          status: Number(t[5]),
          rejectionReason: t[9],
        }))
      );
    } catch (e) {
      toast.error("Erreur chargement: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedNotary) return toast.error("Choisissez un notaire");
    if (!pdfFile) return toast.error("Ajoutez un fichier PDF");
    if (heirs.some((h) => !h.address || !h.name || !h.share))
      return toast.error("Remplissez tous les héritiers");
    const totalShare = heirs.reduce((s, h) => s + Number(h.share), 0);
    if (totalShare !== 100)
      return toast.error("Les parts doivent totaliser 100%");

    try {
      setSubmitting(true);

      // 1. Récupérer clé publique du notaire
      toast("Récupération clé notaire...", { icon: "🔑" });
      const c = await getContract();
      const notaryInfo = await c.getNotaryInfo(selectedNotary);
      const notaryPublicKey = notaryInfo.publicKey;

      // 2. Hash du PDF original
      const arrayBuffer = await pdfFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex =
        "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // 3. Chiffrer avec clé publique notaire
      toast("Chiffrement en cours...", { icon: "🔐" });
      const encryptedFile = await encryptFile(pdfFile, notaryPublicKey);

      // 4. Upload fichier chiffré sur IPFS
      toast("Upload sur IPFS...", { icon: "⏳" });
      const cid = await uploadToPinata(encryptedFile);
      toast.success("Testament chiffré et uploadé sur IPFS !");

      // 5. Stocker CID + hash sur blockchain
      const contract = await getContract(true);
      const tx = await contract.createTestament(
        cid,
        hashHex,
        selectedNotary,
        heirs.map((h) => h.address),
        heirs.map((h) => h.name),
        heirs.map((h) => Number(h.share))
      );
      await tx.wait();
      toast.success("Testament déposé sur la blockchain !");
      setShowForm(false);
      setPdfFile(null);
      setHeirs([{ address: "", name: "", share: "" }]);
      setSelectedNotary("");
      loadData();
    } catch (e) {
      toast.error("Erreur: " + (e.reason || e.message));
    } finally {
      setSubmitting(false);
    }
  }

  function addHeir() {
    setHeirs([...heirs, { address: "", name: "", share: "" }]);
  }
  function removeHeir(i) {
    setHeirs(heirs.filter((_, idx) => idx !== i));
  }
  function updateHeir(i, field, val) {
    const u = [...heirs];
    u[i][field] = val;
    setHeirs(u);
  }

  if (loading)
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: 120 }}
      >
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );

  return (
    <div className="page-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 className="page-title">Mes Testaments</h1>
          <p className="page-subtitle">
            Gérez vos testaments sur la blockchain
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "+ Déposer un testament"}
        </button>
      </div>

      {showForm && (
        <div
          className="card"
          style={{ marginBottom: 32, borderColor: "var(--accent)" }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 24 }}>Nouveau Testament</h2>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Notaire assigné
            </label>
            <select
              className="input"
              value={selectedNotary}
              onChange={(e) => setSelectedNotary(e.target.value)}
            >
              <option value="">-- Choisir un notaire --</option>
              {notaries.map((n) => (
                <option key={n.address} value={n.address}>
                  {n.name} ({n.address.slice(0, 6)}...{n.address.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Fichier Testament (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              className="input"
              onChange={(e) => setPdfFile(e.target.files[0])}
              style={{ padding: "10px 16px" }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Héritiers
              </label>
              <button
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: 13 }}
                onClick={addHeir}
              >
                + Ajouter
              </button>
            </div>
            {heirs.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 80px 40px",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  className="input"
                  placeholder="Adresse wallet (0x...)"
                  value={h.address}
                  onChange={(e) => updateHeir(i, "address", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Nom"
                  value={h.name}
                  onChange={(e) => updateHeir(i, "name", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="%"
                  type="number"
                  value={h.share}
                  onChange={(e) => updateHeir(i, "share", e.target.value)}
                />
                <button
                  className="btn-danger"
                  style={{ padding: "8px" }}
                  onClick={() => removeHeir(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" /> Dépôt en cours...
              </>
            ) : (
              "Déposer sur la blockchain"
            )}
          </button>
        </div>
      )}

      {testaments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
            Aucun testament déposé pour l'instant.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {testaments.map((t, i) => {
            const s = STATUS_LABEL[Number(t.status)] || STATUS_LABEL[1];
            return (
              <div key={i} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Testament #{String(t.id)}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "var(--text-secondary)" }}
                    >
                      Notaire: {String(t.assignedNotary).slice(0, 6)}...
                      {String(t.assignedNotary).slice(-4)}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      background: s.color + "22",
                      border: `1px solid ${s.color}`,
                      color: s.color,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {t.rejectionReason ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      background: "var(--danger-dim)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--danger)",
                    }}
                  >
                    Raison du rejet: {t.rejectionReason}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


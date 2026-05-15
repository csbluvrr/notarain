import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api.js";
import toast from "react-hot-toast";
import {
  decryptWithStoredKey,
  encryptFileForAddress,
} from "../services/encryption";
import { uploadToPinata } from "../services/pinata";
import { ethers } from "ethers";

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
  const [_heirCounts, setHeirCounts] = useState({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadData();
    const autoFetchKey = async () => {
      const stored = localStorage.getItem("notaryKeys");

      // Only fetch if no keys exist
      if (!stored) {
        await handleDownloadAndImportKey();
      }
    };

    autoFetchKey();
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
      const pdfBlob = await decryptWithStoredKey(
        encryptedJson.ciphertext,
        encryptedJson.nonce,
        encryptedJson.ephemPublicKey
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
      const pdfBlob = await decryptWithStoredKey(
        encryptedJson.ciphertext,
        encryptedJson.nonce,
        encryptedJson.ephemPublicKey
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

  const handleDownloadAndImportKey = async () => {
    setImporting(true);

    try {
      // 1. Get current wallet address
      if (!window.ethereum) {
        toast.error("Veuillez installer MetaMask!");
        setImporting(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log("User address:", userAddress);

      // 2. Fetch the key file from server
      toast("📥 Téléchargement de la clé...");

      const response = await api.get(
        `/api/notary/download-notary-key/${userAddress}`
      );

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Important: With axios, the response data is in response.data
      const keyData = response.data;

      console.log("Parsed key data:", keyData);
      console.log("Key data has publicKey?", !!keyData.publicKey);
      console.log("Key data has secretKey?", !!keyData.secretKey);

      // 4. Verify wallet address matches
      if (userAddress.toLowerCase() !== keyData.notaryAddress.toLowerCase()) {
        console.error("Address mismatch:", userAddress, keyData.notaryAddress);
        toast.error("Erreur: La clé ne correspond pas à ce portefeuille");
        setImporting(false);
        return;
      }

      // 5. Store in localStorage
      const keysToStore = {
        publicKey: keyData.publicKey,
        secretKey: keyData.secretKey,
        notaryAddress: keyData.notaryAddress,
        importedAt: new Date().toISOString(),
      };

      console.log("Storing in localStorage:", keysToStore);

      localStorage.setItem("notaryKeys", JSON.stringify(keysToStore));

      // Verify it was stored
      const stored = localStorage.getItem("notaryKeys");
      console.log("Verified stored data:", stored);

      if (stored) {
        toast("✅ Clé importée avec succès!", "success");

        // Refresh page or update state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error("Erreur: Impossible de sauvegarder la clé", "error");
      }
    } catch (error) {
      console.error("Import error details:", error);
      console.error("Error response:", error.response);
      toast.error(`Erreur: ${error.message}`, "error");
    } finally {
      setImporting(false);
    }
  };

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Espace Notaire
          </h1>
          <p className="page-subtitle" style={{ marginTop: 8 }}>
            Gérez les testaments assignés
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleDownloadAndImportKey}
          disabled={importing}
        >
          {importing ? <span className="spinner" /> : "🔑"}
          Récupérer la clé de Déchiffrement
        </button>
      </div>

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

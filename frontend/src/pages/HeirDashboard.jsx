import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import useAuth from "../hooks/useAuth";
import { useDemoMode } from "../demo/DemoContext";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

function truncateAddress(address = "") {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", { month: "long", day: "numeric", year: "numeric" });
}

function TriggerDownload({ open, item, onClose, isDemoMode, demoDecryptDocument }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !item) return null;

  const download = async () => {
    if (!password) {
      setError("Mot de passe requis.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (isDemoMode) {
        await demoDecryptDocument(item, password);
        toast.success("Document téléchargé");
        onClose?.();
      } else {
        const res = await fetch(`${PINATA_GATEWAY}/${item.ipfsCid}`);
        if (!res.ok) throw new Error("Impossible de récupérer le fichier chiffré");
        const encryptedArrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(encryptedArrayBuffer);

        if (bytes.length < 32) throw new Error("Payload chiffré invalide");
        const iv = bytes.slice(0, 16);
        const authTag = bytes.slice(16, 32);
        const cipher = bytes.slice(32);
        const merged = new Uint8Array(cipher.length + authTag.length);
        merged.set(cipher, 0);
        merged.set(authTag, cipher.length);

        const passBytes = ethers.toUtf8Bytes(password, "NFKC");
        const saltBytes = ethers.toUtf8Bytes("notarain-salt");
        const keyHex = ethers.scryptSync(passBytes, saltBytes, 16384, 8, 1, 32);
        const key = await crypto.subtle.importKey(
          "raw",
          ethers.getBytes(keyHex),
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        );

        const plain = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv, tagLength: 128 },
          key,
          merged
        );

        const blob = new Blob([plain], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = item.originalFileName || "testament.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast.success("Document téléchargé");
        onClose?.();
      }
    } catch (err) {
      setError("Mot de passe incorrect. Veuillez vérifier avec le testateur.");
      toast.error(err?.message || "Échec du déchiffrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200 }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, calc(100vw - 32px))",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <h3 style={{ fontSize: 28 }}>Déchiffrer & télécharger</h3>
        <p style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 14 }}>
          Entrez le mot de passe de chiffrement fourni par le testateur pour déchiffrer et télécharger ce document.
        </p>
        <div style={{ marginTop: 14 }}>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Encryption password"
          />
          {error ? <div className="inline-error">{error}</div> : null}
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={download} disabled={loading}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" /> Téléchargement...
              </span>
            ) : (
              "Télécharger le document"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrityModal({ open, item, onClose, onVerify }) {
  const [file, setFile] = useState(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setChecking(false);
    setResult(null);
  }, [open]);

  if (!open || !item) return null;

  const pick = async (f) => {
    setFile(f);
    setChecking(true);
    setResult(null);
    try {
      const res = await onVerify?.(item, f);
      setResult(res || null);
    } catch (err) {
      toast.error(err?.message || "Échec de la vérification");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 210 }}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, calc(100vw - 32px))",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <h3 style={{ fontSize: 26 }}>Vérification d’intégrité (blockchain)</h3>
        <p style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 14 }}>
          Importez un document pour comparer son hash avec l’enregistrement on-chain.
        </p>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Hash on-chain</div>
          <code
            style={{
              display: "block",
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 12px",
              color: "var(--accent)",
              fontFamily: "monospace",
              fontSize: 12,
              wordBreak: "break-all"
            }}
          >
            {item.documentHash}
          </code>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", marginBottom: 6, color: "var(--text-secondary)", fontSize: 13 }}>
            Importer un document à vérifier
          </label>
          <input
            type="file"
            className="input"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f) pick(f);
            }}
          />
          {file ? <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 12 }}>{file.name}</div> : null}
        </div>

        {checking ? (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
            <span className="spinner" /> Vérification...
          </div>
        ) : null}

        {result?.verified ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "var(--success-dim)",
                  border: "1px solid var(--success)",
                  color: "var(--success)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700
                }}
              >
                ✓
              </div>
              <div style={{ color: "var(--success)", fontSize: 14 }}>Intégrité du document vérifiée</div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 6, color: "var(--text-secondary)", fontSize: 13 }}>
              <div>
                Hash on-chain : <span style={{ fontFamily: "monospace", color: "var(--accent)" }}>{result.onChainHash}</span>
              </div>
              <div>
                Hash calculé : <span style={{ fontFamily: "monospace", color: "var(--accent)" }}>{result.computedHash}</span>
              </div>
              <div style={{ color: "var(--success)" }}>Correspondance : ✓ Identique</div>
            </div>

            <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 12 }}>
              Cela confirme que le document n’a pas été modifié depuis son enregistrement sur la blockchain.
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HeirDashboard() {
  const { user } = useAuth();
  const { isDemoMode, demoUser, heirTestaments, demoDecryptDocument, demoVerifyHash } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [verifyItem, setVerifyItem] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/heir/testaments");
      setItems(res?.data?.testaments || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load inheritances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setItems(heirTestaments || []);
      setLoading(false);
      return;
    }
    load();
  }, [isDemoMode, heirTestaments]);

  const executedCount = useMemo(() => items.filter((t) => t.status === "executed").length, [items]);

  return (
    <section className="page-container">
      <h1 className="page-title">Mes héritages</h1>
      <p className="page-subtitle">Testaments où vous êtes désigné comme bénéficiaire</p>

      <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--accent)", fontSize: 18 }}>🔒</span>
        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Les documents sont accessibles uniquement après confirmation du décès par le notaire et exécution du testament.
        </span>
      </div>

      <div style={{ marginBottom: 10, color: "var(--text-muted)", fontSize: 13 }}>
        Accessible maintenant : <span style={{ color: "var(--accent)" }}>{executedCount}</span>
      </div>

      {loading ? (
        <div className="card">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ color: "var(--text-secondary)" }}>
          Aucun héritage trouvé pour votre portefeuille.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((t) => (
            <div key={t._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    Testateur : {truncateAddress(t.testatorWallet)}
                  </div>
                  <div style={{ marginTop: 4 }}>{t.originalFileName}</div>
                  <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 12 }}>
                    {formatDate(t.updatedAt || t.createdAt)}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {(t.heirs || []).find((h) => h.walletAddress === String((isDemoMode ? demoUser?.walletAddress : user?.walletAddress) || "").toLowerCase())?.share ||
                    "Part disponible dans le testament"}
                </div>
                {t.status === "executed" ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {isDemoMode ? (
                      <button className="btn-secondary" style={{ padding: "10px 14px" }} onClick={() => setVerifyItem(t)}>
                        Vérifier l’intégrité
                      </button>
                    ) : null}
                    <button className="btn-primary" onClick={() => setModalItem(t)}>
                      Accéder au document
                    </button>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span>🔒</span> En attente d’exécution
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TriggerDownload
        open={Boolean(modalItem)}
        item={modalItem}
        onClose={() => setModalItem(null)}
        isDemoMode={isDemoMode}
        demoDecryptDocument={demoDecryptDocument}
      />

      <IntegrityModal
        open={Boolean(verifyItem)}
        item={verifyItem}
        onClose={() => setVerifyItem(null)}
        onVerify={async (testament) => demoVerifyHash(testament)}
      />
    </section>
  );
}


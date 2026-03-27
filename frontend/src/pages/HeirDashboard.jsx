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
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (isDemoMode) {
        await demoDecryptDocument(item, password);
        toast.success("Document downloaded");
        onClose?.();
      } else {
        const res = await fetch(`${PINATA_GATEWAY}/${item.ipfsCid}`);
        if (!res.ok) throw new Error("Unable to fetch encrypted file");
        const encryptedArrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(encryptedArrayBuffer);

        if (bytes.length < 32) throw new Error("Invalid encrypted payload");
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
        toast.success("Document downloaded");
        onClose?.();
      }
    } catch (err) {
      setError("Incorrect password. Please verify with the testator.");
      toast.error(err?.message || "Decryption failed");
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
        <h3 style={{ fontSize: 28 }}>Decrypt & Download</h3>
        <p style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 14 }}>
          Enter the encryption password provided by the testator to decrypt and download this document.
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
            Cancel
          </button>
          <button className="btn-primary" onClick={download} disabled={loading}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" /> Downloading...
              </span>
            ) : (
              "Download Document"
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
      toast.error(err?.message || "Verification failed");
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
        <h3 style={{ fontSize: 26 }}>Blockchain Integrity Verification</h3>
        <p style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 14 }}>
          Upload a document to verify its hash against the on-chain record.
        </p>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>On-chain hash</div>
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
            Upload document to verify
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
            <span className="spinner" /> Verifying...
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
              <div style={{ color: "var(--success)", fontSize: 14 }}>Document integrity verified</div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 6, color: "var(--text-secondary)", fontSize: 13 }}>
              <div>
                On-chain hash: <span style={{ fontFamily: "monospace", color: "var(--accent)" }}>{result.onChainHash}</span>
              </div>
              <div>
                Computed hash: <span style={{ fontFamily: "monospace", color: "var(--accent)" }}>{result.computedHash}</span>
              </div>
              <div style={{ color: "var(--success)" }}>Match: ✓ Identical</div>
            </div>

            <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 12 }}>
              This confirms the document has not been modified since it was registered on the blockchain.
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
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
      <h1 className="page-title">My Inheritances</h1>
      <p className="page-subtitle">Testaments where you are a designated beneficiary</p>

      <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--accent)", fontSize: 18 }}>🔒</span>
        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Documents are only accessible after the notary has confirmed the testator&apos;s passing and the testament is marked as Executed.
        </span>
      </div>

      <div style={{ marginBottom: 10, color: "var(--text-muted)", fontSize: 13 }}>
        Accessible now: <span style={{ color: "var(--accent)" }}>{executedCount}</span>
      </div>

      {loading ? (
        <div className="card">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ color: "var(--text-secondary)" }}>
          No inheritances found for your wallet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((t) => (
            <div key={t._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    Testator: {truncateAddress(t.testatorWallet)}
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
                    "Heir share available in testament record"}
                </div>
                {t.status === "executed" ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {isDemoMode ? (
                      <button className="btn-secondary" style={{ padding: "10px 14px" }} onClick={() => setVerifyItem(t)}>
                        Verify Integrity
                      </button>
                    ) : null}
                    <button className="btn-primary" onClick={() => setModalItem(t)}>
                      Access Document
                    </button>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span>🔒</span> Awaiting execution
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


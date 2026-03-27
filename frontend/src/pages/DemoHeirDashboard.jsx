import React, { useState } from "react";
import toast from "react-hot-toast";
import { demoHeirTestaments } from "../demo/demoData";

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

function DemoDownloadModal({ open, item, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !item) return null;

  const download = async () => {
    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await new Promise((r) => setTimeout(r, 1000));

      const content =
        "NOTARAIN - DECRYPTED TESTAMENT\n\n" +
        "Testator: Mouna Jaimi\n" +
        "Wallet: 0x4959...8b51\n" +
        "Date: February 15, 2026\n" +
        "Validated by: Pr. Chadli Saad\n" +
        "Blockchain TX: #7\n\n" +
        "--- TESTAMENT CONTENT ---\n\n" +
        "I, Mouna Jaimi, being of sound mind, hereby declare this my last will and testament.\n\n" +
        "I designate Sara Gorfti (0x2b8e...a047) as my sole beneficiary and heir to 100% of my estate.\n\n" +
        "This document has been cryptographically sealed and validated on the Ethereum blockchain.\n" +
        "Document Hash: 0xa3f8...2b3\n" +
        "IPFS CID: QmX7kL...Q6r\n\n" +
        "Signed and encrypted: February 15, 2026\n" +
        "Notary validation: March 20, 2026";

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "testament_mouna_jaimi_DECRYPTED.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document decrypted and downloaded successfully");
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Download failed");
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
          width: "min(480px, calc(100vw - 32px))",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <h3 style={{ fontSize: 26 }}>Decrypt & Download</h3>
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
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Hint: provided by the testator privately
          </div>
          {error ? <div className="inline-error">{error}</div> : null}
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={download} disabled={loading}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" /> Decrypting...
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

export default function DemoHeirDashboard() {
  const [modalItem, setModalItem] = useState(null);

  return (
    <section className="page-container">
      <h1 className="page-title">My Inheritances (Demo)</h1>
      <p className="page-subtitle">Testaments where you are a designated beneficiary</p>

      <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--accent)", fontSize: 18 }}>🔒</span>
        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Documents are only accessible after the notary has confirmed the testator&apos;s passing and the
          testament is marked as Executed.
        </span>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {demoHeirTestaments.map((t) => (
          <div key={t._id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  Testator: {truncateAddress(t.testatorWallet)}
                </div>
                <div style={{ marginTop: 4 }}>{t.originalFileName}</div>
                <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 12 }}>
                  {formatDate(t.createdAt)}
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{t.myShare}</div>
              {t.status === "executed" ? (
                <button className="btn-primary" onClick={() => setModalItem(t)}>
                  Access Document
                </button>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: 13, display: "inline-flex", gap: 6 }}>
                  <span>🔒</span> Awaiting execution
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <DemoDownloadModal open={Boolean(modalItem)} item={modalItem} onClose={() => setModalItem(null)} />
    </section>
  );
}


import React, { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import StatusBadge from "./StatusBadge";
import TestamentTimeline from "./TestamentTimeline";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function truncateMiddle(text, left = 10, right = 6) {
  const s = String(text || "");
  if (!s) return "-";
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

export default function TestamentDetailModal({
  open,
  testament,
  onClose,
  onVerifyIntegrity,
  verifyingIntegrity = false,
  integrityResult = null
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const ipfsLink = useMemo(() => {
    if (!testament?.ipfsCid) return null;
    return `${PINATA_GATEWAY}/${testament.ipfsCid}`;
  }, [testament?.ipfsCid]);

  const etherscanLink = useMemo(() => {
    if (!testament?.txHash) return null;
    return `https://sepolia.etherscan.io/tx/${testament.txHash}`;
  }, [testament?.txHash]);

  if (!open || !testament) return null;

  const copy = async (value, label = "Copié") => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      toast.success(label);
    } catch {
      toast.error("Échec de la copie");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 220
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(920px, calc(100vw - 32px))",
          maxHeight: "min(86vh, 860px)",
          overflow: "auto",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 240 }}>
            <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond', serif" }}>{testament.originalFileName}</div>
            <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 12 }}>
              Créé : {formatDateTime(testament.createdAt)} · Mis à jour : {formatDateTime(testament.updatedAt || testament.createdAt)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
            <StatusBadge status={testament.status} />
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: "8px 12px" }}>
              Fermer
            </button>
          </div>
        </div>

        {testament.status === "rejected" && testament.rejectionReason ? (
          <div
            style={{
              marginTop: 16,
              background: "var(--danger-dim)",
              border: "1px solid var(--danger)",
              borderRadius: 10,
              padding: "12px 14px",
              color: "var(--danger)"
            }}
          >
            Rejeté : <span style={{ color: "var(--text-primary)" }}>{testament.rejectionReason}</span>
          </div>
        ) : null}

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          <div className="card" style={{ background: "var(--surface-2)", padding: 16 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>Stockage</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              IPFS CID:{" "}
              {ipfsLink ? (
                <a href={ipfsLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontFamily: "monospace" }}>
                  {truncateMiddle(testament.ipfsCid, 16, 8)}
                </a>
              ) : (
                "-"
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              Hash : <span style={{ fontFamily: "monospace" }}>{truncateMiddle(testament.documentHash, 18, 8)}</span>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginLeft: 8, padding: "2px 8px", fontSize: 11 }}
                onClick={() => copy(testament.documentHash, "Hash copié")}
              >
                Copier
              </button>
            </div>
          </div>

          <div className="card" style={{ background: "var(--surface-2)", padding: 16 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>Blockchain</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Blockchain ID: <span style={{ color: "var(--text-primary)" }}>#{testament.blockchainId ?? "-"}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              TX:{" "}
              {etherscanLink ? (
                <a href={etherscanLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontFamily: "monospace" }}>
                  {truncateMiddle(testament.txHash, 16, 10)}
                </a>
              ) : (
                "-"
              )}
            </div>
          </div>

          <div className="card" style={{ background: "var(--surface-2)", padding: 16 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>Acteurs</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Testateur : <span style={{ fontFamily: "monospace" }}>{truncateMiddle(testament.testatorWallet, 10, 6)}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              Notaire :{" "}
              <span style={{ fontFamily: "monospace" }}>{testament.notaryWallet ? truncateMiddle(testament.notaryWallet, 10, 6) : "-"}</span>
            </div>
          </div>
        </div>

        {Array.isArray(testament.heirs) && testament.heirs.length > 0 ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 10 }}>Bénéficiaires</div>
            <div style={{ display: "grid", gap: 8 }}>
              {testament.heirs.map((h, idx) => (
                <div
                  key={`${h.walletAddress}-${idx}`}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ color: "var(--text-secondary)" }}>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{h.name}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{truncateMiddle(h.walletAddress, 10, 6)}</div>
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13, alignSelf: "center" }}>{h.share}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {onVerifyIntegrity ? (
            <button type="button" className="btn-secondary" onClick={onVerifyIntegrity} disabled={verifyingIntegrity}>
              {verifyingIntegrity ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" /> Vérification...
                </span>
              ) : (
                "Vérifier l’intégrité du document"
              )}
            </button>
          ) : null}

          {integrityResult?.verified ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "var(--success-dim)",
                border: "1px solid var(--success)",
                color: "var(--success)",
                fontSize: 13
              }}
            >
              ✓ Intégrité vérifiée
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 12 }}>Historique</div>
          <TestamentTimeline events={testament.timeline || []} />
        </div>
      </div>
    </div>
  );
}


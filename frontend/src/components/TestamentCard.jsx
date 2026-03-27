import React from "react";
import StatusBadge from "./StatusBadge";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function truncateMiddle(text, left = 10, right = 4) {
  const s = String(text || "");
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

export default function TestamentCard({ testament, actions = null, isDemo = false }) {
  const {
    originalFileName,
    status,
    createdAt,
    blockchainId,
    ipfsCid
  } = testament || {};

  const cidDisplay = ipfsCid ? truncateMiddle(ipfsCid) : "";
  const hasBlockchainId = blockchainId !== undefined && blockchainId !== null && Number(blockchainId) > 0;

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 border rounded-lg flex items-center justify-center shrink-0" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M14 3v6h6" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="font-medium text-base truncate">{originalFileName || "Untitled Testament"}</div>
            <StatusBadge status={status} />
          </div>

          <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {formatDate(createdAt)}
          </div>

          {hasBlockchainId ? (
            <div className="mt-2 text-xs" style={{ color: "var(--success)", display: "flex", gap: 8, alignItems: "center" }}>
              <span>Chain ID: {blockchainId}</span>
              {isDemo ? (
                <span
                  style={{
                    background: "var(--surface-3)",
                    color: "var(--text-muted)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 10
                  }}
                >
                  SIMULATED
                </span>
              ) : null}
            </div>
          ) : null}

          {ipfsCid ? (
            <div className="mt-1 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              {cidDisplay}
            </div>
          ) : null}
        </div>
      </div>

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}


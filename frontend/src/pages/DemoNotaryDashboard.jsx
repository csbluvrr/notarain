import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDemoMode } from "../demo/DemoContext";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";

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

export default function DemoNotaryDashboard() {
  const {
    demoUser,
    demoPending,
    demoAllNotary,
    approveTestament,
    rejectTestament,
    executeTestament
  } = useDemoMode();

  const [tab, setTab] = useState("pending");
  const [modal, setModal] = useState({ open: false, type: null, item: null });
  const [actionLoading, setActionLoading] = useState("");

  const openModal = (type, item) => setModal({ open: true, type, item });
  const closeModal = () => setModal({ open: false, type: null, item: null });

  const meta = (() => {
    if (!modal.open || !modal.type) return null;
    if (modal.type === "approve") {
      return {
        title: "Confirm Approval",
        description: "This action will be recorded on the blockchain. The testator will be notified.",
        variant: "approve",
        confirmText: "Approve"
      };
    }
    if (modal.type === "reject") {
      return {
        title: "Confirm Rejection",
        description: "Are you sure you want to reject this testament?",
        variant: "danger",
        confirmText: "Reject"
      };
    }
    return {
      title: "Confirm Execution",
      description:
        "This will mark the testament as executed and grant heir access to the document. This action is irreversible.",
      variant: "gold",
      confirmText: "Confirm Execution"
    };
  })();

  const perform = async () => {
    if (!modal.item) return;
    const id = modal.item._id;
    try {
      setActionLoading(id);
      if (modal.type === "approve") {
        await new Promise((r) => setTimeout(r, 1500));
        approveTestament(id);
        toast.success("Testament approved and recorded on-chain");
      } else if (modal.type === "reject") {
        await new Promise((r) => setTimeout(r, 800));
        rejectTestament(id);
        toast.success("Testament rejected");
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        executeTestament(id);
        toast.success("Testament executed. Heirs have been granted access.");
      }
      closeModal();
    } finally {
      setActionLoading("");
    }
  };

  return (
    <section className="page-container">
      <h1 className="page-title">Review Panel (Demo)</h1>
      <p className="page-subtitle">
        Simulated notary: {demoUser?.name} ({truncateAddress(demoUser?.walletAddress || "")})
      </p>

      <div style={{ marginBottom: 20 }}>
        <span
          style={{
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            borderRadius: 999,
            fontSize: 12,
            padding: "5px 10px"
          }}
        >
          Certified Notary
        </span>
      </div>

      <div
        style={{
          display: "inline-flex",
          background: "var(--surface-2)",
          borderRadius: 8,
          padding: 4,
          marginBottom: 18
        }}
      >
        {[
          { key: "pending", label: "Pending" },
          { key: "all", label: "All Testaments" }
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                borderRadius: 6,
                border: active ? "1px solid var(--border)" : "1px solid transparent",
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {t.label}
              {t.key === "pending" && demoPending.length > 0 ? (
                <span
                  style={{
                    background: "var(--danger)",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "2px 8px",
                    fontSize: 11
                  }}
                >
                  {demoPending.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "pending" ? (
        <div style={{ display: "grid", gap: 12 }}>
          {demoPending.map((t) => (
            <div key={t._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {truncateAddress(t.testatorWallet)} · {formatDate(t.createdAt)}
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div style={{ marginTop: 8, fontSize: 16, fontWeight: 500 }}>{t.originalFileName}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                CID: {t.ipfsCid.slice(0, 14)}...{t.ipfsCid.slice(-6)}
                <a
                  href={`${PINATA_GATEWAY}/${t.ipfsCid}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: 8, color: "var(--accent)" }}
                >
                  ↗
                </a>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                Hash: {t.documentHash.slice(0, 18)}...{t.documentHash.slice(-8)}
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => openModal("approve", t)}
                  disabled={actionLoading === t._id}
                >
                  {actionLoading === t._id && modal.type === "approve" ? "Confirming..." : "Approve"}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => openModal("reject", t)}
                  disabled={actionLoading === t._id}
                >
                  {actionLoading === t._id && modal.type === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1.2fr 120px 150px 160px",
              gap: 8,
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: 12
            }}
          >
            <div>Testator</div>
            <div>File</div>
            <div>Status</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
          {demoAllNotary.map((t) => (
            <div
              key={t._id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1.2fr 120px 150px 160px",
                gap: 8,
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)"
              }}
            >
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{truncateAddress(t.testatorWallet)}</div>
              <div style={{ fontSize: 13 }}>{t.originalFileName}</div>
              <StatusBadge status={t.status} />
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatDate(t.createdAt)}</div>
              <div>
                {t.status === "approved" || t.status === "executed" ? (
                  <button
                    type="button"
                    className="btn-gold-action"
                    onClick={() => openModal("execute", t)}
                    disabled={actionLoading === t._id}
                  >
                    {actionLoading === t._id && modal.type === "execute" ? "Executing..." : "Confirm Death"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {meta ? (
        <ConfirmModal
          open={modal.open}
          title={meta.title}
          description={meta.description}
          confirmText={meta.confirmText}
          variant={meta.variant}
          onCancel={closeModal}
          onConfirm={perform}
        />
      ) : null}
    </section>
  );
}


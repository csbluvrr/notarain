import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { getContract } from "../hooks/useContract";
import useAuth from "../hooks/useAuth";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import LoadingSkeleton from "../components/LoadingSkeleton";

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

export default function NotaryDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: null, item: null });
  const [removingId, setRemovingId] = useState("");

  const pendingCount = pending.length;

  const load = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([api.get("/api/notary/pending"), api.get("/api/notary/all")]);
      setPending(pendingRes?.data?.testaments || []);
      setAll(allRes?.data?.testaments || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load notary data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (type, item) => setModal({ open: true, type, item });
  const closeModal = () => setModal({ open: false, type: null, item: null });

  const modalMeta = useMemo(() => {
    if (!modal.open || !modal.type) return null;
    if (modal.type === "approve") {
      return {
        title: "Approve Testament",
        description: "Are you sure you want to approve this testament?",
        confirmText: "Approve",
        variant: "approve"
      };
    }
    if (modal.type === "reject") {
      return {
        title: "Reject Testament",
        description: "Are you sure you want to reject this testament?",
        confirmText: "Reject",
        variant: "danger"
      };
    }
    return {
      title: "Confirm Death",
      description: "This action executes the testament. Continue?",
      confirmText: "Confirm Death",
      variant: "gold"
    };
  }, [modal]);

  const performAction = async () => {
    const item = modal.item;
    if (!item) return;
    try {
      setRemovingId(item._id);
      if (modal.type === "approve") {
        await api.post(`/api/notary/approve/${item._id}`);
        if (Number(item.blockchainId || 0) > 0) {
          const contract = await getContract();
          const tx = await contract.approveTestament(Number(item.blockchainId));
          await tx.wait();
        }
        toast.success("Testament approved");
      } else if (modal.type === "reject") {
        await api.post(`/api/notary/reject/${item._id}`);
        if (Number(item.blockchainId || 0) > 0) {
          const contract = await getContract();
          const tx = await contract.rejectTestament(Number(item.blockchainId));
          await tx.wait();
        }
        toast.success("Testament rejected");
      } else {
        await api.post(`/api/notary/execute/${item._id}`);
        if (Number(item.blockchainId || 0) > 0) {
          const contract = await getContract();
          const tx = await contract.confirmDeath(Number(item.blockchainId));
          await tx.wait();
        }
        toast.success("Death confirmed");
      }
      closeModal();
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Action failed");
    } finally {
      setRemovingId("");
    }
  };

  const copyHash = async (hash) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Document hash copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <section className="page-container">
      <h1 className="page-title">Review Panel</h1>
      <p className="page-subtitle">Connected notary: {truncateAddress(user?.walletAddress || "")}</p>

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
              {t.key === "pending" && pendingCount > 0 ? (
                <span style={{ background: "var(--danger)", color: "white", borderRadius: 10, padding: "2px 8px", fontSize: 11 }}>
                  {pendingCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card">
              <LoadingSkeleton width="30%" />
              <div style={{ height: 10 }} />
              <LoadingSkeleton width="60%" height={18} />
              <div style={{ height: 10 }} />
              <LoadingSkeleton width="40%" />
            </div>
          ))}
        </div>
      ) : tab === "pending" ? (
        <div style={{ display: "grid", gap: 12 }}>
          {pending.map((t) => (
            <div
              key={t._id}
              className="card"
              style={{ opacity: removingId === t._id ? 0.25 : 1, transition: "opacity 0.2s ease" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {truncateAddress(t.testatorWallet)} · {formatDate(t.createdAt)}
                </div>
                <StatusBadge status={t.status} />
              </div>

              <div style={{ fontWeight: 500, fontSize: 18, marginTop: 8 }}>{t.originalFileName}</div>
              <div style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 12, fontFamily: "monospace" }}>
                CID: {t.ipfsCid?.slice(0, 14)}...{t.ipfsCid?.slice(-6)}
                {t.ipfsCid ? (
                  <a
                    href={`${PINATA_GATEWAY}/${t.ipfsCid}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 8, color: "var(--accent)" }}
                  >
                    ↗
                  </a>
                ) : null}
              </div>
              <div style={{ marginTop: 5, color: "var(--text-secondary)", fontSize: 11, fontFamily: "monospace" }}>
                Hash: {String(t.documentHash || "").slice(0, 18)}...{String(t.documentHash || "").slice(-8)}
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginLeft: 8, padding: "2px 8px", fontSize: 11 }}
                  onClick={() => copyHash(t.documentHash)}
                >
                  Copy
                </button>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button className="btn-approve" onClick={() => openModal("approve", t)}>
                  Approve
                </button>
                <button className="btn-danger" onClick={() => openModal("reject", t)}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
          {all.map((t) => (
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
                  <button className="btn-gold-action" onClick={() => openModal("confirmDeath", t)}>
                    Confirm Death
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={modal.open}
        title={modalMeta?.title}
        description={modalMeta?.description}
        confirmText={modalMeta?.confirmText}
        variant={modalMeta?.variant}
        onCancel={closeModal}
        onConfirm={performAction}
      />
    </section>
  );
}


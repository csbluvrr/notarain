import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import TestamentCard from "../components/TestamentCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ManageHeirsModal from "../components/ManageHeirsModal";
import ConfirmModal from "../components/ConfirmModal";
import TestamentDetailModal from "../components/TestamentDetailModal";
import useAuth from "../hooks/useAuth";
import { useDemoMode } from "../demo/DemoContext";

function truncateAddress(address) {
  const v = String(address || "");
  if (v.length <= 10) return v;
  return `${v.slice(0, 6)}...${v.slice(-4)}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const {
    isDemoMode,
    demoUser,
    testaments: demoTestaments,
    demoSubmitTestament,
    demoDeleteTestament,
    demoRevokeTestament,
    demoVerifyHash
  } = useDemoMode();
  const [testaments, setTestaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manageTarget, setManageTarget] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // all | pending | approved | executed | draft
  const [detailTarget, setDetailTarget] = useState(null);
  const [integrityResult, setIntegrityResult] = useState(null);
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null });
  const [removingId, setRemovingId] = useState("");
  const [submittingId, setSubmittingId] = useState("");
  const [revokingId, setRevokingId] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/testament/my");
      setTestaments(res?.data?.testaments || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load testaments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDemoMode) {
      load();
      return;
    }
    setTestaments(demoTestaments || []);
    setLoading(false);
  }, [isDemoMode, demoTestaments]);

  const stats = useMemo(() => {
    const total = testaments.length;
    const pending = testaments.filter((t) => t.status === "pending").length;
    const approved = testaments.filter((t) => t.status === "approved").length;
    const executed = testaments.filter((t) => t.status === "executed").length;
    const draft = testaments.filter((t) => t.status === "draft").length;
    return { total, pending, approved, executed, draft };
  }, [testaments]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return testaments;
    return testaments.filter((t) => t.status === activeFilter);
  }, [testaments, activeFilter]);

  const toggleFilter = (key) => {
    setActiveFilter((prev) => (prev === key ? "all" : key));
  };

  const openDetails = (t) => {
    setIntegrityResult(null);
    setDetailTarget(t);
  };

  const closeDetails = () => {
    setIntegrityResult(null);
    setDetailTarget(null);
  };

  const verifyIntegrity = async () => {
    if (!isDemoMode || !detailTarget) return;
    try {
      setVerifyingIntegrity(true);
      const res = await demoVerifyHash(detailTarget);
      setIntegrityResult(res);
      toast.success("Document integrity verified");
    } catch (err) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const openConfirm = (type, item) => setConfirm({ open: true, type, item });
  const closeConfirm = () => setConfirm({ open: false, type: null, item: null });

  const confirmMeta = useMemo(() => {
    if (!confirm.open) return null;
    if (confirm.type === "deleteDraft") {
      return {
        title: "Delete Draft",
        description: "Are you sure you want to delete this draft? This cannot be undone.",
        confirmText: "Delete",
        variant: "danger"
      };
    }
    if (confirm.type === "revoke") {
      return {
        title: "Revoke Testament",
        description:
          "This will permanently revoke this testament on the blockchain. You will need to create and submit a new testament if you change your mind. This action is irreversible.",
        confirmText: "Revoke",
        variant: "danger"
      };
    }
    return null;
  }, [confirm]);

  const performConfirm = async () => {
    const t = confirm.item;
    if (!t) return;
    try {
      if (confirm.type === "deleteDraft") {
        setRemovingId(t._id);
        await demoDeleteTestament(t._id);
        toast.success("Draft deleted");
      } else if (confirm.type === "revoke") {
        setRevokingId(t._id);
        await demoRevokeTestament(t._id);
        toast.success("Testament revoked on blockchain");
      }
      closeConfirm();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setRemovingId("");
      setRevokingId("");
    }
  };

  const submitDraft = async (t) => {
    try {
      setSubmittingId(t._id);
      await demoSubmitTestament(t._id);
      toast.success("Submitted for notary review");
    } catch (err) {
      toast.error(err?.message || "Submit failed");
    } finally {
      setSubmittingId("");
    }
  };

  return (
    <section className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 className="page-title">My Testaments</h1>
          <p className="page-subtitle">Connected as {truncateAddress((isDemoMode ? demoUser?.walletAddress : user?.walletAddress) || "")}</p>
        </div>
        <Link to={isDemoMode ? "/demo/upload" : "/upload"} className="btn-primary" style={{ alignSelf: "start" }}>
          Upload New Testament
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 26 }}>
        {[
          { label: "Total Testaments", value: stats.total, key: "all" },
          { label: "Pending Review", value: stats.pending, key: "pending" },
          { label: "Approved", value: stats.approved, key: "approved" },
          { label: "Executed", value: stats.executed, key: "executed" },
          { label: "Draft", value: stats.draft, key: "draft" }
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            className="card"
            onClick={() => toggleFilter(s.key)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              borderColor: activeFilter === s.key ? "var(--accent)" : "var(--border)"
            }}
          >
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "var(--accent)" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card">
              <LoadingSkeleton width="45%" height={20} />
              <div style={{ height: 8 }} />
              <LoadingSkeleton width="28%" />
              <div style={{ height: 8 }} />
              <LoadingSkeleton width="32%" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "42px 24px" }}>
          <svg viewBox="0 0 24 24" width="38" height="38" style={{ margin: "0 auto", color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2h8l5 5v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
            <path d="M14 2v6h6" />
          </svg>
          <h3 style={{ fontSize: 24, marginTop: 10 }}>No testaments yet</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, marginBottom: 16 }}>
            Start by uploading your first encrypted testament document.
          </p>
          <Link to="/upload" className="btn-primary">
            Upload Testament
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((t) => (
            <div key={t._id} style={{ opacity: removingId === t._id ? 0.25 : 1, transition: "opacity 0.2s ease" }}>
              <TestamentCard
                testament={t}
                actions={
                  <>
                    <button className="btn-secondary" onClick={() => openDetails(t)}>
                      View Details
                    </button>

                    {isDemoMode && t.status === "draft" ? (
                      <button className="btn-primary" onClick={() => submitDraft(t)} disabled={submittingId === t._id}>
                        {submittingId === t._id ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span className="spinner" /> Submitting...
                          </span>
                        ) : (
                          "Submit for Review"
                        )}
                      </button>
                    ) : null}

                    {isDemoMode && t.status === "draft" ? (
                      <button className="btn-danger" onClick={() => openConfirm("deleteDraft", t)} disabled={removingId === t._id}>
                        Delete Draft
                      </button>
                    ) : null}

                    {t.status === "approved" ? (
                      <button className="btn-secondary" onClick={() => setManageTarget(t)}>
                        Manage Heirs
                      </button>
                    ) : null}

                    {isDemoMode && t.status === "approved" ? (
                      <button className="btn-secondary" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => openConfirm("revoke", t)} disabled={revokingId === t._id}>
                        Revoke
                      </button>
                    ) : null}
                  </>
                }
              />

              {isDemoMode && t.status === "rejected" && t.rejectionReason ? (
                <div
                  style={{
                    marginTop: 8,
                    background: "var(--danger-dim)",
                    border: "1px solid var(--danger)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: "var(--danger)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center"
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    Rejected: <span style={{ color: "var(--text-primary)" }}>{t.rejectionReason}</span>
                  </div>
                  <button type="button" className="btn-secondary" onClick={() => navigate("/demo/upload")}>
                    Resubmit
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <ManageHeirsModal
        open={Boolean(manageTarget)}
        testament={manageTarget}
        onClose={() => setManageTarget(null)}
        onSaved={() => {
          if (!isDemoMode) load();
        }}
      />

      <ConfirmModal
        open={confirm.open}
        title={confirmMeta?.title}
        description={confirmMeta?.description}
        confirmText={confirmMeta?.confirmText}
        variant={confirmMeta?.variant}
        onCancel={closeConfirm}
        onConfirm={performConfirm}
      />

      <TestamentDetailModal
        open={Boolean(detailTarget)}
        testament={detailTarget}
        onClose={closeDetails}
        onVerifyIntegrity={isDemoMode ? verifyIntegrity : null}
        verifyingIntegrity={verifyingIntegrity}
        integrityResult={integrityResult}
      />
    </section>
  );
}


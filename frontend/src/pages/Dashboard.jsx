import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import TestamentCard from "../components/TestamentCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ManageHeirsModal from "../components/ManageHeirsModal";
import useAuth from "../hooks/useAuth";

function truncateAddress(address) {
  const v = String(address || "");
  if (v.length <= 10) return v;
  return `${v.slice(0, 6)}...${v.slice(-4)}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [testaments, setTestaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manageTarget, setManageTarget] = useState(null);
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
    load();
  }, []);

  const stats = useMemo(() => {
    const total = testaments.length;
    const pending = testaments.filter((t) => t.status === "pending").length;
    const approved = testaments.filter((t) => t.status === "approved").length;
    return { total, pending, approved };
  }, [testaments]);

  return (
    <section className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 className="page-title">My Testaments</h1>
          <p className="page-subtitle">Connected as {truncateAddress(user?.walletAddress)}</p>
        </div>
        <Link to="/upload" className="btn-primary" style={{ alignSelf: "start" }}>
          Upload New Testament
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 26 }}>
        {[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Approved", value: stats.approved }
        ].map((s) => (
          <div key={s.label} className="card">
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "var(--accent)" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
          </div>
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
      ) : testaments.length === 0 ? (
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
          {testaments.map((t) => (
            <TestamentCard
              key={t._id}
              testament={t}
              actions={
                <>
                  <button className="btn-secondary" onClick={() => navigate(`/testament/${t._id}`)}>
                    View Details
                  </button>
                  {t.status === "approved" ? (
                    <button className="btn-secondary" onClick={() => setManageTarget(t)}>
                      Manage Heirs
                    </button>
                  ) : null}
                </>
              }
            />
          ))}
        </div>
      )}

      <ManageHeirsModal
        open={Boolean(manageTarget)}
        testament={manageTarget}
        onClose={() => setManageTarget(null)}
        onSaved={load}
      />
    </section>
  );
}


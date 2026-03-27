import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

export default function Landing() {
  const { user, connectWallet, isTestator, isNotary, isHeir } = useAuth();
  const [showDemoRoles, setShowDemoRoles] = useState(false);
  const navigate = useNavigate();

  const onConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected");
    } catch (err) {
      toast.error(err?.message || "Wallet connection failed");
    }
  };

  const goToDemo = () => {
    navigate("/demo");
  };

  const content = (
    <section style={{ textAlign: "center", padding: "24px", width: "100%", maxWidth: 760 }}>
      <div
        style={{
          width: 56,
          height: 56,
          margin: "0 auto",
          color: "var(--accent)",
          animation: "spin 20s linear infinite"
        }}
      >
        <svg viewBox="0 0 40 40" fill="none" width="56" height="56">
          <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2" />
          <text
            x="50%"
            y="53%"
            textAnchor="middle"
            fill="currentColor"
            fontSize="21"
            fontFamily="'Cormorant Garamond', serif"
            dominantBaseline="middle"
          >
            N
          </text>
        </svg>
      </div>

      <h1 style={{ fontSize: 80, letterSpacing: -2, lineHeight: 1, marginTop: 16 }}>Notarain</h1>
      <div style={{ fontSize: 16, color: "var(--text-muted)", letterSpacing: 3, textTransform: "uppercase", marginTop: 8 }}>
        Decentralized Notarial Succession
      </div>
      <div style={{ width: 80, margin: "28px auto", borderBottom: "1px solid var(--border)" }} />

      <p
        style={{
          maxWidth: 400,
          margin: "0 auto",
          color: "var(--text-secondary)",
          fontSize: 15,
          lineHeight: 1.7
        }}
      >
        Secure your legacy on the blockchain. Encrypted, immutable, and validated by certified notaries.
      </p>

      {!user ? (
        <button
          type="button"
          className="btn-primary"
          style={{ padding: "14px 40px", fontSize: 15, marginTop: 32 }}
          onClick={onConnect}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ marginTop: 32, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {isTestator ? (
            <>
              <Link to="/dashboard" className="btn-secondary">
                My Testaments
              </Link>
              <Link to="/upload" className="btn-secondary">
                Upload Testament
              </Link>
            </>
          ) : null}
          {isNotary ? (
            <Link to="/notary" className="btn-secondary">
              Review Panel
            </Link>
          ) : null}
          {isHeir ? (
            <Link to="/heir" className="btn-secondary">
              My Inheritances
            </Link>
          ) : null}
        </div>
      )}

      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{ width: 1, height: 1, margin: "12px auto", borderBottom: "1px solid var(--border)" }} />
        <button
          type="button"
          onClick={goToDemo}
          style={{
            background: "transparent",
            border: "1px solid var(--border-light)",
            color: "var(--text-secondary)",
            borderRadius: 8,
            padding: "10px 28px",
            fontSize: 14,
            cursor: "pointer",
            transition: "0.2s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8
          }}
        >
          <span>▶</span>
          <span>Try Demo</span>
        </button>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          No wallet required · Simulated data
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        {["AES-256 Encrypted", "Blockchain Verified", "Notary Validated"].map((feature) => (
          <span
            key={feature}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 12,
              color: "var(--text-muted)"
            }}
          >
            {feature}
          </span>
        ))}
      </div>
    </section>
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        paddingTop: 64,
        background:
          "radial-gradient(circle at center, rgba(201,168,76,0.04), transparent 58%), var(--black)"
      }}
    >
      {content}
    </main>
  );
}


import React from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";
import ConnectWallet from "./ConnectWallet";

function truncateMiddle(text, left = 6, right = 4) {
  const s = String(text || "");
  if (!s) return "";
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

function roleLabel(role) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "testator" || normalized === "admin") return "Testator";
  if (normalized === "notary") return "Notary";
  if (normalized === "heir") return "Heir";
  return "Unknown";
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logout();
      toast.success("Disconnected");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "var(--deep)",
        borderBottom: "1px solid var(--border)",
        zIndex: 100
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", height: "100%", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32 }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="17" stroke="var(--accent)" strokeWidth="2" />
              <text
                x="50%"
                y="53%"
                textAnchor="middle"
                fill="var(--accent)"
                fontSize="19"
                fontFamily="'Cormorant Garamond', serif"
                dominantBaseline="middle"
              >
                N
              </text>
            </svg>
          </div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              letterSpacing: 1,
              color: "var(--accent)"
            }}
          >
            Notarain
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="btn-secondary"
          style={{ padding: "8px 10px", display: "none" }}
          id="mobile-nav-toggle"
        >
          Menu
        </button>

        <div className="navbar-right-desktop" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontSize: 12
                }}
              >
                {roleLabel(user.role)}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{truncateMiddle(user.walletAddress)}</span>
              <button type="button" className="btn-secondary" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <div style={{ minWidth: 180 }}>
              <ConnectWallet />
            </div>
          )}
        </div>
      </div>

      {mobileOpen ? (
        <div
          style={{
            background: "var(--deep)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 24px",
            display: "grid",
            gap: 10
          }}
        >
          {user ? (
            <>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{truncateMiddle(user.walletAddress)}</div>
              <button type="button" className="btn-secondary" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <ConnectWallet />
          )}
        </div>
      ) : null}
    </header>
  );
}


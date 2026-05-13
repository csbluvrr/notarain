import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";
import { useDemoMode } from "../demo/DemoContext";
import ConnectWallet from "./ConnectWallet";
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";

function truncateMiddle(text, left = 6, right = 4) {
  const s = String(text || "");
  if (!s) return "";
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

function roleLabel(role) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "testator") return "Testateur";
  if (normalized === "admin") return "Admin";
  if (normalized === "notary") return "Notaire";
  if (normalized === "heir") return "Héritier";
  return "Inconnu";
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const {
    isDemoMode,
    demoUser,
    demoRole,
    exitDemo,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    testaments,
    pendingTestaments,
    allNotaryTestaments,
    heirTestaments,
  } = useDemoMode();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const notifAnchorRef = React.useRef(null);
  const profileAnchorRef = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (!isDemoMode && String(location.pathname || "").startsWith("/demo")) {
    // Sur la sélection de rôle démo, on n'affiche pas la navbar.
    return null;
  }

  const onLogout = async () => {
    try {
      await logout();
      toast.success("Déconnecté");
      navigate("/");
    } catch {
      toast.error("Échec de la déconnexion");
    }
  };

  const activeUser = isDemoMode ? demoUser : user;

  const unreadCount = React.useMemo(() => {
    const list = Array.isArray(notifications) ? notifications : [];
    return list.filter((n) => !n.read).length;
  }, [notifications]);

  const profileStats = React.useMemo(() => {
    if (!isDemoMode) return null;
    const role = String(demoRole || demoUser?.role || "").toLowerCase();
    if (role === "testator") {
      const list = Array.isArray(testaments) ? testaments : [];
      return {
        total: list.length,
        approved: list.filter((t) => t.status === "approved").length,
        executed: list.filter((t) => t.status === "executed").length,
      };
    }
    if (role === "notary") {
      const list = Array.isArray(allNotaryTestaments)
        ? allNotaryTestaments
        : [];
      return {
        reviewed: list.length,
        approved: list.filter((t) => t.status === "approved").length,
        rejected: list.filter((t) => t.status === "rejected").length,
      };
    }
    if (role === "heir") {
      const list = Array.isArray(heirTestaments) ? heirTestaments : [];
      return {
        accessible: list.length,
        executed: list.filter((t) => t.status === "executed").length,
      };
    }
    return null;
  }, [
    isDemoMode,
    demoRole,
    demoUser?.role,
    testaments,
    allNotaryTestaments,
    heirTestaments,
  ]);

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
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          height: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32 }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="17"
                stroke="var(--accent)"
                strokeWidth="2"
              />
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
              color: "var(--accent)",
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

        {isDemoMode ? (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <span
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                background: "var(--warning-dim)",
                border: "1px solid var(--warning)",
                color: "var(--warning)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              DEMO MODE
            </span>
          </div>
        ) : null}

        <div
          className="navbar-right-desktop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "relative",
          }}
        >
          {isDemoMode ? (
            <>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                {demoUser?.name}
              </span>
              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontSize: 12,
                }}
              >
                {roleLabel(demoUser?.role)}
              </span>

              {String(demoUser?.role || "").toLowerCase() === "testator" ? (
                <div style={{ position: "relative" }} ref={notifAnchorRef}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "8px 10px", position: "relative" }}
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((v) => !v);
                    }}
                    aria-label="Notifications"
                  >
                    🔔
                    {unreadCount > 0 ? (
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          right: 6,
                          top: 6,
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: "var(--danger)",
                        }}
                      />
                    ) : null}
                  </button>
                  <NotificationDropdown
                    open={notifOpen}
                    notifications={notifications || []}
                    anchorRef={notifAnchorRef}
                    onClose={() => setNotifOpen(false)}
                    onMarkRead={(id) => {
                      markNotificationRead?.(id);
                    }}
                    onMarkAllRead={() => {
                      markAllNotificationsRead?.();
                    }}
                  />
                </div>
              ) : null}

              <div style={{ position: "relative" }} ref={profileAnchorRef}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "8px 10px" }}
                  onClick={() => {
                    setNotifOpen(false);
                    setProfileOpen((v) => !v);
                  }}
                >
                  Profil
                </button>
                <ProfileDropdown
                  open={profileOpen}
                  anchorRef={profileAnchorRef}
                  onClose={() => setProfileOpen(false)}
                  user={activeUser}
                  stats={profileStats}
                />
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setNotifOpen(false);
                  setProfileOpen(false);
                  exitDemo();
                  navigate("/");
                }}
              >
                Quitter la démo
              </button>
            </>
          ) : user ? (
            <>
              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontSize: 12,
                }}
              >
                {roleLabel(user.role)}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {truncateMiddle(user.walletAddress)}
              </span>
              <div style={{ position: "relative" }} ref={profileAnchorRef}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "8px 10px" }}
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  Profil
                </button>
                <ProfileDropdown
                  open={profileOpen}
                  anchorRef={profileAnchorRef}
                  onClose={() => setProfileOpen(false)}
                  user={user}
                  stats={null}
                />
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={onLogout}
              >
                Déconnexion
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
            gap: 10,
          }}
        >
          {isDemoMode ? (
            <>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                {demoUser?.name} ({roleLabel(demoUser?.role)})
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  exitDemo();
                  navigate("/");
                }}
              >
                Quitter la démo
              </button>
            </>
          ) : user ? (
            <>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                {truncateMiddle(user.walletAddress)}
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={onLogout}
              >
                Déconnexion
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

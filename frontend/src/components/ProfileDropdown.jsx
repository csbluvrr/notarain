import React, { useEffect, useMemo } from "react";

function formatMemberSince(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", { month: "long", day: "numeric", year: "numeric" });
}

export default function ProfileDropdown({
  open,
  anchorRef,
  onClose,
  user,
  stats
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const anchorEl = anchorRef?.current;
      if (anchorEl && anchorEl.contains(e.target)) return;
      onClose?.();
    };
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, anchorRef, onClose]);

  const initial = useMemo(() => {
    const name = String(user?.name || "");
    return name ? name.trim().slice(0, 1).toUpperCase() : "?";
  }, [user?.name]);

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(String(user?.walletAddress || ""));
    } catch {
      // silent
    }
  };

  if (!open) return null;

  return (
    <div
      className="card"
      style={{
        position: "absolute",
        right: 0,
        top: 48,
        width: 280,
        padding: 20,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        zIndex: 200
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "var(--accent-dim)",
            border: "2px solid var(--accent)",
            display: "grid",
            placeItems: "center",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
            color: "var(--accent)"
          }}
        >
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{user?.name || "Profil"}</div>
          <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-muted)" }}>Membre depuis {formatMemberSince(user?.createdAt)}</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Adresse du portefeuille</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 10px"
          }}
        >
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.walletAddress || "-"}
          </div>
          <button type="button" className="btn-secondary" style={{ marginLeft: "auto", padding: "6px 10px", fontSize: 12 }} onClick={copyWallet}>
            Copier
          </button>
        </div>
      </div>

      {stats ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Statistiques</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 10px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--accent)" }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}


import React, { useEffect } from "react";

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function NotificationDropdown({
  open,
  notifications = [],
  anchorRef,
  onClose,
  onMarkRead,
  onMarkAllRead
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

  if (!open) return null;

  return (
    <div
      className="card"
      style={{
        position: "absolute",
        right: 0,
        top: 48,
        width: 320,
        padding: 0,
        overflow: "hidden",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        zIndex: 200
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Notifications</div>
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 18, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No notifications</div>
        ) : (
          notifications.map((n) => {
            const unread = !n.read;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onMarkRead?.(n.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: unread ? "var(--surface-2)" : "var(--surface)",
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderLeft: unread ? "3px solid var(--accent)" : "3px solid transparent"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = unread ? "var(--surface-2)" : "var(--surface)";
                }}
              >
                <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.35 }}>{n.message}</div>
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>{formatDate(n.date)}</div>
              </button>
            );
          })
        )}
      </div>

      <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn-secondary" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onMarkAllRead}>
          Mark all as read
        </button>
      </div>
    </div>
  );
}


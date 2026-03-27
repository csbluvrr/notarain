import React, { useMemo } from "react";

function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

const STATUS_COLOR = {
  draft: "var(--text-muted)",
  pending: "var(--warning)",
  approved: "var(--success)",
  rejected: "var(--danger)",
  executed: "var(--accent)",
  revoked: "var(--text-muted)"
};

export default function TestamentTimeline({ events = [] }) {
  const items = useMemo(() => (Array.isArray(events) ? events : []), [events]);

  return (
    <div style={{ position: "relative", paddingLeft: 40 }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 16,
          top: 6,
          bottom: 6,
          width: 1,
          background: "var(--border)"
        }}
      />

      <div style={{ display: "grid", gap: 24 }}>
        {items.map((ev, idx) => {
          const isLast = idx === items.length - 1;
          const color = STATUS_COLOR[String(ev?.status || "").toLowerCase()] || "var(--text-muted)";

          return (
            <div
              key={`${ev?.label || "event"}-${ev?.date || idx}`}
              style={{
                position: "relative",
                animation: "fadeIn 0.2s ease both",
                animationDelay: `${idx * 60}ms`,
                transform: "translateY(6px)"
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: -24,
                  top: 2,
                  width: isLast ? 16 : 12,
                  height: isLast ? 16 : 12,
                  borderRadius: 999,
                  border: `2px solid ${color}`,
                  background: "var(--surface)",
                  transform: isLast ? "translate(-2px, -2px)" : "none"
                }}
              />

              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{ev?.label || "-"}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
                {formatDateTime(ev?.date)}{" "}
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                  · {ev?.actor || "-"}
                </span>
              </div>
              {ev?.note ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>{ev.note}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}


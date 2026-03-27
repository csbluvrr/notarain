import React from "react";

const STATUS_META = {
  draft: {
    label: "Brouillon",
    style: {
      background: "var(--surface-3)",
      borderColor: "var(--border-light)",
      color: "var(--text-muted)"
    }
  },
  pending: {
    label: "En attente",
    style: {
      background: "var(--warning-dim)",
      borderColor: "var(--warning)",
      color: "var(--warning)"
    }
  },
  approved: {
    label: "Validé",
    style: {
      background: "var(--success-dim)",
      borderColor: "var(--success)",
      color: "var(--success)"
    }
  },
  rejected: {
    label: "Rejeté",
    style: {
      background: "var(--danger-dim)",
      borderColor: "var(--danger)",
      color: "var(--danger)"
    }
  },
  executed: {
    label: "Exécuté",
    style: {
      background: "var(--accent-dim)",
      borderColor: "var(--accent)",
      color: "var(--accent)"
    }
  },
  revoked: {
    label: "Révoqué",
    style: {
      background: "var(--surface-3)",
      borderColor: "var(--border-light)",
      color: "var(--text-muted)"
    }
  }
};

export default function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const meta = STATUS_META[normalized] || STATUS_META.draft;

  return (
    <span
      style={meta.style}
      className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[20px] border text-xs font-medium"
    >
      <span
        style={{ backgroundColor: meta.style.color }}
        className="inline-block w-1 h-1 rounded-full"
      />
      {meta.label}
    </span>
  );
}


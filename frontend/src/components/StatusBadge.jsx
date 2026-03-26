import React from "react";

const LABELS_FR = {
  draft: "Brouillon",
  pending: "En attente",
  approved: "Validé",
  rejected: "Rejeté",
  executed: "Exécuté"
};

export default function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  const classNameMap = {
    draft: "bg-gray-600 text-white",
    pending: "bg-yellow-600 text-white",
    approved: "bg-green-600 text-white",
    rejected: "bg-red-600 text-white",
    executed: "bg-blue-600 text-white"
  };

  const badgeClass = classNameMap[normalized] || "bg-gray-600 text-white";
  const label = LABELS_FR[normalized] || normalized || "Inconnu";

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${badgeClass}`}>
      {label}
    </span>
  );
}


import React from "react";

function capitalize(text) {
  if (!text) return "";
  const s = String(text);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${badgeClass}`}>
      {capitalize(normalized)}
    </span>
  );
}


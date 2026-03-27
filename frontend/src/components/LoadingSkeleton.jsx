import React from "react";

export default function LoadingSkeleton({ width = "100%", height = 16, className = "" }) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 6,
        background:
          "linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 50%, var(--surface-2) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite"
      }}
    />
  );
}


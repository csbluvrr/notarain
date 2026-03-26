import React from "react";
import StatusBadge from "./StatusBadge";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function truncateMiddle(text, left = 10, right = 4) {
  const s = String(text || "");
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

export default function TestamentCard({ testament }) {
  const {
    originalFileName,
    status,
    createdAt,
    blockchainId,
    ipfsCid
  } = testament || {};

  const cidDisplay = ipfsCid ? truncateMiddle(ipfsCid) : "";
  const hasBlockchainId = blockchainId !== undefined && blockchainId !== null && Number(blockchainId) > 0;

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold truncate">{originalFileName || "Sans titre"}</div>
          <div className="text-xs text-gray-300 mt-1">{formatDate(createdAt)}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3 text-sm text-gray-200">
        {hasBlockchainId ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">ID blockchain :</span>
            <span className="font-mono">{blockchainId}</span>
          </div>
        ) : null}

        {ipfsCid ? (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-400">CID IPFS :</span>
            <span className="font-mono">{cidDisplay}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}


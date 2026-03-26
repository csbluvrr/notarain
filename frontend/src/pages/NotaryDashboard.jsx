import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { getContract } from "../hooks/useContract";

const PINATA_GATEWAY_DEFAULT = "https://gateway.pinata.cloud/ipfs";

function truncateMiddle(text, left = 6, right = 4) {
  const s = String(text || "");
  if (!s) return "";
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function NotaryDashboard() {
  const [tab, setTab] = useState("pending");
  const [pendingTestaments, setPendingTestaments] = useState([]);
  const [allTestaments, setAllTestaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        api.get("/api/notary/pending"),
        api.get("/api/notary/all")
      ]);
      setPendingTestaments(pendingRes?.data?.testaments || []);
      setAllTestaments(allRes?.data?.testaments || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load testaments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApprove = async (t) => {
    try {
      await api.post(`/api/notary/approve/${t._id}`);

      const blockchainId = Number(t.blockchainId || 0);
      if (blockchainId > 0) {
        const contract = await getContract();
        const tx = await contract.approveTestament(blockchainId);
        await tx.wait();
      }

      toast.success("Approved");
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Approve failed");
    }
  };

  const onReject = async (t) => {
    try {
      await api.post(`/api/notary/reject/${t._id}`);

      const blockchainId = Number(t.blockchainId || 0);
      if (blockchainId > 0) {
        const contract = await getContract();
        const tx = await contract.rejectTestament(blockchainId);
        await tx.wait();
      }

      toast.success("Rejected");
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Reject failed");
    }
  };

  const onConfirmDeath = async (t) => {
    try {
      await api.post(`/api/notary/execute/${t._id}`);

      const blockchainId = Number(t.blockchainId || 0);
      if (blockchainId > 0) {
        const contract = await getContract();
        const tx = await contract.confirmDeath(blockchainId);
        await tx.wait();
      }

      toast.success("Executed");
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Execution failed");
    }
  };

  const renderCard = (t, actions) => {
    const ipfsHref = t.ipfsCid ? `${PINATA_GATEWAY_DEFAULT}/${t.ipfsCid}` : null;

    return (
      <div className="border border-gray-800 rounded-lg p-4 bg-gray-800/30" key={t._id}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-semibold truncate">{t.originalFileName}</div>
            <div className="text-xs text-gray-300 mt-1">
              Testator: <span className="font-mono">{truncateMiddle(t.testatorWallet)}</span>
            </div>
            <div className="text-xs text-gray-300">{formatDate(t.createdAt)}</div>
          </div>
          <StatusBadge status={t.status} />
        </div>

        {t.blockchainId !== undefined && t.blockchainId !== null ? (
          <div className="text-sm text-gray-200 mt-3 flex items-center gap-2">
            <span className="text-gray-400">Blockchain ID:</span>
            <span className="font-mono">{t.blockchainId}</span>
          </div>
        ) : null}

        {t.ipfsCid ? (
          <div className="text-sm text-gray-200 mt-2 flex items-center gap-2">
            <span className="text-gray-400">IPFS CID:</span>
            <a
              href={ipfsHref}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-indigo-300 underline break-all"
            >
              {truncateMiddle(t.ipfsCid, 10, 4)}
            </a>
          </div>
        ) : null}

        {actions ? <div className="mt-4 flex gap-3">{actions(t)}</div> : null}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Notary Dashboard</h2>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-md font-semibold transition ${
            tab === "pending" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          Pending Review
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-md font-semibold transition ${
            tab === "all" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          All Testaments
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
        </div>
      ) : tab === "pending" ? (
        pendingTestaments.length === 0 ? (
          <div className="border border-gray-800 rounded-lg p-6 bg-gray-800/30 text-gray-300">
            No pending testaments.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingTestaments.map((t) =>
              renderCard(t, (testament) => (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(testament)}
                    className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 transition font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(testament)}
                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 transition font-semibold"
                  >
                    Reject
                  </button>
                </>
              ))
            )}
          </div>
        )
      ) : allTestaments.length === 0 ? (
        <div className="border border-gray-800 rounded-lg p-6 bg-gray-800/30 text-gray-300">
          No testaments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {allTestaments.map((t) =>
            renderCard(t, (testament) => {
              if (testament.status !== "approved") return null;
              return (
                <button
                  type="button"
                  onClick={() => onConfirmDeath(testament)}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition font-semibold"
                >
                  Confirm Death
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


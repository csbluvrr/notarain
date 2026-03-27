import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

function truncateAddress(address) {
  const v = String(address || "");
  if (v.length <= 10) return v;
  return `${v.slice(0, 6)}...${v.slice(-4)}`;
}

export default function ManageHeirsModal({ open, testament, onClose, onSaved }) {
  const [heirs, setHeirs] = useState([]);
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [share, setShare] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setHeirs(Array.isArray(testament?.heirs) ? testament.heirs : []);
      setName("");
      setWalletAddress("");
      setShare("");
    }
  }, [open, testament]);

  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const subtitle = useMemo(() => testament?.originalFileName || "Untitled Testament", [testament]);

  if (!open) return null;

  const removeAt = (idx) => {
    setHeirs((prev) => prev.filter((_, i) => i !== idx));
  };

  const addHeir = () => {
    if (!name.trim() || !walletAddress.trim() || !share.trim()) {
      toast.error("Please fill all beneficiary fields");
      return;
    }
    setHeirs((prev) => [
      ...prev,
      {
        name: name.trim(),
        walletAddress: walletAddress.trim().toLowerCase(),
        share: share.trim()
      }
    ]);
    setName("");
    setWalletAddress("");
    setShare("");
  };

  const save = async () => {
    if (!testament?._id) return;
    try {
      setSaving(true);
      await api.post(`/api/testament/heirs/${testament._id}`, { heirs });
      toast.success("Beneficiaries updated");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to save beneficiaries");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 200
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(920px, calc(100vw - 32px))",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <h3 style={{ fontSize: 30 }}>Manage Beneficiaries</h3>
        <p style={{ marginTop: 8, color: "var(--text-secondary)" }}>{subtitle}</p>

        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          {heirs.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No beneficiaries yet.</div>
          ) : (
            heirs.map((h, idx) => (
              <div
                key={`${h.walletAddress}-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 12,
                  alignItems: "center",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 12px"
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{h.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{truncateAddress(h.walletAddress)}</div>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{h.share}</div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="btn-danger"
                  style={{ padding: "6px 12px" }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 10, color: "var(--text-secondary)", fontSize: 14 }}>Add Beneficiary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px auto", gap: 8 }}>
            <input className="input" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className="input"
              placeholder="Wallet Address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
            <input className="input" placeholder="Share (e.g. 50%)" value={share} onChange={(e) => setShare(e.target.value)} />
            <button type="button" className="btn-secondary" onClick={addHeir}>
              Add
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}


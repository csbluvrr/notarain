import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDemoMode } from "../demo/DemoContext";
import TestamentCard from "../components/TestamentCard";

function truncateAddress(address = "") {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function DemoUploadModal({ open, onClose, onCreated }) {
  const [innerStep, setInnerStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [cid, setCid] = useState("");
  const [hash, setHash] = useState("");
  const [txHash, setTxHash] = useState("");
  const [password, setPassword] = useState("Demo2026");
  const [pending, setPending] = useState(false);
  const [stageLabel, setStageLabel] = useState("");

  if (!open) return null;

  const closeAll = () => {
    setInnerStep(1);
    setFileName("");
    setCid("");
    setHash("");
    setTxHash("");
    setPassword("Demo2026");
    setStageLabel("");
    setPending(false);
    onClose?.();
  };

  const onPickFile = (name = "testament_demo_presentation.pdf") => {
    setFileName(name);
    setInnerStep(2);
  };

  const startFakeUpload = () => {
    if (!fileName) {
      toast.error("Please pick a file first");
      return;
    }
    setPending(true);
    setStageLabel("Encrypting...");
    setTimeout(() => {
      setStageLabel("Uploading to IPFS...");
      setTimeout(() => {
        setCid("QmDemoX1y2Z3a4B5c6D7e8F9g0H1i2J3k4L5m6N7o8P9q0R");
        setHash("0xDemoHash1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0");
        setInnerStep(3);
        setPending(false);
      }, 1000);
    }, 1500);
  };

  const submitForReview = async () => {
    setPending(true);
    await new Promise((r) => setTimeout(r, 800));
    setPending(false);
    setInnerStep(4);
  };

  const registerChain = async () => {
    setPending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTxHash("0xDemo1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f");
    setPending(false);
  };

  const finishFlow = () => {
    onCreated?.({
      _id: `demo-new-${Date.now()}`,
      testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
      originalFileName: fileName || "testament_demo_presentation.pdf",
      status: "pending",
      ipfsCid: cid || "QmDemoX1y2Z3a4B5c6D7e8F9g0H1i2J3k4L5m6N7o8P9q0R",
      documentHash:
        hash || "0xDemoHash1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0",
      blockchainId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notaryWallet: null,
      heirs: []
    });
    toast.success("Demo upload complete. Testament added.");
    closeAll();
  };

  return (
    <div
      onClick={closeAll}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200 }}
    >
      <div
        className="card card-highlight"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, calc(100vw - 32px))",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <h3 style={{ fontSize: 26, marginBottom: 8 }}>Demo Upload Flow</h3>
        {innerStep === 1 ? (
          <>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>
              Step 1 — Pick a file (simulated)
            </p>
            <input
              className="input"
              type="file"
              accept="application/pdf"
              onChange={(e) => onPickFile(e.target.files?.[0]?.name || "testament_demo_presentation.pdf")}
              style={{ marginBottom: 10 }}
            />
            <button type="button" className="btn-secondary" onClick={() => onPickFile("testament_demo_presentation.pdf")} style={{ marginRight: 8 }}>
              Use sample file
            </button>
            {fileName ? <span style={{ color: "var(--success)", fontSize: 13 }}>✓ {fileName}</span> : null}
          </>
        ) : innerStep === 2 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            <p style={{ marginBottom: 10 }}>Step 2 — Encrypt & Upload</p>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 10, maxWidth: 240 }}
            />
            {pending ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" /> {stageLabel}
              </div>
            ) : (
              <button type="button" className="btn-primary" onClick={startFakeUpload}>
                Encrypt & Upload
              </button>
            )}
          </div>
        ) : innerStep === 3 ? (
          <>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>Step 3 — Submit for Review</p>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>File</div>
              <div style={{ fontSize: 14 }}>{fileName}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>CID</div>
              <code style={{ fontSize: 12 }}>{cid}</code>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Hash</div>
              <code style={{ fontSize: 12 }}>{hash}</code>
            </div>
            <button type="button" className="btn-primary" onClick={submitForReview} disabled={pending}>
              {pending ? "Submitting..." : "Submit for Review"}
            </button>
          </>
        ) : innerStep === 4 ? (
          <>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>Step 4 — Register on Blockchain</p>
            <button type="button" className="btn-primary" onClick={registerChain} disabled={pending || Boolean(txHash)}>
              {pending ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" /> Confirming...
                </span>
              ) : txHash ? "Registered" : "Register on Blockchain"}
            </button>
            {txHash ? (
              <div style={{ marginTop: 12 }}>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--accent)", fontSize: 12, wordBreak: "break-all" }}
                >
                  {txHash}
                </a>
                <div style={{ marginTop: 10 }}>
                  <button type="button" className="btn-primary" onClick={finishFlow}>
                    Close and Add Testament
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          className="btn-secondary"
          style={{ marginTop: 16 }}
          onClick={closeAll}
          disabled={pending}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function DemoTestatorDashboard() {
  const { demoUser, demoTestaments, addDemoTestament } = useDemoMode();
  const [showModal, setShowModal] = useState(false);

  const stats = useMemo(() => {
    const total = demoTestaments.length;
    const pending = demoTestaments.filter((t) => t.status === "pending").length;
    const approved = demoTestaments.filter((t) => t.status === "approved").length;
    return { total, pending, approved };
  }, [demoTestaments]);

  return (
    <section className="page-container">
      <h1 className="page-title">My Testaments (Demo)</h1>
      <p className="page-subtitle">
        Simulated testator: {demoUser?.name} ({truncateAddress(demoUser?.walletAddress || "")})
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 24
        }}
      >
        {[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Approved", value: stats.approved }
        ].map((s) => (
          <div key={s.label} className="card">
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 40,
                color: "var(--accent)"
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                letterSpacing: 1,
                textTransform: "uppercase"
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
          Upload New Testament (Demo)
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {demoTestaments.map((t) => (
          <TestamentCard key={t._id} testament={t} isDemo />
        ))}
      </div>

      <DemoUploadModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={addDemoTestament}
      />
    </section>
  );
}


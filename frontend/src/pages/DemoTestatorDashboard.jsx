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
  const [pending, setPending] = useState(false);

  if (!open) return null;

  const closeAll = () => {
    setInnerStep(1);
    setFileName("");
    setCid("");
    setHash("");
    setPending(false);
    onClose?.();
  };

  const startFakeUpload = () => {
    setPending(true);
    setFileName("testament_demo_presentation.pdf");
    setTimeout(() => {
      setInnerStep(2);
      setTimeout(() => {
        setCid("QmDemoX1y2Z3a4B5c6D7e8F9g0H1i2J3k4L5m6N7o8P9q0R");
        setHash(
          "0xDemoHash1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0"
        );
        setInnerStep(3);
        setPending(false);
      }, 2500);
    }, 400);
  };

  const finishFlow = () => {
    onCreated?.({
      _id: "demo-new",
      testatorWallet: "",
      originalFileName: fileName || "testament_demo_presentation.pdf",
      status: "pending",
      ipfsCid: cid,
      documentHash: hash,
      blockchainId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notaryWallet: null,
      heirs: []
    });
    toast.success("Demo testament created (pending)");
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
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              This is a simulated upload. No real encryption or IPFS upload will occur.
            </p>
            <button type="button" className="btn-primary" onClick={startFakeUpload}>
              Use sample file
            </button>
          </>
        ) : innerStep === 2 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            <div style={{ marginBottom: 10 }}>Encrypting with AES-256...</div>
            <div style={{ marginBottom: 10 }}>Uploading to IPFS...</div>
            <span className="spinner" />
          </div>
        ) : innerStep === 3 ? (
          <>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>
              Simulated upload complete.
            </p>
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
            <button type="button" className="btn-primary" onClick={finishFlow}>
              Finish Demo Upload
            </button>
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
          <TestamentCard key={t._id} testament={t} />
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


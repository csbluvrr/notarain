import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import api from "../services/api";
import { getContract } from "../hooks/useContract";

const steps = ["Select File", "Encrypt & Upload", "Submit", "On-Chain"];

function humanFileSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Upload() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [testamentId, setTestamentId] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [txHash, setTxHash] = useState("");

  const [submittingReview, setSubmittingReview] = useState(false);
  const [chainPending, setChainPending] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [errors, setErrors] = useState({});

  const progressState = useMemo(() => {
    return steps.map((_, idx) => {
      const order = idx + 1;
      if (order < step) return "done";
      if (order === step) return "active";
      return "idle";
    });
  }, [step]);

  const onSelectFile = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  const goToStep2 = () => {
    const nextErrors = {};
    if (!file) nextErrors.file = "Please select a PDF file.";
    else if (file.type !== "application/pdf") nextErrors.file = "Only PDF files are allowed.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStep(2);
  };

  const encryptAndUpload = async () => {
    const nextErrors = {};
    if (!password) nextErrors.password = "Password is required.";
    if (!confirmPassword) nextErrors.confirmPassword = "Please confirm password.";
    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setEncrypting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("encryptionPassword", password);
      setUploading(true);

      const res = await api.post("/api/testament/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setTestamentId(res?.data?.testamentId || "");
      setIpfsCid(res?.data?.ipfsCid || "");
      setDocumentHash(res?.data?.documentHash || "");
      toast.success("Upload complete");
      setStep(3);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Upload failed");
    } finally {
      setEncrypting(false);
      setUploading(false);
    }
  };

  const submitForReview = async () => {
    if (!testamentId) return toast.error("Missing testament identifier.");
    try {
      setSubmittingReview(true);
      await api.post(`/api/testament/submit/${testamentId}`);
      toast.success("Submitted for notary review");
      setStep(4);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Submit failed");
    } finally {
      setSubmittingReview(false);
    }
  };

  const registerOnChain = async () => {
    if (!testamentId || !ipfsCid || !documentHash) {
      toast.error("Missing CID or document hash.");
      return;
    }
    try {
      setChainPending(true);
      const contract = await getContract();
      const hashHex = documentHash.startsWith("0x") ? documentHash : `0x${documentHash}`;
      const documentHashBytes32 = ethers.hexlify(hashHex);
      const tx = await contract.registerTestament(ipfsCid, documentHashBytes32);
      const receipt = await tx.wait();
      const minedHash = receipt?.hash || tx?.hash || "";
      setTxHash(minedHash);
      await api.post(`/api/testament/blockchain/${testamentId}`, { blockchainId: 0, txHash: minedHash });
      toast.success("Transaction confirmed");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Blockchain registration failed");
    } finally {
      setChainPending(false);
    }
  };

  return (
    <section className="page-container">
      <h1 className="page-title">Upload Testament</h1>
      <p className="page-subtitle">Encrypt, upload and register your testament securely.</p>

      <div className="card card-highlight" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {steps.map((label, idx) => {
            const state = progressState[idx];
            const base = {
              width: 32,
              height: 32,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              margin: "0 auto",
              border: "1px solid var(--border)"
            };
            if (state === "active") {
              base.background = "var(--accent)";
              base.color = "var(--black)";
              base.fontWeight = 500;
              base.border = "none";
            } else if (state === "done") {
              base.background = "var(--success)";
              base.color = "white";
              base.border = "none";
            } else {
              base.background = "var(--surface-3)";
              base.color = "var(--text-muted)";
            }

            return (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={base}>{state === "done" ? "✓" : idx + 1}</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: state === "active" ? "var(--accent)" : "var(--text-muted)"
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 ? (
        <div className="card">
          <h3 style={{ fontSize: 28, marginBottom: 14 }}>Step 1 — Select File</h3>
          <label
            htmlFor="pdf-file"
            style={{
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              border: "2px dashed var(--border-light)",
              borderRadius: 12,
              height: 180,
              background: "var(--surface)",
              cursor: "pointer"
            }}
          >
            <div>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
                <path d="M12 3v13" />
                <path d="M8 7l4-4 4 4" />
                <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
              </svg>
              <div style={{ color: "var(--text-secondary)", marginTop: 8 }}>Drop your PDF here</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>or click to browse</div>
            </div>
          </label>
          <input id="pdf-file" type="file" accept="application/pdf" onChange={onSelectFile} style={{ display: "none" }} />
          {errors.file ? <div className="inline-error">{errors.file}</div> : null}
          {file ? (
            <div style={{ marginTop: 12, color: "var(--success)", fontSize: 14 }}>
              ✓ {file.name} ({humanFileSize(file.size)})
            </div>
          ) : null}
          <div style={{ marginTop: 18 }}>
            <button type="button" className="btn-primary" onClick={goToStep2}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="card">
          <h3 style={{ fontSize: 28, marginBottom: 10 }}>Step 2 — Encrypt & Upload</h3>
          <div
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--accent)",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              gap: 8,
              alignItems: "start",
              marginBottom: 16
            }}
          >
            <span style={{ color: "var(--accent)" }}>🔒</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Your document will be encrypted with AES-256 before upload. Store your password safely - it cannot be recovered.
            </span>
          </div>

          <div style={{ display: "grid", gap: 10, maxWidth: 500 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, color: "var(--text-secondary)", fontSize: 13 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="Enter encryption password"
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ position: "absolute", right: 6, top: 6, padding: "6px 10px" }}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password ? <div className="inline-error">{errors.password}</div> : null}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, color: "var(--text-secondary)", fontSize: 13 }}>Confirm Password</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                placeholder="Confirm encryption password"
              />
              {errors.confirmPassword ? <div className="inline-error">{errors.confirmPassword}</div> : null}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn-primary" onClick={encryptAndUpload} disabled={encrypting || uploading}>
              {encrypting ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" /> Encrypting...
                </span>
              ) : uploading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" /> Uploading to IPFS...
                </span>
              ) : (
                "Encrypt & Upload"
              )}
            </button>
          </div>

          {ipfsCid ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ marginBottom: 6, color: "var(--text-secondary)", fontSize: 13 }}>IPFS CID</div>
              <code
                style={{
                  display: "block",
                  background: "var(--surface-3)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--accent)",
                  wordBreak: "break-all"
                }}
              >
                {ipfsCid}
              </code>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="card">
          <h3 style={{ fontSize: 28, marginBottom: 10 }}>Step 3 — Submit for Review</h3>
          <div className="card" style={{ background: "var(--surface-2)", padding: 16 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>Testament ID: {testamentId}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>CID: {ipfsCid}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Hash: {documentHash}</div>
          </div>
          <p style={{ color: "var(--text-secondary)", marginTop: 12, marginBottom: 14 }}>
            Once submitted, a certified notary will review and either approve or reject your testament.
          </p>
          <button type="button" className="btn-primary" onClick={submitForReview} disabled={submittingReview}>
            {submittingReview ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" /> Submitting...
              </span>
            ) : (
              "Submit for Review"
            )}
          </button>
          <div style={{ marginTop: 10 }}>
            <Link to="/dashboard" className="btn-secondary">
              View My Testaments Now
            </Link>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="card">
          <h3 style={{ fontSize: 28, marginBottom: 10 }}>Step 4 — Register On-Chain</h3>
          <div className="card" style={{ background: "var(--surface-2)", padding: 16 }}>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              This transaction stores your CID and hash on-chain to provide immutable proof.
            </p>
          </div>
          <div
            style={{
              marginTop: 12,
              background: "var(--warning-dim)",
              border: "1px solid var(--warning)",
              borderRadius: 8,
              padding: "10px 14px",
              color: "var(--warning)",
              fontSize: 13
            }}
          >
            Gas fee notice: Make sure your wallet has enough Sepolia ETH.
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn-primary" onClick={registerOnChain} disabled={chainPending}>
              {chainPending ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" /> Confirming...
                </span>
              ) : (
                "Register on Blockchain"
              )}
            </button>
            <Link to="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
          {txHash ? (
            <div
              style={{
                marginTop: 14,
                background: "var(--success-dim)",
                border: "1px solid var(--success)",
                borderRadius: 8,
                padding: "12px 14px"
              }}
            >
              <div style={{ color: "var(--success)", marginBottom: 4 }}>Transaction confirmed</div>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--text-primary)", fontSize: 13, wordBreak: "break-all" }}
              >
                {txHash}
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}


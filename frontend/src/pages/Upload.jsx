import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

import api from "../services/api";
import { getContract } from "../hooks/useContract";

function isPdf(file) {
  return file && file.type === "application/pdf";
}

function formatHash(hash) {
  if (!hash) return "";
  const s = String(hash);
  if (s.startsWith("0x")) return s;
  return "0x" + s;
}

function truncateMiddle(text, left = 10, right = 4) {
  const s = String(text || "");
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

export default function Upload() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [encryptionPassword, setEncryptionPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [originalFileName, setOriginalFileName] = useState("");

  const [testamentId, setTestamentId] = useState(null);
  const [ipfsCid, setIpfsCid] = useState(null);
  const [documentHash, setDocumentHash] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const stepsTotal = 4;

  const stepIndicator = useMemo(() => {
    const labels = ["Select file", "Encrypt & upload", "Submit for review", "Register on chain"];
    return labels[step - 1] || "";
  }, [step]);

  const nextFromStep1 = () => {
    if (!file) {
      toast.error("Please select a PDF first");
      return;
    }
    if (!isPdf(file)) {
      toast.error("Please select a valid PDF file");
      return;
    }
    setOriginalFileName(file.name);
    setStep(2);
  };

  const onUploadStep2 = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("No file selected");
      return;
    }
    if (!encryptionPassword || encryptionPassword.length < 1) {
      toast.error("Encryption password is required");
      return;
    }
    if (encryptionPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("encryptionPassword", encryptionPassword);

      const res = await api.post("/api/testament/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const data = res?.data || {};
      setTestamentId(data.testamentId);
      setIpfsCid(data.ipfsCid);
      setDocumentHash(data.documentHash);
      toast.success("Uploaded and encrypted successfully");
      setStep(3);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmitReview = async () => {
    if (!testamentId) {
      toast.error("Missing testament id");
      return;
    }
    try {
      setSubmittingReview(true);
      await api.post(`/api/testament/submit/${testamentId}`);
      toast.success("Submitted for notary review");
      setStep(4);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Submission failed");
    } finally {
      setSubmittingReview(false);
    }
  };

  const onRegisterOnChain = async () => {
    if (!ipfsCid || !documentHash || !testamentId) {
      toast.error("Missing IPFS CID or document hash");
      return;
    }

    try {
      setRegistering(true);

      const contract = await getContract();

      const hashHex = documentHash.startsWith("0x") ? documentHash : formatHash(documentHash);
      const documentHashBytes32 = ethers.hexlify(hashHex);

      const tx = await contract.registerTestament(ipfsCid, documentHashBytes32);
      toast.loading("Waiting for transaction confirmation...", { id: "registerTx" });
      const receipt = await tx.wait();
      toast.success("Registered on blockchain", { id: "registerTx" });

      const minedTxHash = receipt?.hash;
      setTxHash(minedTxHash);

      await api.post(`/api/testament/blockchain/${testamentId}`, {
        blockchainId: 0,
        txHash: minedTxHash
      });
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Blockchain registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const txLink = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="text-sm text-gray-300">
          Step {step} of {stepsTotal}: {stepIndicator}
        </div>
        <div className="mt-2 h-2 w-full bg-gray-800 rounded overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${(step / stepsTotal) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 ? (
        <div className="border border-gray-800 rounded-lg bg-gray-800/30 p-6">
          <h2 className="text-xl font-bold mb-4">Select file</h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
            }}
            className="block w-full text-sm text-gray-300"
          />

          {file ? (
            <div className="mt-4 text-sm text-gray-300">
              Selected: <span className="font-semibold text-gray-100">{file.name}</span>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={nextFromStep1}
              className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
              disabled={!file}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <form
          onSubmit={onUploadStep2}
          className="border border-gray-800 rounded-lg bg-gray-800/30 p-6"
        >
          <h2 className="text-xl font-bold mb-4">Encrypt and upload</h2>
          <div className="text-sm text-gray-300 mb-4">
            File: <span className="font-semibold text-gray-100">{file?.name || originalFileName}</span>
          </div>

          <label className="block mb-3">
            <div className="text-sm text-gray-300 mb-1">Encryption password</div>
            <input
              type="password"
              value={encryptionPassword}
              onChange={(e) => setEncryptionPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 outline-none focus:border-indigo-500"
              required
            />
          </label>

          <label className="block mb-6">
            <div className="text-sm text-gray-300 mb-1">Confirm password</div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 outline-none focus:border-indigo-500"
              required
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition font-semibold"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload & Encrypt"}
            </button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="border border-gray-800 rounded-lg bg-gray-800/30 p-6">
          <h2 className="text-xl font-bold mb-4">Submit for notary review</h2>

          <div className="space-y-2 text-sm text-gray-300">
            <div>
              File: <span className="font-semibold text-gray-100">{originalFileName}</span>
            </div>
            <div>
              IPFS CID:{" "}
              <span className="font-mono text-gray-100">{ipfsCid ? truncateMiddle(ipfsCid) : ""}</span>
            </div>
            <div>
              Document hash:{" "}
              <span className="font-mono text-gray-100">{documentHash ? truncateMiddle(documentHash, 14, 6) : ""}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition font-semibold"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onSubmitReview}
              disabled={submittingReview}
              className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="border border-gray-800 rounded-lg bg-gray-800/30 p-6">
          <h2 className="text-xl font-bold mb-4">Register on blockchain</h2>
          <div className="text-sm text-gray-300 leading-relaxed">
            This step registers your testament on the smart contract using the IPFS CID and the SHA-256
            document hash.
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-300">
            <div>
              CID: <span className="font-mono text-gray-100">{ipfsCid ? truncateMiddle(ipfsCid) : ""}</span>
            </div>
            <div>
              Hash:{" "}
              <span className="font-mono text-gray-100">
                {documentHash ? truncateMiddle(documentHash.startsWith("0x") ? documentHash : formatHash(documentHash), 14, 6) : ""}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition font-semibold text-center"
            >
              Go to Dashboard
            </Link>

            <button
              type="button"
              onClick={onRegisterOnChain}
              disabled={registering}
              className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
            >
              {registering ? "Registering..." : "Register on Blockchain"}
            </button>
          </div>

          {txLink ? (
            <div className="mt-6 text-sm">
              <div className="text-gray-300">Transaction:</div>
              <a
                className="text-indigo-300 underline break-all"
                href={txLink}
                target="_blank"
                rel="noreferrer"
              >
                {txHash}
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


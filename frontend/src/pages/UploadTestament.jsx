import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

import api from "../services/api";
import { getContract } from "../hooks/useContract";

function estPdf(file) {
  return file && file.type === "application/pdf";
}

function tronquer(text, left = 10, right = 4) {
  const s = String(text || "");
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

export default function UploadTestament() {
  const [etape, setEtape] = useState(1);
  const [file, setFile] = useState(null);
  const [mdp, setMdp] = useState("");
  const [mdp2, setMdp2] = useState("");

  const [testamentId, setTestamentId] = useState(null);
  const [ipfsCid, setIpfsCid] = useState(null);
  const [documentHash, setDocumentHash] = useState(null);
  const [nomFichier, setNomFichier] = useState("");

  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSoumission, setLoadingSoumission] = useState(false);
  const [loadingChain, setLoadingChain] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const indicateur = useMemo(() => {
    const labels = ["Choix du fichier", "Chiffrement", "Upload", "Blockchain"];
    return labels[etape - 1] || "";
  }, [etape]);

  const suivantEtape1 = () => {
    if (!file) return toast.error("Veuillez choisir un fichier PDF");
    if (!estPdf(file)) return toast.error("PDF uniquement");
    setNomFichier(file.name);
    setEtape(2);
  };

  const allerEtape3Upload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Aucun fichier sélectionné");
    if (!mdp) return toast.error("Mot de passe requis");
    if (mdp !== mdp2) return toast.error("Les mots de passe ne correspondent pas");

    try {
      setLoadingUpload(true);
      setEtape(3);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("encryptionPassword", mdp);

      const res = await api.post("/api/testament/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const data = res?.data || {};
      setTestamentId(data.testamentId);
      setIpfsCid(data.ipfsCid);
      setDocumentHash(data.documentHash);
      toast.success("Upload terminé");

      setEtape(4);
    } catch (err) {
      setEtape(2);
      toast.error(err?.response?.data?.error || err?.message || "Upload impossible");
    } finally {
      setLoadingUpload(false);
    }
  };

  const soumettreAuNotaire = async () => {
    if (!testamentId) return toast.error("Identifiant de testament manquant");
    try {
      setLoadingSoumission(true);
      await api.post(`/api/testament/submit/${testamentId}`);
      toast.success("Soumis au notaire");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Soumission impossible");
    } finally {
      setLoadingSoumission(false);
    }
  };

  const enregistrerSurBlockchain = async () => {
    if (!ipfsCid || !documentHash || !testamentId) return toast.error("Données manquantes");
    try {
      setLoadingChain(true);
      const contract = await getContract();
      const hashHex = documentHash.startsWith("0x") ? documentHash : `0x${documentHash}`;
      const bytes32 = ethers.hexlify(hashHex);

      toast.loading("Transaction en cours...", { id: "chain" });
      const tx = await contract.registerTestament(ipfsCid, bytes32);
      const receipt = await tx.wait();
      toast.success("Enregistré sur la blockchain", { id: "chain" });
      setTxHash(receipt?.hash);

      await api.post(`/api/testament/blockchain/${testamentId}`, { blockchainId: 0, txHash: receipt?.hash });
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Échec blockchain");
    } finally {
      setLoadingChain(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="text-sm text-gray-300">
          Étape {etape} / 4 — {indicateur}
        </div>
        <div className="mt-2 h-2 w-full bg-gray-800 rounded overflow-hidden">
          <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(etape / 4) * 100}%` }} />
        </div>
      </div>

      {etape === 1 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
          <h2 className="text-xl font-bold mb-4">Étape 1 — Choix du fichier</h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-300"
          />
          {file ? (
            <div className="mt-4 text-sm text-gray-300">
              Fichier : <span className="font-semibold text-gray-100">{file.name}</span>
            </div>
          ) : null}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={suivantEtape1}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
              disabled={!file}
            >
              Suivant
            </button>
          </div>
        </div>
      ) : null}

      {etape === 2 ? (
        <form onSubmit={allerEtape3Upload} className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
          <h2 className="text-xl font-bold mb-4">Étape 2 — Chiffrement</h2>
          <div className="text-sm text-gray-300 mb-4">
            Fichier : <span className="font-semibold text-gray-100">{nomFichier}</span>
          </div>

          <label className="block mb-3">
            <div className="text-sm text-gray-300 mb-1">Mot de passe</div>
            <input
              type="password"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block mb-6">
            <div className="text-sm text-gray-300 mb-1">Confirmation</div>
            <input
              type="password"
              value={mdp2}
              onChange={(e) => setMdp2(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 outline-none focus:border-indigo-500"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setEtape(1)}
              className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition font-semibold"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={loadingUpload}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
            >
              {loadingUpload ? "Upload..." : "Chiffrer et envoyer"}
            </button>
          </div>
        </form>
      ) : null}

      {etape === 3 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
          <h2 className="text-xl font-bold mb-4">Étape 3 — Upload</h2>
          <div className="text-gray-300">Upload en cours...</div>
        </div>
      ) : null}

      {etape === 4 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
          <h2 className="text-xl font-bold">Étape 4 — Blockchain</h2>

          <div className="text-sm text-gray-300">
            CID IPFS : <span className="font-mono text-gray-100">{ipfsCid ? tronquer(ipfsCid) : ""}</span>
          </div>
          <div className="text-sm text-gray-300">
            Hash :{" "}
            <span className="font-mono text-gray-100">{documentHash ? tronquer(documentHash, 14, 6) : ""}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={soumettreAuNotaire}
              disabled={loadingSoumission}
              className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 transition font-semibold disabled:opacity-50"
            >
              {loadingSoumission ? "Soumission..." : "📤 Soumettre au notaire"}
            </button>
            <button
              type="button"
              onClick={enregistrerSurBlockchain}
              disabled={loadingChain}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
            >
              {loadingChain ? "Blockchain..." : "🔗 Enregistrer sur la blockchain"}
            </button>
            <Link
              to="/testateur"
              className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition font-semibold text-center"
            >
              Retour au dashboard
            </Link>
          </div>

          {txHash ? (
            <div className="text-sm text-gray-300">
              Transaction :{" "}
              <a
                className="text-indigo-300 underline break-all"
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
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


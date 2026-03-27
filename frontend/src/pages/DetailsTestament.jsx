import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ethers } from "ethers";

import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { useDemoMode } from "../demo/DemoContext";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function tronquer(text, left = 12, right = 6) {
  const s = String(text || "");
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
}

async function deriveKeyAesGcm(password) {
  const passBytes = ethers.toUtf8Bytes(password, "NFKC");
  const saltBytes = ethers.toUtf8Bytes("notarain-salt");

  // Paramètres par défaut de Node crypto.scryptSync (N=16384, r=8, p=1)
  const keyHex = await ethers.scrypt(passBytes, saltBytes, 16384, 8, 1, 32);
  const keyBytes = ethers.getBytes(keyHex);

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function decryptEncryptedBuffer(encryptedArrayBuffer, password) {
  const data = new Uint8Array(encryptedArrayBuffer);
  if (data.length < 33) {
    throw new Error("Fichier chiffré invalide");
  }

  // Format backend: [IV 16][authTag 16][ciphertext ...]
  const iv = data.slice(0, 16);
  const authTag = data.slice(16, 32);
  const ciphertext = data.slice(32);

  // WebCrypto AES-GCM attend le tag à la fin du ciphertext
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const key = await deriveKeyAesGcm(password);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    combined
  );

  return plainBuffer;
}

export default function DetailsTestament() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [testament, setTestament] = useState(null);

  const [mdp, setMdp] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const { isDemoMode, testaments: demoTestaments, demoDecryptDocument } = useDemoMode();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        if (isDemoMode) {
          const t = (demoTestaments || []).find((x) => String(x._id) === String(id));
          if (mounted) setTestament(t || null);
        } else {
          const res = await api.get(`/api/testament/${id}`);
          const t = res?.data?.testament;
          if (mounted) setTestament(t || null);
        }
      } catch (err) {
        toast.error(err?.response?.data?.error || err?.message || "Chargement impossible");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id, isDemoMode, demoTestaments]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const ipfsLink = useMemo(() => {
    if (!testament?.ipfsCid) return null;
    return `${PINATA_GATEWAY}/${testament.ipfsCid}`;
  }, [testament?.ipfsCid]);

  const onDechiffrer = async () => {
    if (!testament?.ipfsCid) {
      toast.error("CID IPFS manquant");
      return;
    }
    if (!mdp) {
      toast.error("Mot de passe requis");
      return;
    }

    try {
      setDecrypting(true);
      toast.loading("Téléchargement du fichier chiffré...", { id: "dl" });
      if (isDemoMode) {
        const maybeBlob = await demoDecryptDocument(testament, mdp);
        toast.success("Fichier téléchargé", { id: "dl" });
        toast.loading("Déchiffrement en cours...", { id: "dec" });
        toast.success("Déchiffrement réussi", { id: "dec" });
        const blob =
          maybeBlob instanceof Blob
            ? maybeBlob
            : maybeBlob?.blob instanceof Blob
              ? maybeBlob.blob
              : null;
        if (!blob) {
          throw new Error("Impossible d’ouvrir le document démo");
        }
        const url = URL.createObjectURL(blob);
        setPdfUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      } else {
        const res = await fetch(ipfsLink);
        if (!res.ok) {
          throw new Error(`Téléchargement impossible (${res.status})`);
        }
        const encryptedBuffer = await res.arrayBuffer();
        toast.success("Fichier téléchargé", { id: "dl" });

        toast.loading("Déchiffrement en cours...", { id: "dec" });
        const plainBuffer = await decryptEncryptedBuffer(encryptedBuffer, mdp);
        toast.success("Déchiffrement réussi", { id: "dec" });

        const blob = new Blob([plainBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      }
    } catch (err) {
      toast.error(err?.message || "Déchiffrement impossible");
    } finally {
      setDecrypting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
      </div>
    );
  }

  if (!testament) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 text-gray-300">
          Testament introuvable.
        </div>
      </div>
    );
  }

  const accessible = testament.status === "executed";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xl font-bold truncate">{testament.originalFileName || "Testament"}</div>
            <div className="mt-1 text-sm text-gray-300">
              Créé le : {formatDate(testament.createdAt)} — Dernière mise à jour : {formatDate(testament.updatedAt)}
            </div>
            <div className="mt-2 text-sm text-gray-300">
              Testateur : <span className="font-mono">{testament.testatorWallet}</span>
            </div>
          </div>
          <StatusBadge status={testament.status} />
        </div>

        <div className="mt-4 text-sm text-gray-300">
          CID IPFS :{" "}
          {ipfsLink ? (
            <a href={ipfsLink} target="_blank" rel="noreferrer" className="text-indigo-300 underline break-all">
              {tronquer(testament.ipfsCid)}
            </a>
          ) : (
            <span className="text-gray-400">Non renseigné</span>
          )}
        </div>

        {testament.documentHash ? (
          <div className="mt-2 text-sm text-gray-300">
            Hash document : <span className="font-mono">{tronquer(testament.documentHash, 18, 8)}</span>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
        <div className="text-lg font-bold">Accès au document</div>
        <p className="mt-2 text-gray-300 leading-relaxed">
          Le document n’est accessible qu’après exécution (validation + confirmation du décès).
        </p>

        {!accessible ? (
          <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 p-4 text-gray-300">
            Statut actuel : <span className="font-semibold">non accessible</span>.
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="password"
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
                placeholder="Mot de passe de chiffrement"
                className="sm:col-span-2 px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={onDechiffrer}
                disabled={decrypting}
                className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition font-semibold disabled:opacity-50"
              >
                {decrypting ? "Déchiffrement..." : "Déchiffrer"}
              </button>
            </div>

            {pdfUrl ? (
              <div className="mt-6 space-y-3">
                <a
                  href={pdfUrl}
                  download={testament.originalFileName || "testament.pdf"}
                  className="inline-flex px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
                >
                  Télécharger le PDF
                </a>
                <div className="rounded-lg overflow-hidden border border-gray-800">
                  <iframe title="Testament PDF" src={pdfUrl} className="w-full h-[70vh] bg-white" />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}


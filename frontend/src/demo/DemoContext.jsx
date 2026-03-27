import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import {
  demoUsers,
  initialTestatorTestaments,
  initialPendingTestaments,
  initialAllNotaryTestaments,
  initialHeirTestaments
} from "./demoData";

const DemoContext = createContext(null);

const initialNotifications = [
  {
    id: 1,
    message: 'Your testament "testament_biens_immobiliers_2026.pdf" has been approved by the notary',
    date: "2026-03-01T11:00:00Z",
    read: true
  },
  {
    id: 2,
    message: 'Your testament "testament_principal_mouna_2026.pdf" has been executed. Heirs have been notified.',
    date: "2026-03-20T14:45:00Z",
    read: false
  }
];

function nowIso() {
  return new Date().toISOString();
}

function randomHex(nibbles = 64) {
  return "0x" + Array(nibbles).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

function randomBlockchainId() {
  return Math.floor(Math.random() * (99 - 13 + 1)) + 13;
}

function attachHeirData(testaments) {
  const heirWallet = String(demoUsers.heir.walletAddress || "").toLowerCase();
  return (testaments || [])
    .filter((t) => (t.heirs || []).some((h) => String(h.walletAddress || "").toLowerCase() === heirWallet))
    .map((t) => {
      const heirEntry = (t.heirs || []).find((h) => String(h.walletAddress || "").toLowerCase() === heirWallet);
      return { ...t, myShare: heirEntry?.share };
    });
}

function safeTimeline(t) {
  return Array.isArray(t?.timeline) ? t.timeline : [];
}

function updateAllArrays({ testaments, pendingTestaments, allNotaryTestaments, heirTestaments }, nextTestaments) {
  testaments.current(nextTestaments);
  pendingTestaments.current(nextTestaments.filter((t) => t.status === "pending"));
  allNotaryTestaments.current(nextTestaments);
  heirTestaments.current(attachHeirData(nextTestaments));
}

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [demoUser, setDemoUser] = useState(null);

  const [testaments, setTestaments] = useState(initialTestatorTestaments);
  const [pendingTestaments, setPendingTestaments] = useState(initialPendingTestaments);
  const [allNotaryTestaments, setAllNotaryTestaments] = useState(initialAllNotaryTestaments);
  const [heirTestaments, setHeirTestaments] = useState(initialHeirTestaments);
  const [notifications, setNotifications] = useState(initialNotifications);

  // Refs to always update from latest state in async callbacks.
  const testamentsRef = useRef(testaments);
  const pendingRef = useRef(pendingTestaments);
  const allNotaryRef = useRef(allNotaryTestaments);
  const heirRef = useRef(heirTestaments);
  const notificationsRef = useRef(notifications);
  const demoUserRef = useRef(demoUser);

  testamentsRef.current = testaments;
  pendingRef.current = pendingTestaments;
  allNotaryRef.current = allNotaryTestaments;
  heirRef.current = heirTestaments;
  notificationsRef.current = notifications;
  demoUserRef.current = demoUser;

  const resetAll = () => {
    setIsDemoMode(false);
    setDemoRole(null);
    setDemoUser(null);
    setTestaments(initialTestatorTestaments);
    setPendingTestaments(initialPendingTestaments);
    setAllNotaryTestaments(initialAllNotaryTestaments);
    setHeirTestaments(initialHeirTestaments);
    setNotifications(initialNotifications);
  };

  const enterDemo = (role) => {
    const normalized = String(role || "").toLowerCase();
    const u = demoUsers[normalized];
    if (!u) return;
    setIsDemoMode(true);
    setDemoRole(normalized);
    setDemoUser(u);
    setTestaments(initialTestatorTestaments);
    setPendingTestaments(initialPendingTestaments);
    setAllNotaryTestaments(initialAllNotaryTestaments);
    setHeirTestaments(initialHeirTestaments);
    setNotifications(initialNotifications);
  };

  const exitDemo = () => resetAll();

  const pushNotification = (message) => {
    const n = { id: Date.now(), message, date: nowIso(), read: false };
    setNotifications((prev) => [n, ...(prev || [])]);
    return n;
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => (prev || []).map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => (prev || []).map((n) => ({ ...n, read: true })));
  };

  // --- TESTATOR ACTIONS ---

  const demoUploadTestament = (file, password, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("Missing file."));
      const pass = String(password || "");
      if (!pass) return reject(new Error("Password is required."));

      const id = "demo-new-" + Date.now();
      const ipfsCid = "QmDemo" + Math.random().toString(36).substr(2, 40);
      const documentHash = randomHex(64);
      const fileName = file?.name || "demo_upload.pdf";
      const actor = demoUserRef.current?.displayWallet || demoUsers.testator.displayWallet;
      const createdAt = nowIso();

      const t1 = setTimeout(() => onProgress?.("Encrypting document with AES-256..."), 1000);
      const t2 = setTimeout(() => onProgress?.("Uploading encrypted file to IPFS..."), 2000);
      const t3 = setTimeout(() => onProgress?.("Verifying upload integrity..."), 3000);

      setTimeout(() => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);

        const newTestament = {
          _id: id,
          testatorWallet: demoUsers.testator.walletAddress,
          originalFileName: fileName,
          status: "draft",
          ipfsCid,
          documentHash,
          blockchainId: null,
          txHash: null,
          rejectionReason: null,
          createdAt,
          updatedAt: createdAt,
          notaryWallet: null,
          heirs: [],
          timeline: [
            {
              status: "draft",
              label: "Testament Created",
              date: createdAt,
              actor,
              note: "Document uploaded and encrypted"
            }
          ]
        };

        const next = [newTestament, ...(testamentsRef.current || [])];
        setTestaments(next);
        setPendingTestaments((next || []).filter((x) => x.status === "pending"));
        setAllNotaryTestaments(next);
        setHeirTestaments(attachHeirData(next));

        resolve({ testamentId: id, ipfsCid, documentHash, fileName });
      }, 3500);
    });
  };

  const demoSubmitTestament = (id) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      setTimeout(() => {
        const actor = demoUserRef.current?.displayWallet || demoUsers.testator.displayWallet;
        const date = nowIso();

        let updated = null;
        const next = (testamentsRef.current || []).map((t) => {
          if (t._id !== id) return t;
          updated = {
            ...t,
            status: "pending",
            updatedAt: date,
            timeline: [
              ...safeTimeline(t),
              { status: "pending", label: "Submitted for Review", date, actor, note: "Sent to notary queue" }
            ]
          };
          return updated;
        });

        setTestaments(next);
        setPendingTestaments([updated, ...(pendingRef.current || []).filter((x) => x._id !== id)]);
        setAllNotaryTestaments([updated, ...(allNotaryRef.current || []).filter((x) => x._id !== id)]);
        setHeirTestaments(attachHeirData(next));

        pushNotification("Your testament has been submitted for notary review");
        resolve(updated);
      }, 800);
    });
  };

  const demoRegisterOnChain = (id, ipfsCid, documentHash) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      setTimeout(() => {
        const actor = demoUserRef.current?.displayWallet || demoUsers.testator.displayWallet;
        const date = nowIso();
        const blockchainId = randomBlockchainId();
        const txHash = randomHex(64);

        let updated = null;
        const next = (testamentsRef.current || []).map((t) => {
          if (t._id !== id) return t;
          updated = {
            ...t,
            ipfsCid: ipfsCid || t.ipfsCid,
            documentHash: documentHash || t.documentHash,
            blockchainId,
            txHash,
            updatedAt: date,
            timeline: [
              ...safeTimeline(t),
              {
                status: "approved",
                label: "Registered on Blockchain",
                date,
                actor,
                note: "Transaction confirmed on Sepolia"
              }
            ]
          };
          return updated;
        });

        setTestaments(next);
        setPendingTestaments((pendingRef.current || []).map((x) => (x._id === id ? updated : x)));
        setAllNotaryTestaments((allNotaryRef.current || []).map((x) => (x._id === id ? updated : x)));
        setHeirTestaments(attachHeirData(next));

        resolve({ txHash, blockchainId });
      }, 2500);
    });
  };

  const demoDeleteTestament = (id) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      setTimeout(() => {
        const t = (testamentsRef.current || []).find((x) => x._id === id);
        if (!t) return reject(new Error("Not found."));
        if (t.status !== "draft") return reject(new Error("Only drafts can be deleted."));
        const next = (testamentsRef.current || []).filter((x) => x._id !== id);
        setTestaments(next);
        setPendingTestaments(next.filter((x) => x.status === "pending"));
        setAllNotaryTestaments(next);
        setHeirTestaments(attachHeirData(next));
        resolve({ success: true });
      }, 500);
    });
  };

  const demoSaveHeirs = (id, heirs) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      setTimeout(() => {
        const actor = demoUserRef.current?.displayWallet || demoUsers.testator.displayWallet;
        const date = nowIso();
        const list = Array.isArray(heirs) ? heirs : [];

        let updated = null;
        const next = (testamentsRef.current || []).map((t) => {
          if (t._id !== id) return t;
          updated = {
            ...t,
            heirs: list,
            updatedAt: date,
            timeline: [
              ...safeTimeline(t),
              {
                status: t.status,
                label: "Beneficiaries Updated",
                date,
                actor,
                note: `${list.length} beneficiary(ies) designated`
              }
            ]
          };
          return updated;
        });

        setTestaments(next);
        setPendingTestaments((pendingRef.current || []).map((x) => (x._id === id ? updated : x)));
        setAllNotaryTestaments((allNotaryRef.current || []).map((x) => (x._id === id ? updated : x)));
        setHeirTestaments(attachHeirData(next));

        resolve(updated);
      }, 600);
    });
  };

  const demoRevokeTestament = (id) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      setTimeout(() => {
        const actor = demoUserRef.current?.displayWallet || demoUsers.testator.displayWallet;
        const date = nowIso();

        let updated = null;
        const next = (testamentsRef.current || []).map((t) => {
          if (t._id !== id) return t;
          updated = {
            ...t,
            status: "revoked",
            updatedAt: date,
            timeline: [
              ...safeTimeline(t),
              {
                status: "revoked",
                label: "Testament Revoked",
                date,
                actor,
                note: "Testator initiated revocation"
              }
            ]
          };
          return updated;
        });

        setTestaments(next);
        setPendingTestaments((pendingRef.current || []).map((x) => (x._id === id ? updated : x)));
        setAllNotaryTestaments((allNotaryRef.current || []).map((x) => (x._id === id ? updated : x)));
        setHeirTestaments(attachHeirData(next));
        resolve(updated);
      }, 1500);
    });
  };

  // --- NOTARY ACTIONS ---

  const demoApproveTestament = (id) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      setTimeout(() => {
        const actor = demoUsers.notary.displayWallet;
        const date = nowIso();

        let updated = null;
        const next = (testamentsRef.current || []).map((t) => {
          if (t._id !== id) return t;
          updated = {
            ...t,
            status: "approved",
            notaryWallet: demoUsers.notary.walletAddress,
            updatedAt: date,
            timeline: [
              ...safeTimeline(t),
              { status: "approved", label: "Approved by Notary", date, actor, note: "Document verified and validated" }
            ]
          };
          return updated;
        });

        setTestaments(next);
        setPendingTestaments((pendingRef.current || []).filter((x) => x._id !== id));
        setAllNotaryTestaments((allNotaryRef.current || []).map((x) => (x._id === id ? updated : x)));
        setHeirTestaments(attachHeirData(next));

        pushNotification(`Your testament "${updated?.originalFileName}" has been approved by the notary`);
        resolve(updated);
      }, 2000);
    });
  };

  const demoRejectTestament = (id, reason) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      const r = String(reason || "");
      if (r.trim().length < 10) return reject(new Error("Rejection reason must be at least 10 characters."));

      setTimeout(() => {
        const actor = demoUsers.notary.displayWallet;
        const date = nowIso();

        let updated = null;
        const next = (testamentsRef.current || []).map((t) => {
          if (t._id !== id) return t;
          updated = {
            ...t,
            status: "rejected",
            rejectionReason: r.trim(),
            notaryWallet: demoUsers.notary.walletAddress,
            updatedAt: date,
            timeline: [
              ...safeTimeline(t),
              { status: "rejected", label: "Rejected by Notary", date, actor, note: r.trim() }
            ]
          };
          return updated;
        });

        setTestaments(next);
        setPendingTestaments((pendingRef.current || []).filter((x) => x._id !== id));
        setAllNotaryTestaments((allNotaryRef.current || []).map((x) => (x._id === id ? updated : x)));
        setHeirTestaments(attachHeirData(next));

        pushNotification(`Your testament "${updated?.originalFileName}" was rejected: ${r.trim()}`);
        resolve(updated);
      }, 1000);
    });
  };

  const demoExecuteTestament = (id) => {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error("Missing testament id."));
      setTimeout(() => {
        const actor = demoUsers.notary.displayWallet;
        const date = nowIso();

        let updated = null;
        const next = (testamentsRef.current || []).map((t) => {
          if (t._id !== id) return t;
          updated = {
            ...t,
            status: "executed",
            notaryWallet: demoUsers.notary.walletAddress,
            updatedAt: date,
            timeline: [
              ...safeTimeline(t),
              {
                status: "executed",
                label: "Executed by Notary",
                date,
                actor,
                note: "Death confirmed — heirs granted access"
              }
            ]
          };
          return updated;
        });

        setTestaments(next);
        setPendingTestaments((pendingRef.current || []).map((x) => (x._id === id ? updated : x)));
        setAllNotaryTestaments((allNotaryRef.current || []).map((x) => (x._id === id ? updated : x)));
        setHeirTestaments(attachHeirData(next));

        pushNotification(`Testament "${updated?.originalFileName}" has been executed. Heirs have been notified.`);
        resolve(updated);
      }, 2000);
    });
  };

  // --- HEIR ACTIONS ---

  const demoDecryptDocument = (testament, password) => {
    return new Promise((resolve, reject) => {
      const pass = String(password || "");
      if (!pass) return reject(new Error("Password is required."));

      setTimeout(() => {
        const formattedDate = new Date(testament?.updatedAt || testament?.createdAt || nowIso()).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });

        const heirsList = (testament?.heirs || [])
          .map((h) => ` • ${h.name} (${h.walletAddress}) — ${h.share}`)
          .join("\n");

        const content = `╔══════════════════════════════════════════════════╗
 ║           NOTARAIN — VERIFIED TESTAMENT           ║
 ╚══════════════════════════════════════════════════╝

 DOCUMENT INFORMATION
 ─────────────────────────────────────────────────────
 File Name     : ${testament.originalFileName}
 Testator      : ${testament.testatorWallet}
 Notary        : ${testament.notaryWallet}
 Blockchain ID : #${testament.blockchainId}
 IPFS CID      : ${testament.ipfsCid}
 Hash (SHA-256): ${testament.documentHash}
 Executed On   : ${formattedDate}

 VERIFICATION
 ─────────────────────────────────────────────────────
 ✓ Document integrity verified on-chain
 ✓ Notary signature confirmed
 ✓ Decryption successful — AES-256-GCM

 BENEFICIARIES
 ─────────────────────────────────────────────────────
${heirsList}

 TESTAMENT CONTENT
 ─────────────────────────────────────────────────────
 I, Mouna Jaimi, being of sound mind and body, hereby
 declare this to be my Last Will and Testament.

 I revoke all previous wills and codicils.

 I designate the beneficiaries listed above to receive
 the assets corresponding to their designated shares.

 This document has been cryptographically sealed and
 recorded immutably on the Ethereum Sepolia blockchain.

 ─────────────────────────────────────────────────────
 Notarain | Decentralized Notarial Platform
 EMSI Marrakech — Blockchain Project 2025/2026
 ─────────────────────────────────────────────────────`;

        const blob = new Blob([content], { type: "text/plain" });
        const name = String(testament.originalFileName || "testament.pdf").replace(".pdf", "_DECRYPTED.txt");
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        resolve({ success: true });
      }, 1500);
    });
  };

  const demoVerifyHash = (testament) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          verified: true,
          onChainHash: testament.documentHash,
          computedHash: testament.documentHash,
          match: true
        });
      }, 800);
    });
  };

  const value = useMemo(
    () => ({
      isDemoMode,
      demoRole,
      demoUser,
      testaments,
      pendingTestaments,
      allNotaryTestaments,
      heirTestaments,
      notifications,
      enterDemo,
      exitDemo,

      demoUploadTestament,
      demoSubmitTestament,
      demoRegisterOnChain,
      demoDeleteTestament,
      demoSaveHeirs,
      demoRevokeTestament,

      markNotificationRead,
      markAllNotificationsRead,

      demoApproveTestament,
      demoRejectTestament,
      demoExecuteTestament,

      demoDecryptDocument,
      demoVerifyHash
    }),
    [
      isDemoMode,
      demoRole,
      demoUser,
      testaments,
      pendingTestaments,
      allNotaryTestaments,
      heirTestaments,
      notifications
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoMode() {
  return useContext(DemoContext);
}

export default DemoContext;


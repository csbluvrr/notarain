const crypto = require("crypto");

const Testament = require("../models/Testament");
const { encryptBuffer } = require("../services/encryption.service");
const { uploadEncryptedFile } = require("../services/ipfs.service");

function normalizeWalletAddress(walletAddress) {
  return String(walletAddress || "").toLowerCase().trim();
}

function parseBlockchainId(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

async function uploadTestament(req, res) {
  try {
    const file = req.file;
    const encryptionPassword = req.body?.encryptionPassword;

    if (!file) {
      return res.status(400).json({ error: "PDF file is required" });
    }
    if (!encryptionPassword || typeof encryptionPassword !== "string") {
      return res.status(400).json({ error: "encryptionPassword is required" });
    }
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

    const buffer = file.buffer;
    const documentHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const encryptedBuffer = encryptBuffer(buffer, encryptionPassword);
    const ipfsCid = await uploadEncryptedFile(encryptedBuffer, file.originalname || "testament.pdf");

    const now = new Date();
    const testament = await Testament.create({
      testatorWallet: normalizeWalletAddress(req.user.walletAddress),
      ipfsCid,
      documentHash,
      status: "draft",
      notaryWallet: undefined,
      originalFileName: file.originalname,
      createdAt: now,
      updatedAt: now
    });

    return res.status(201).json({
      testamentId: testament._id,
      ipfsCid,
      documentHash
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function submitTestament(req, res) {
  try {
    const { id } = req.params;
    const testament = await Testament.findById(id);

    if (!testament) {
      return res.status(404).json({ error: "Testament not found" });
    }

    const wallet = normalizeWalletAddress(req.user.walletAddress);
    if (testament.testatorWallet !== wallet) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (testament.status !== "draft") {
      return res.status(400).json({ error: "Testament is not in draft status" });
    }

    testament.status = "pending";
    testament.updatedAt = new Date();

    await testament.save();
    return res.status(200).json({ testament });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function setBlockchainId(req, res) {
  try {
    const { id } = req.params;
    const { blockchainId } = req.body || {};

    const parsedBlockchainId = parseBlockchainId(blockchainId);
    if (parsedBlockchainId === null) {
      return res.status(400).json({ error: "blockchainId must be a number" });
    }

    const testament = await Testament.findById(id);
    if (!testament) {
      return res.status(404).json({ error: "Testament not found" });
    }

    const wallet = normalizeWalletAddress(req.user.walletAddress);
    if (testament.testatorWallet !== wallet) {
      return res.status(403).json({ error: "Forbidden" });
    }

    testament.blockchainId = parsedBlockchainId;
    await testament.save();

    return res.status(200).json({ testament });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function getMyTestaments(req, res) {
  try {
    const wallet = normalizeWalletAddress(req.user.walletAddress);
    const testaments = await Testament.find({ testatorWallet: wallet }).sort({ createdAt: -1 });
    return res.status(200).json({ testaments });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function getTestamentById(req, res) {
  try {
    const { id } = req.params;
    const testament = await Testament.findById(id);
    if (!testament) {
      return res.status(404).json({ error: "Testament not found" });
    }
    return res.status(200).json({ testament });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Invalid id" });
  }
}

module.exports = {
  uploadTestament,
  submitTestament,
  setBlockchainId,
  getMyTestaments,
  getTestamentById
};


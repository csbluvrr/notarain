const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

const User = require("../models/User");

function normalizeWalletAddress(walletAddress) {
  return String(walletAddress || "").toLowerCase().trim();
}

async function register(req, res) {
  try {
    const { walletAddress, role } = req.body || {};
    const normalizedWallet = normalizeWalletAddress(walletAddress);

    if (!normalizedWallet) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    if (role !== "testator") {
      return res.status(400).json({ error: "role must be 'testator'" });
    }

    let user = await User.findOne({ walletAddress: normalizedWallet });
    if (!user) {
      user = await User.create({ walletAddress: normalizedWallet, role: "testator" });
    }

    return res.status(200).json({ user: { walletAddress: user.walletAddress, role: user.role } });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function nonce(req, res) {
  try {
    const { walletAddress } = req.body || {};
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    if (!normalizedWallet) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    let user = await User.findOne({ walletAddress: normalizedWallet });
    if (!user) {
      user = await User.create({ walletAddress: normalizedWallet, role: "testator" });
    }

    const newNonce = crypto.randomBytes(32).toString("hex");
    user.nonce = newNonce;
    await user.save();

    return res.status(200).json({ message: `Sign this message to login to Notarain: ${newNonce}` });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function verify(req, res) {
  try {
    const { walletAddress, signature } = req.body || {};
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    if (!normalizedWallet) {
      return res.status(400).json({ error: "walletAddress is required" });
    }
    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ error: "signature is required" });
    }

    const user = await User.findOne({ walletAddress: normalizedWallet });
    if (!user || !user.nonce) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const message = `Sign this message to login to Notarain: ${user.nonce}`;
    const recovered = ethers.verifyMessage(message, signature);

    if (String(recovered).toLowerCase() !== normalizedWallet) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newNonce = crypto.randomBytes(32).toString("hex");
    user.nonce = newNonce;
    await user.save();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const token = jwt.sign(
      { walletAddress: user.walletAddress, role: user.role },
      secret
    );

    return res.status(200).json({ token, user: { walletAddress: user.walletAddress, role: user.role } });
  } catch (err) {
    return res.status(401).json({ error: err.message || "Unauthorized" });
  }
}

module.exports = { register, nonce, verify };


const Testament = require("../models/Testament");

function normalizeWalletAddress(walletAddress) {
  return String(walletAddress || "").toLowerCase().trim();
}

async function getHeirTestaments(req, res) {
  try {
    const wallet = normalizeWalletAddress(req.user.walletAddress);
    const testaments = await Testament.find({
      "heirs.walletAddress": wallet
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ testaments });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

module.exports = { getHeirTestaments };


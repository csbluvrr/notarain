const Testament = require("../models/Testament");

async function pending(req, res) {
  try {
    const testaments = await Testament.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.status(200).json({ testaments });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function approve(req, res) {
  try {
    const { id } = req.params;
    const testament = await Testament.findById(id);

    if (!testament) {
      return res.status(404).json({ error: "Testament not found" });
    }

    testament.status = "approved";
    testament.notaryWallet = req.user.walletAddress.toLowerCase().trim();
    testament.updatedAt = new Date();

    await testament.save();
    return res.status(200).json({ testament });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function reject(req, res) {
  try {
    const { id } = req.params;
    const testament = await Testament.findById(id);

    if (!testament) {
      return res.status(404).json({ error: "Testament not found" });
    }

    testament.status = "rejected";
    testament.notaryWallet = req.user.walletAddress.toLowerCase().trim();
    testament.updatedAt = new Date();

    await testament.save();
    return res.status(200).json({ testament });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function execute(req, res) {
  try {
    const { id } = req.params;
    const testament = await Testament.findById(id);

    if (!testament) {
      return res.status(404).json({ error: "Testament not found" });
    }

    testament.status = "executed";
    testament.updatedAt = new Date();

    await testament.save();
    return res.status(200).json({ testament });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

async function all(req, res) {
  try {
    const testaments = await Testament.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ testaments });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

module.exports = { pending, approve, reject, execute, all };


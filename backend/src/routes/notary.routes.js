const express = require("express");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const notaryController = require("../controllers/notary.controller");
const notaryQueries = require("../database/notaryQueries");
const blockchainService = require("../services/blockchain.service");
const NotaryMonitor = require("../jobs/notaryMonitor");
const emailService = require("../services/email.service");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Create monitor instance once (for trigger endpoint)
const monitor = new NotaryMonitor();

// ============ EXISTING ROUTES ============
router.get(
  "/pending",
  authRequired,
  requireRole("notary"),
  notaryController.pending
);

router.post(
  "/approve/:id",
  authRequired,
  requireRole("notary"),
  notaryController.approve
);

router.post(
  "/reject/:id",
  authRequired,
  requireRole("notary"),
  notaryController.reject
);

router.post(
  "/execute/:id",
  authRequired,
  requireRole("notary"),
  notaryController.execute
);

router.get("/all", authRequired, requireRole("notary"), notaryController.all);

// Register a notary (call this after on-chain registration)
router.post("/register-monitor", async (req, res) => {
  try {
    const { walletAddress, email, name } = req.body;

    if (!walletAddress || !email || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify this wallet is actually a notary on-chain
    const onChain = await blockchainService.getNotaryInfo(walletAddress);
    if (!onChain || !onChain.isActive) {
      return res.status(400).json({
        error: "Wallet is not an active notary on the blockchain",
        onChain: onChain || null,
      });
    }

    // Check if already registered in database
    const existing = await notaryQueries.getByWallet(walletAddress);
    if (existing && existing.deactivated === 0) {
      return res.status(400).json({ error: "Notary already registered" });
    }

    await notaryQueries.register(walletAddress, email, name);
    await notaryQueries.logActivity(
      walletAddress,
      "REGISTERED",
      `Name: ${name}, Email: ${email}`
    );

    res.json({
      success: true,
      message: "Notary registered successfully for monitoring",
      data: { walletAddress, email, name },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get notary status (for dashboard)
router.get("/monitor-status/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Get off-chain data (from your local database)
    const offChain = await notaryQueries.getByWallet(walletAddress);

    // Get on-chain data (from blockchain)
    const onChain = await blockchainService.getNotaryInfo(walletAddress);

    if (!onChain) {
      return res.status(404).json({ error: "Notary not found on blockchain" });
    }

    // Calculate inactivity days
    const currentTimestamp = await blockchainService.getCurrentBlockTimestamp();
    const daysInactive = blockchainService.calculateDaysInactive(
      onChain.lastActive,
      currentTimestamp
    );

    // Determine status
    let status = "active";
    const warningThreshold = parseInt(process.env.INACTIVE_WARNING_DAYS) || 10;
    const deactivationThreshold =
      parseInt(process.env.INACTIVE_DEACTIVATE_DAYS) || 20;

    if (daysInactive >= deactivationThreshold) {
      status = "inactive_deactivated";
    } else if (daysInactive >= warningThreshold) {
      status = "warning";
    } else {
      status = "active";
    }

    res.json({
      walletAddress,
      offChain: offChain || null,
      onChain: {
        name: onChain.name,
        isActive: onChain.isActive,
        isAlive: onChain.isAlive,
        lastActive: onChain.lastActive,
        lastActiveDate: new Date(
          parseInt(onChain.lastActive) * 1000
        ).toISOString(),
      },
      monitoring: {
        daysInactive,
        status,
        warningThreshold,
        deactivationThreshold,
        daysRemaining:
          daysInactive < deactivationThreshold
            ? deactivationThreshold - daysInactive
            : 0,
        lastWarningSent: offChain?.last_warning_sent
          ? new Date(offChain.last_warning_sent * 1000).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger monitor (for testing and admin)
router.post("/trigger-monitor", async (req, res) => {
  try {
    // Run in background so we can respond quickly
    monitor.checkAllNotaries().catch(console.error);
    res.json({
      success: true,
      message:
        "Monitor triggered in background. Check server logs for results.",
    });
  } catch (error) {
    console.error("Trigger error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity logs for a specific notary
router.get("/logs/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await notaryQueries.getLogs(walletAddress, limit);

    // Format dates for readability
    const formattedLogs = logs.map((log) => ({
      ...log,
      created_at_date: new Date(log.created_at * 1000).toISOString(),
    }));

    res.json({
      walletAddress,
      total: formattedLogs.length,
      logs: formattedLogs,
    });
  } catch (error) {
    console.error("Logs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all registered notaries (for admin)
router.get("/monitored-notaries", async (req, res) => {
  try {
    const notaries = await notaryQueries.getAllActive();

    // Enhance with on-chain data
    const enhancedNotaries = await Promise.all(
      notaries.map(async (notary) => {
        const onChain = await blockchainService.getNotaryInfo(
          notary.wallet_address
        );
        const currentTimestamp =
          await blockchainService.getCurrentBlockTimestamp();
        const daysInactive = onChain
          ? blockchainService.calculateDaysInactive(
              onChain.lastActive,
              currentTimestamp
            )
          : null;

        return {
          ...notary,
          onChainActive: onChain?.isActive || false,
          daysInactive,
          lastActiveOnChain: onChain?.lastActive
            ? new Date(parseInt(onChain.lastActive) * 1000).toISOString()
            : null,
        };
      })
    );

    res.json({
      total: enhancedNotaries.length,
      notaries: enhancedNotaries,
    });
  } catch (error) {
    console.error("All notaries error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check for monitoring system
router.get("/monitor-health", async (req, res) => {
  try {
    const blockchainHealth = await blockchainService.healthCheck();
    const totalNotaries = await notaryQueries.getAllActive();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      blockchain: blockchainHealth,
      monitoring: {
        totalNotariesMonitored: totalNotaries.length,
        warningDays: parseInt(process.env.INACTIVE_WARNING_DAYS) || 10,
        deactivateDays: parseInt(process.env.INACTIVE_DEACTIVATE_DAYS) || 20,
        cronSchedule: "0 9 * * * (daily at 9:00 AM)",
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ error: error.message });
  }
});

// TESTING ONLY
router.post("/test-email", async (req, res) => {
  try {
    const { email = process.env.EMAIL_USER, type = "warning" } = req.body;

    let result = false;

    console.log(email);
    console.log(req.body);

    switch (type) {
      case "warning":
        result = await emailService.sendWarningEmail(
          email,
          "Test Notary",
          10, // 10 days inactive
          10 // 10 days remaining
        );
        break;
      case "deactivation":
        result = await emailService.sendDeactivationEmail(
          email,
          "Test Notary",
          25,
          "Successor Notary",
          "successor@example.com"
        );
        break;
      case "transfer":
        result = await emailService.sendKeyTransferEmail(
          email,
          "Successor Notary",
          "Original Notary"
        );
        break;
      default:
        return res.status(400).json({ error: "Invalid email type" });
    }

    if (result) {
      res.json({
        success: true,
        message: `Test ${type} email sent to ${email}`,
      });
    } else {
      res.status(500).json({ error: "Failed to send email" });
    }
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/download-notary-key/:address", async (req, res) => {
  try {
    const { address } = req.params;
    console.log("Requested address:", address);

    const keyFilePath = path.join(__dirname, `../../keys/${address}.key.json`);
    console.log("Looking for file at:", keyFilePath);

    // Check if file exists
    if (!fs.existsSync(keyFilePath)) {
      console.log("File does not exist");
      return res
        .status(404)
        .json({ error: "Key file not found for this address" });
    }

    // Read the key file
    const keyDataRaw = fs.readFileSync(keyFilePath, "utf8");
    console.log("File read successfully, length:", keyDataRaw.length);

    // Try to parse as JSON to validate
    let keyData;
    try {
      keyData = JSON.parse(keyDataRaw);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(500).json({ error: "Invalid key file format" });
    }

    // Ensure the address matches
    if (
      keyData.notaryAddress &&
      keyData.notaryAddress.toLowerCase() !== address.toLowerCase()
    ) {
      console.log("Address mismatch:", keyData.notaryAddress, "vs", address);
      return res
        .status(403)
        .json({ error: "Key file does not match requested address" });
    }

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=notary_key_${address}.json`
    );

    // Send the parsed JSON (not raw string)
    return res.json(keyData);
  } catch (error) {
    console.error("Error serving key file:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Failed to retrieve key file",
      details: error.message,
    });
  }
});

module.exports = router;

const cron = require("node-cron");
const emailService = require("../services/email.service");
const notaryQueries = require("../database/notaryQueries");
const blockchainService = require("../services/blockchain.service");

const WARNING_DAYS = parseInt(process.env.INACTIVE_WARNING_DAYS) || 10;
const DEACTIVATE_DAYS = parseInt(process.env.INACTIVE_DEACTIVATE_DAYS) || 20;

class NotaryMonitor {
  constructor() {
    this.isRunning = false;
  }

  async checkAllNotaries() {
    if (this.isRunning) {
      console.log("⚠️ Monitor already running, skipping...");
      return;
    }

    this.isRunning = true;
    console.log(`\n🕒 ${new Date().toISOString()} - Starting notary check...`);

    try {
      const notaries = await notaryQueries.getAllActive();
      console.log(`📋 Found ${notaries.length} active notaries`);

      const currentTimestamp =
        await blockchainService.getCurrentBlockTimestamp();

      for (const notary of notaries) {
        const onChain = await blockchainService.getNotaryInfo(
          notary.wallet_address,
        );

        if (!onChain || !onChain.isActive) {
          console.log(`⏸️ ${notary.name} is already inactive on-chain`);
          continue;
        }

        const daysInactive = blockchainService.calculateDaysInactive(
          onChain.lastActive,
          currentTimestamp,
        );
        console.log(`📊 ${notary.name}: ${daysInactive} days inactive`);

        // WARNING (10-19 days)
        if (daysInactive >= WARNING_DAYS && daysInactive < DEACTIVATE_DAYS) {
          const lastWarning = notary.last_warning_sent;
          const daysSinceWarning = lastWarning
            ? Math.floor((Date.now() / 1000 - lastWarning) / (24 * 60 * 60))
            : 999;

          if (!lastWarning || daysSinceWarning >= 3) {
            const daysRemaining = DEACTIVATE_DAYS - daysInactive;
            await emailService.sendWarningEmail(
              notary.email,
              notary.name,
              daysInactive,
              daysRemaining,
            );
            await notaryQueries.updateWarningSent(notary.wallet_address);
            await notaryQueries.logActivity(
              notary.wallet_address,
              "WARNING_SENT",
              `${daysInactive} days inactive`,
            );
          }
        }

        // DEACTIVATE (20+ days)
        else if (daysInactive >= DEACTIVATE_DAYS) {
          console.log(`🔴 Deactivating ${notary.wallet_address}...`);

          const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
          const result = await blockchainService.deactivateNotary(
            notary.wallet_address,
            adminPrivateKey,
          );

          if (result.success) {
            const successor = await notaryQueries.getNextNotary(
              notary.wallet_address,
            );

            if (successor) {
              await emailService.sendDeactivationEmail(
                notary.email,
                notary.name,
                daysInactive,
                successor.name,
                successor.email,
              );
              await emailService.sendKeyTransferEmail(
                successor.email,
                successor.name,
                notary.name,
              );
              await notaryQueries.logActivity(
                notary.wallet_address,
                "DEACTIVATED",
                `Transferred to ${successor.wallet_address}`,
              );
              await notaryQueries.logActivity(
                successor.wallet_address,
                "KEY_RECEIVED",
                `From ${notary.wallet_address}`,
              );
            } else {
              await notaryQueries.logActivity(
                notary.wallet_address,
                "DEACTIVATED",
                "No successor found",
              );
            }

            await notaryQueries.markDeactivated(notary.wallet_address);
          }
        }
      }

      console.log("✅ Notary check completed\n");
    } catch (error) {
      console.error("❌ Monitor check failed:", error);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    cron.schedule("0 9 * * *", async () => {
      await this.checkAllNotaries();
    });

    console.log("✅ Notary monitor scheduled (daily at 9:00 AM)");

    // Run once on startup
    setTimeout(() => this.checkAllNotaries(), 5000);
  }

  // Manual trigger
  async manualCheck() {
    await this.checkAllNotaries();
  }
}

module.exports = NotaryMonitor;

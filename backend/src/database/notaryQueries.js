const db = require("./init");

const notaryQueries = {
  // Register a notary (add to database)
  register: (walletAddress, email, name) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO notaries (wallet_address, email, name, registered_at) 
         VALUES (?, ?, ?, strftime('%s', 'now'))`,
        [walletAddress, email, name],
        (err) => (err ? reject(err) : resolve()),
      );
    });
  },

  // Get all active notaries
  getAllActive: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM notaries WHERE deactivated = 0`,
        [],
        (err, rows) => {
          err ? reject(err) : resolve(rows);
        },
      );
    });
  },

  // Get a single notary by wallet
  getByWallet: (walletAddress) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM notaries WHERE wallet_address = ?`,
        [walletAddress],
        (err, row) => {
          err ? reject(err) : resolve(row);
        },
      );
    });
  },

  // Update last warning sent time
  updateWarningSent: (walletAddress) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE notaries SET last_warning_sent = strftime('%s', 'now') WHERE wallet_address = ?`,
        [walletAddress],
        (err) => (err ? reject(err) : resolve()),
      );
    });
  },

  // Mark notary as deactivated
  markDeactivated: (walletAddress) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE notaries SET deactivated = 1 WHERE wallet_address = ?`,
        [walletAddress],
        (err) => (err ? reject(err) : resolve()),
      );
    });
  },

  // Get next notary for key transfer
  getNextNotary: (excludeWallet) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM notaries WHERE wallet_address != ? AND deactivated = 0 LIMIT 1`,
        [excludeWallet],
        (err, row) => (err ? reject(err) : resolve(row)),
      );
    });
  },

  // Log activity
  logActivity: (walletAddress, action, details = "") => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO activity_log (wallet_address, action, details, created_at) 
         VALUES (?, ?, ?, strftime('%s', 'now'))`,
        [walletAddress, action, details],
        (err) => (err ? reject(err) : resolve()),
      );
    });
  },

  // Get activity logs for a notary
  getLogs: (walletAddress, limit = 50) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM activity_log WHERE wallet_address = ? ORDER BY created_at DESC LIMIT ?`,
        [walletAddress, limit],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      );
    });
  },
};

module.exports = notaryQueries;

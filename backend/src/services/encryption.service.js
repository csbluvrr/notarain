const crypto = require("crypto");

function encryptBuffer(buffer, password) {
  const key = crypto.scryptSync(password, "notarain-salt", 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Output format: [IV (16 bytes)] [authTag (16 bytes)] [encryptedData]
  return Buffer.concat([iv, authTag, encryptedData]);
}

function decryptBuffer(encryptedBuffer, password) {
  const key = crypto.scryptSync(password, "notarain-salt", 32);

  const iv = encryptedBuffer.subarray(0, 16);
  const authTag = encryptedBuffer.subarray(16, 32);
  const encryptedData = encryptedBuffer.subarray(32);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

module.exports = { encryptBuffer, decryptBuffer };


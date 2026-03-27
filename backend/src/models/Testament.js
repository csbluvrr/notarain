const mongoose = require("mongoose");

const TestamentSchema = new mongoose.Schema({
  testatorWallet: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  ipfsCid: {
    type: String
  },
  documentHash: {
    type: String
  },
  blockchainId: {
    type: Number
  },
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected", "executed"],
    default: "draft"
  },
  notaryWallet: {
    type: String
  },
  originalFileName: {
    type: String
  },
  heirs: {
    type: [
      {
        walletAddress: { type: String, lowercase: true, trim: true },
        name: { type: String, trim: true },
        share: { type: String, trim: true }
      }
    ],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Testament", TestamentSchema);


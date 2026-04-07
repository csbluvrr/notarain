const users = new Map();

const User = {
  async findOne({ walletAddress }) {
    const user = users.get(walletAddress.toLowerCase());
    return user || null;
  },
  async create({ walletAddress, role }) {
    const user = {
      walletAddress: walletAddress.toLowerCase(),
      role: role || "testator",
      nonce: null,
      save: async function() {
        users.set(this.walletAddress, this);
      }
    };
    users.set(user.walletAddress, user);
    return user;
  }
};

module.exports = User;
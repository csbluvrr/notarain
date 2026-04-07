const testaments = new Map();
let nextId = 1;

const Testament = {
  async create(data) {
    const id = String(nextId++);
    const doc = { ...data, _id: id };
    testaments.set(id, doc);
    return doc;
  },
  async findById(id) {
    return testaments.get(String(id)) || null;
  },
  async find({ testatorWallet }) {
    return [...testaments.values()]
      .filter(t => t.testatorWallet === testatorWallet)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

module.exports = Testament;
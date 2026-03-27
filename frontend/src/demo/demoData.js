export const demoUsers = {
  testator: {
    walletAddress: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    displayWallet: "0x4959...8b51",
    name: "Mouna Jaimi",
    role: "testator"
  },
  notary: {
    walletAddress: "0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19",
    displayWallet: "0x7f3a...2c19",
    name: "Pr. Chadli Saad",
    role: "notary"
  },
  heir: {
    walletAddress: "0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047",
    displayWallet: "0x2b8e...a047",
    name: "Sara Gorfti",
    role: "heir"
  }
};

export const demoTestaments = [
  {
    _id: "demo-001",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    originalFileName: "testament_mouna_jaimi_2026.pdf",
    status: "executed",
    ipfsCid: "QmX7kL9mN2pR4sT6uV8wY1zA3bC5dE7fG9hJ0kL2mN4pQ6r",
    documentHash: "0xa3f8c2d1e4b5697c8d9e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
    blockchainId: 7,
    createdAt: "2026-02-15T10:30:00Z",
    updatedAt: "2026-03-20T14:45:00Z",
    notaryWallet: "0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19",
    heirs: [
      {
        walletAddress: "0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047",
        name: "Sara Gorfti",
        share: "100% of estate"
      }
    ]
  },
  {
    _id: "demo-002",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    originalFileName: "testament_supplementaire_2026.pdf",
    status: "approved",
    ipfsCid: "QmY8mN3pQ5rS7tU9vW2xZ4aC6bD8eF0gH2iJ4kL6mN8pR0s",
    documentHash: "0xb4g9d3e2f5c6798d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
    blockchainId: 12,
    createdAt: "2026-03-01T09:15:00Z",
    updatedAt: "2026-03-25T11:20:00Z",
    notaryWallet: "0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19",
    heirs: [
      {
        walletAddress: "0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047",
        name: "Sara Gorfti",
        share: "60% of liquid assets"
      },
      {
        walletAddress: "0x9c1a3e5f7b2d4g6h8i0j2k4l6m8n0p2q4r6s8t0u2",
        name: "Nisrine Gorfti",
        share: "40% of liquid assets"
      }
    ]
  },
  {
    _id: "demo-003",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    originalFileName: "codicille_mars_2026.pdf",
    status: "pending",
    ipfsCid: "QmZ9nO4qR6sT8uV0wX3yA5bC7dE9fG1hI3jK5lM7nO9qS1u",
    documentHash: "0xc5h0e4f3g6d7809e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    blockchainId: null,
    createdAt: "2026-03-26T16:00:00Z",
    updatedAt: "2026-03-26T16:00:00Z",
    notaryWallet: null,
    heirs: []
  }
];

export const demoPendingTestaments = [
  {
    _id: "demo-003",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    testatorName: "Mouna Jaimi",
    originalFileName: "codicille_mars_2026.pdf",
    status: "pending",
    ipfsCid: "QmZ9nO4qR6sT8uV0wX3yA5bC7dE9fG1hI3jK5lM7nO9qS1u",
    documentHash: "0xc5h0e4f3g6d7809e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    blockchainId: null,
    createdAt: "2026-03-26T16:00:00Z",
    heirs: []
  },
  {
    _id: "demo-004",
    testatorWallet: "0x3c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4",
    testatorName: "Zaynab Ahbibi",
    originalFileName: "testament_zaynab_ahbibi.pdf",
    status: "pending",
    ipfsCid: "QmA0oP5rS7tV9wX1yZ3bD5eF7gH9iJ1kL3mN5oP7rS9tV1w",
    documentHash: "0xd6i1f5g4h7e8910f2g5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    blockchainId: null,
    createdAt: "2026-03-25T08:30:00Z",
    heirs: []
  }
];

export const demoAllNotaryTestaments = [
  ...demoPendingTestaments,
  {
    _id: "demo-001",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    testatorName: "Mouna Jaimi",
    originalFileName: "testament_mouna_jaimi_2026.pdf",
    status: "executed",
    ipfsCid: "QmX7kL9mN2pR4sT6uV8wY1zA3bC5dE7fG9hJ0kL2mN4pQ6r",
    documentHash: "0xa3f8c2d1e4b5697c8d9e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
    blockchainId: 7,
    createdAt: "2026-02-15T10:30:00Z",
    heirs: []
  },
  {
    _id: "demo-002",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    testatorName: "Mouna Jaimi",
    originalFileName: "testament_supplementaire_2026.pdf",
    status: "approved",
    ipfsCid: "QmY8mN3pQ5rS7tU9vW2xZ4aC6bD8eF0gH2iJ4kL6mN8pR0s",
    documentHash: "0xb4g9d3e2f5c6798d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
    blockchainId: 12,
    createdAt: "2026-03-01T09:15:00Z",
    heirs: []
  }
];

export const demoHeirTestaments = [
  {
    _id: "demo-001",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    testatorName: "Mouna Jaimi",
    originalFileName: "testament_mouna_jaimi_2026.pdf",
    status: "executed",
    ipfsCid: "QmX7kL9mN2pR4sT6uV8wY1zA3bC5dE7fG9hJ0kL2mN4pQ6r",
    documentHash: "0xa3f8c2d1e4b5697c8d9e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
    blockchainId: 7,
    createdAt: "2026-02-15T10:30:00Z",
    myShare: "100% of estate",
    heirs: [
      {
        walletAddress: "0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047",
        name: "Sara Gorfti",
        share: "100% of estate"
      }
    ]
  },
  {
    _id: "demo-002",
    testatorWallet: "0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51",
    testatorName: "Mouna Jaimi",
    originalFileName: "testament_supplementaire_2026.pdf",
    status: "approved",
    ipfsCid: "QmY8mN3pQ5rS7tU9vW2xZ4aC6bD8eF0gH2iJ4kL6mN8pR0s",
    documentHash: "0xb4g9d3e2f5c6798d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
    blockchainId: 12,
    createdAt: "2026-03-01T09:15:00Z",
    myShare: "60% of liquid assets",
    heirs: [
      {
        walletAddress: "0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047",
        name: "Sara Gorfti",
        share: "60% of liquid assets"
      }
    ]
  }
];


export const demoUsers = {
  testator: {
    walletAddress: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    displayWallet: '0x4959...8b51',
    name: 'Mouna Jaimi',
    role: 'testator',
    createdAt: '2026-01-10T08:00:00Z'
  },
  notary: {
    walletAddress: '0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19',
    displayWallet: '0x7f3a...2c19',
    name: 'Pr. Chadli Saad',
    role: 'notary',
    createdAt: '2025-09-01T08:00:00Z'
  },
  heir: {
    walletAddress: '0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047',
    displayWallet: '0x2b8e...a047',
    name: 'Sara Gorfti',
    role: 'heir',
    createdAt: '2026-01-15T08:00:00Z'
  }
}

export const initialTestatorTestaments = [
  {
    _id: 'demo-001',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'testament_principal_mouna_2026.pdf',
    status: 'executed',
    ipfsCid: 'QmX7kL9mN2pR4sT6uV8wY1zA3bC5dE7fG9hJ0kL2mN4pQ6r',
    documentHash: '0xa3f8c2d1e4b5697c8d9e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
    blockchainId: 7,
    txHash: '0x9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    rejectionReason: null,
    createdAt: '2026-01-20T10:30:00Z',
    updatedAt: '2026-03-20T14:45:00Z',
    notaryWallet: '0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19',
    heirs: [
      { walletAddress: '0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047', name: 'Sara Gorfti', share: '100% of estate' }
    ],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-01-20T10:30:00Z', actor: '0x4959...8b51', note: 'Document envoyé et chiffré' },
      { status: 'pending', label: 'Soumis au notaire', date: '2026-01-21T09:00:00Z', actor: '0x4959...8b51', note: 'Envoyé dans la file d’attente du notaire' },
      { status: 'approved', label: 'Validé par le notaire', date: '2026-02-01T11:30:00Z', actor: '0x7f3a...2c19', note: 'Document vérifié et validé' },
      { status: 'approved', label: 'Enregistré sur la blockchain', date: '2026-02-01T12:00:00Z', actor: '0x4959...8b51', note: 'Transaction #7 confirmée sur Sepolia' },
      { status: 'executed', label: 'Exécuté par le notaire', date: '2026-03-20T14:45:00Z', actor: '0x7f3a...2c19', note: 'Décès confirmé — accès accordé aux héritiers' }
    ]
  },
  {
    _id: 'demo-002',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'testament_biens_immobiliers_2026.pdf',
    status: 'approved',
    ipfsCid: 'QmY8mN3pQ5rS7tU9vW2xZ4aC6bD8eF0gH2iJ4kL6mN8pR0s',
    documentHash: '0xb4g9d3e2f5c6798d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    blockchainId: 12,
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    rejectionReason: null,
    createdAt: '2026-02-10T09:15:00Z',
    updatedAt: '2026-03-10T11:20:00Z',
    notaryWallet: '0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19',
    heirs: [
      { walletAddress: '0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047', name: 'Sara Gorfti', share: 'Apartment — 12 Rue Hassan II, Marrakech' },
      { walletAddress: '0x9c1a3e5f7b2d4c6d8e0f2a4b6c8d0e2f4a6b8c0d2', name: 'Nisrine Gorfti', share: 'Villa — Route de Fès, Marrakech' }
    ],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-02-10T09:15:00Z', actor: '0x4959...8b51', note: 'Document envoyé et chiffré' },
      { status: 'pending', label: 'Soumis au notaire', date: '2026-02-11T10:00:00Z', actor: '0x4959...8b51', note: 'Envoyé dans la file d’attente du notaire' },
      { status: 'rejected', label: 'Rejeté par le notaire', date: '2026-02-15T14:00:00Z', actor: '0x7f3a...2c19', note: 'Signatures de témoins manquantes à la page 3' },
      { status: 'pending', label: 'Resoumis au notaire', date: '2026-02-20T09:30:00Z', actor: '0x4959...8b51', note: 'Document corrigé et resoumis' },
      { status: 'approved', label: 'Validé par le notaire', date: '2026-03-01T11:00:00Z', actor: '0x7f3a...2c19', note: 'Toutes les exigences sont satisfaites' },
      { status: 'approved', label: 'Enregistré sur la blockchain', date: '2026-03-01T11:30:00Z', actor: '0x4959...8b51', note: 'Transaction #12 confirmée sur Sepolia' }
    ]
  },
  {
    _id: 'demo-003',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'codicille_addendum_mars_2026.pdf',
    status: 'pending',
    ipfsCid: 'QmZ9nO4qR6sT8uV0wX3yA5bC7dE9fG1hI3jK5lM7nO9qS1u',
    documentHash: '0xc5h0e4f3g6d7809e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    blockchainId: null,
    txHash: null,
    rejectionReason: null,
    createdAt: '2026-03-26T16:00:00Z',
    updatedAt: '2026-03-26T16:30:00Z',
    notaryWallet: null,
    heirs: [],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-03-26T16:00:00Z', actor: '0x4959...8b51', note: 'Document envoyé et chiffré' },
      { status: 'pending', label: 'Soumis au notaire', date: '2026-03-26T16:30:00Z', actor: '0x4959...8b51', note: 'En attente d’affectation du notaire' }
    ]
  },
  {
    _id: 'demo-004',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'testament_draft_avril_2026.pdf',
    status: 'draft',
    ipfsCid: 'QmW6jM8lK0nP2qR4sT6uV8wX0yZ2bD4eF6gH8iJ0kL2mN4p',
    documentHash: '0xd7j2g5h4i8f9021g3h6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    blockchainId: null,
    txHash: null,
    rejectionReason: null,
    createdAt: '2026-03-27T08:00:00Z',
    updatedAt: '2026-03-27T08:00:00Z',
    notaryWallet: null,
    heirs: [],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-03-27T08:00:00Z', actor: '0x4959...8b51', note: 'Document envoyé et chiffré' }
    ]
  }
]

export const initialPendingTestaments = [
  {
    _id: 'demo-003',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'codicille_addendum_mars_2026.pdf',
    status: 'pending',
    ipfsCid: 'QmZ9nO4qR6sT8uV0wX3yA5bC7dE9fG1hI3jK5lM7nO9qS1u',
    documentHash: '0xc5h0e4f3g6d7809e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    blockchainId: null,
    txHash: null,
    createdAt: '2026-03-26T16:30:00Z',
    heirs: []
  },
  {
    _id: 'demo-005',
    testatorWallet: '0x3c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4',
    originalFileName: 'testament_zaynab_ahbibi_2026.pdf',
    status: 'pending',
    ipfsCid: 'QmA0oP5rS7tV9wX1yZ3bD5eF7gH9iJ1kL3mN5oP7rS9tV1w',
    documentHash: '0xe8k3h6i5j9g0132h4i7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    blockchainId: null,
    txHash: null,
    createdAt: '2026-03-25T08:30:00Z',
    heirs: []
  }
]

export const initialAllNotaryTestaments = [
  {
    _id: 'demo-003',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'codicille_addendum_mars_2026.pdf',
    status: 'pending',
    ipfsCid: 'QmZ9nO4qR6sT8uV0wX3yA5bC7dE9fG1hI3jK5lM7nO9qS1u',
    documentHash: '0xc5h0e4f3g6d7809e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    blockchainId: null,
    txHash: null,
    createdAt: '2026-03-26T16:30:00Z',
    heirs: [],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-03-26T16:00:00Z', actor: '0x4959...8b51', note: 'Document envoyé et chiffré' },
      { status: 'pending', label: 'Soumis au notaire', date: '2026-03-26T16:30:00Z', actor: '0x4959...8b51', note: 'En attente d’affectation du notaire' }
    ]
  },
  {
    _id: 'demo-005',
    testatorWallet: '0x3c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4',
    originalFileName: 'testament_zaynab_ahbibi_2026.pdf',
    status: 'pending',
    ipfsCid: 'QmA0oP5rS7tV9wX1yZ3bD5eF7gH9iJ1kL3mN5oP7rS9tV1w',
    documentHash: '0xe8k3h6i5j9g0132h4i7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    blockchainId: null,
    txHash: null,
    createdAt: '2026-03-25T08:30:00Z',
    heirs: [],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-03-25T08:00:00Z', actor: '0x3c7d...c2d4', note: 'Document envoyé et chiffré' },
      { status: 'pending', label: 'Soumis au notaire', date: '2026-03-25T08:30:00Z', actor: '0x3c7d...c2d4', note: 'En attente d’affectation du notaire' }
    ]
  },
  {
    _id: 'demo-001',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'testament_principal_mouna_2026.pdf',
    status: 'executed',
    ipfsCid: 'QmX7kL9mN2pR4sT6uV8wY1zA3bC5dE7fG9hJ0kL2mN4pQ6r',
    documentHash: '0xa3f8c2d1e4b5697c8d9e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
    blockchainId: 7,
    txHash: '0x9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    createdAt: '2026-01-20T10:30:00Z',
    heirs: [{ walletAddress: '0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047', name: 'Sara Gorfti', share: '100% of estate' }],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-01-20T10:30:00Z', actor: '0x4959...8b51', note: 'Document envoyé et chiffré' },
      { status: 'pending', label: 'Soumis au notaire', date: '2026-01-21T09:00:00Z', actor: '0x4959...8b51', note: 'Envoyé dans la file d’attente du notaire' },
      { status: 'approved', label: 'Validé par le notaire', date: '2026-02-01T11:30:00Z', actor: '0x7f3a...2c19', note: 'Document vérifié et validé' },
      { status: 'approved', label: 'Enregistré sur la blockchain', date: '2026-02-01T12:00:00Z', actor: '0x4959...8b51', note: 'Transaction #7 confirmée sur Sepolia' },
      { status: 'executed', label: 'Exécuté par le notaire', date: '2026-03-20T14:45:00Z', actor: '0x7f3a...2c19', note: 'Décès confirmé — accès accordé aux héritiers' }
    ]
  },
  {
    _id: 'demo-002',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'testament_biens_immobiliers_2026.pdf',
    status: 'approved',
    ipfsCid: 'QmY8mN3pQ5rS7tU9vW2xZ4aC6bD8eF0gH2iJ4kL6mN8pR0s',
    documentHash: '0xb4g9d3e2f5c6798d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    blockchainId: 12,
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    createdAt: '2026-02-10T09:15:00Z',
    heirs: [
      { walletAddress: '0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047', name: 'Sara Gorfti', share: 'Apartment — 12 Rue Hassan II, Marrakech' },
      { walletAddress: '0x9c1a3e5f7b2d4c6d8e0f2a4b6c8d0e2f4a6b8c0d2', name: 'Nisrine Gorfti', share: 'Villa — Route de Fès, Marrakech' }
    ],
    timeline: [
      { status: 'draft', label: 'Testament créé', date: '2026-02-10T09:15:00Z', actor: '0x4959...8b51', note: 'Document envoyé et chiffré' },
      { status: 'pending', label: 'Soumis au notaire', date: '2026-02-11T10:00:00Z', actor: '0x4959...8b51', note: 'Envoyé dans la file d’attente du notaire' },
      { status: 'rejected', label: 'Rejeté par le notaire', date: '2026-02-15T14:00:00Z', actor: '0x7f3a...2c19', note: 'Signatures de témoins manquantes à la page 3' },
      { status: 'pending', label: 'Resoumis au notaire', date: '2026-02-20T09:30:00Z', actor: '0x4959...8b51', note: 'Document corrigé et resoumis' },
      { status: 'approved', label: 'Validé par le notaire', date: '2026-03-01T11:00:00Z', actor: '0x7f3a...2c19', note: 'Toutes les exigences sont satisfaites' },
      { status: 'approved', label: 'Enregistré sur la blockchain', date: '2026-03-01T11:30:00Z', actor: '0x4959...8b51', note: 'Transaction #12 confirmée sur Sepolia' }
    ]
  }
]

export const initialHeirTestaments = [
  {
    _id: 'demo-001',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'testament_principal_mouna_2026.pdf',
    status: 'executed',
    ipfsCid: 'QmX7kL9mN2pR4sT6uV8wY1zA3bC5dE7fG9hJ0kL2mN4pQ6r',
    documentHash: '0xa3f8c2d1e4b5697c8d9e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
    blockchainId: 7,
    txHash: '0x9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    createdAt: '2026-01-20T10:30:00Z',
    notaryWallet: '0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19',
    myShare: '100% de la succession',
    heirs: [{ walletAddress: '0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047', name: 'Sara Gorfti', share: '100% of estate' }],
    timeline: [
      { status: 'approved', label: 'Validé par le notaire', date: '2026-02-01T11:30:00Z', actor: '0x7f3a...2c19', note: 'Document vérifié et validé' },
      { status: 'approved', label: 'Enregistré sur la blockchain', date: '2026-02-01T12:00:00Z', actor: '0x4959...8b51', note: 'Transaction #7 confirmée sur Sepolia' },
      { status: 'executed', label: 'Exécuté par le notaire', date: '2026-03-20T14:45:00Z', actor: '0x7f3a...2c19', note: 'Décès confirmé — accès accordé aux héritiers' }
    ]
  },
  {
    _id: 'demo-002',
    testatorWallet: '0x4959b982b64e23cfbb9bdc59134e5f98c19e8b51',
    originalFileName: 'testament_biens_immobiliers_2026.pdf',
    status: 'approved',
    ipfsCid: 'QmY8mN3pQ5rS7tU9vW2xZ4aC6bD8eF0gH2iJ4kL6mN8pR0s',
    documentHash: '0xb4g9d3e2f5c6798d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    blockchainId: 12,
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    createdAt: '2026-02-10T09:15:00Z',
    notaryWallet: '0x7f3a9c2d1e4b5f6a8c9d2e3f4a5b6c7d8e9f2c19',
    myShare: 'Appartement — 12 Rue Hassan II, Marrakech',
    heirs: [
      { walletAddress: '0x2b8e4f1c9d3a7e6b5f4c3d2e1a9b8c7d6e5f4a047', name: 'Sara Gorfti', share: 'Apartment — 12 Rue Hassan II, Marrakech' },
      { walletAddress: '0x9c1a3e5f7b2d4c6d8e0f2a4b6c8d0e2f4a6b8c0d2', name: 'Nisrine Gorfti', share: 'Villa — Route de Fès, Marrakech' }
    ],
    timeline: [
      { status: 'approved', label: 'Validé par le notaire', date: '2026-03-01T11:00:00Z', actor: '0x7f3a...2c19', note: 'Toutes les exigences sont satisfaites' },
      { status: 'approved', label: 'Enregistré sur la blockchain', date: '2026-03-01T11:30:00Z', actor: '0x4959...8b51', note: 'Transaction #12 confirmée sur Sepolia' }
    ]
  }
]


# Notarain: Decentralized Notarized Testament System - Complete Architecture Explanation

## 🎯 **Project Overview**
Notarain is a **full-stack decentralized application (dApp)** for secure, blockchain-based management of last wills/testaments. Users (Testators) upload encrypted documents, designate heirs, submit to Notaries for approval, and execute upon confirmation of death—all immutably recorded on Ethereum Sepolia testnet.

**Key Features:**
- File encryption (AES-256-GCM)
- Decentralized storage (IPFS via Pinata)
- Blockchain registry (Solidity smart contract)
- Role-based access: Testator (will creator), Notary (validator), Heir (beneficiary)
- Wallet-based authentication (MetaMask SIWE-like)
- Responsive React frontend with demo mode

**Tech Stack:**
| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, ethers.js v6, React Router, Lucide icons, react-hot-toast |
| **Backend** | Node.js/Express, MongoDB/Mongoose, Multer (file upload), JWT, ethers.js |
| **Blockchain** | Solidity ^0.8.20, Hardhat, Sepolia testnet |
| **Storage** | IPFS (Pinata SDK) |
| **Security** | AES-256-GCM encryption, wallet signature auth, role middleware |

**Root Directory:** `c:/Users/jaimi_ejvhy1i/Documents/skl/year 4/sem2/crypto/notarain/code/notarain/`

## 📁 **Project Structure & File Locations**

```
notarain/
├── README.md                 # Basic project description
├── package.json              # Root deps (none critical)
├── .git*                    # Git config
├── backend/                  # Node/Express API server
│   ├── package.json         # express, mongoose, ethers, @pinata/sdk, multer, ...
│   ├── src/
│   │   ├── app.js           # Main Express app, CORS (localhost:5173), routes
│   │   ├── config/db.js     # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js      # {walletAddress, role(testator/notary/admin), nonce}
│   │   │   └── Testament.js # {testatorWallet, ipfsCid, blockchainId, status(draft→executed), heirs[], notaryWallet}
│   │   ├── controllers/     # auth.controller.js, testament.controller.js, notary.controller.js, heir.controller.js
│   │   ├── middleware/      # auth.js (JWT verify), roles.js
│   │   ├── routes/          # auth.routes.js (/register, /nonce, /verify), testament.routes.js (/upload, /submit/:id), etc.
│   │   └── services/
│   │       ├── blockchain.service.js # ethers calls to TestamentRegistry (getTestament, getTestatorTestaments)
│   │       ├── encryption.service.js # AES-256-GCM encrypt/decrypt (password-derived key)
│   │       └── ipfs.service.js       # Pinata IPFS upload/getFile
├── blockchain/               # Hardhat Ethereum project
│   ├── package.json         # Hardhat toolbox
│   ├── hardhat.config.js    # Solidity 0.8.20, Sepolia/localhost networks (uses .env RPC/KEY)
│   ├── contracts/
│   │   └── TestamentRegistry.sol  # **Core SC** (see below)
│   ├── scripts/deploy.js    # Deployment script
│   └── test/
│       └── TestamentRegistry.test.js # Full test suite (register/approve/reject/confirmDeath)
└── frontend/                 # React app
    ├── package.json         # vite, react, tailwind, ethers, axios
    ├── vite.config.js       # React plugin
    ├── tailwind.config.js
    ├── src/
    │   ├── main.jsx         # Entry: <App /> wrapped in DemoProvider
    │   ├── App.jsx          # Router setup
    │   ├── index.css        # Tailwind
    │   ├── contexts/AuthContext.jsx # Wallet connect, role checks (isTestator/isNotary/isHeir), SIWE-like auth
    │   ├── demo/            # Demo mode data/context (demoData.js, DemoContext.jsx)
    │   ├── hooks/           # useAuth.js, useContract.js (loads TestamentRegistry.json ABI)
    │   ├── pages/           # Role dashboards:
    │   │   ├── DashboardTestateur.jsx, DashboardNotaire.jsx, DashboardBeneficiaire.jsx (Heir), UploadTestament.jsx, etc.
    │   ├── components/      # Navbar, Modals (ManageHeirs, TestamentDetail), ConnectWallet, StatusBadge
    │   └── services/api.js   # Axios to backend
```

## 🔗 **How It Works: End-to-End Workflow**

### 1. **User Authentication (Wallet-Signature)**
   - **Frontend:** `AuthContext.jsx` → Connect MetaMask → `api.post('/api/auth/nonce')` → Sign message → `'/api/auth/verify'` → JWT token stored.
   - **Backend:** `auth.controller.js` → Create/find User by walletAddress (roles: testator/notary/admin), generate nonce, verify sig → JWT.
   - **Middleware:** `auth.js` (Bearer JWT verify), `roles.js` (requireRole).

### 2. **Testator Creates Testament**
   - **Frontend:** `UploadTestament.jsx` → File upload → Password → Encrypt → Backend.
   - **Backend:** `testament.controller.js/uploadTestament` (Multer):
     1. `encryption.service.encryptBuffer(file.buffer, password)` → AES-256-GCM.
     2. `ipfs.uploadEncryptedFile(buffer, filename)` → Pinata IPFS → CID.
     3. Save draft Testament doc in MongoDB (`Testament.js` model).
   - Manage heirs: `ManageHeirsModal.jsx` → Update heirs[].

### 3. **Submit to Notary & Blockchain Registration**
   - **Frontend:** DashboardTestateur → Submit → `contract.registerTestament(ipfsCid, documentHash)` (ethers.js via `useContract`).
   - **Smart Contract** `TestamentRegistry.sol`:
     ```solidity
     // Key Functions:
     registerTestament(ipfsCid, documentHash) → Creates Testament (Pending), emits TestamentRegistered(id)
     getTestatorTestaments(testator) → Returns array of IDs
     // Modifiers: onlyAdmin, onlyNotary, testamentExists
     ```
     - Admin authorizes notaries: `authorizeNotary(notaryAddr)`.
     - Deployed via `scripts/deploy.js` on Sepolia (address/ABI in JSON).
   - Backend updates Mongo: blockchainId = id, status=pending.

### 4. **Notary Review & Actions**
   - **Frontend:** `DashboardNotaire.jsx` → List pending → Approve/Reject/ConfirmDeath → Contract calls.
   - **Contract:** 
     - `approveTestament(id)` (onlyNotary, Pending→Approved).
     - `rejectTestament(id)` (Pending→Rejected).
     - `confirmDeath(id)` (Approved→Executed).
   - Events listened? (Likely via frontend hooks/services).
   - Backend: `notary.controller.js` syncs Mongo status/notaryWallet.

### 5. **Heir Access**
   - **Frontend:** `DashboardBeneficiaire.jsx` (Heir) → View assigned testaments (filtered by heirs[] match).
   - Post-execution: Decrypt via password (shared OOB?) + IPFS fetch.

### 6. **Demo Mode**
   - `DemoContext.jsx`/`demoData.js`: Simulated data/txs for testing without real blockchain.

## 🚀 **Running the Project**
```
# Backend (port 3001)
cd notarain/backend && npm i && npm run dev

# Blockchain deploy/test
cd notarain/blockchain && npm i && npx hardhat run scripts/deploy.js --network sepolia

# Frontend (port 5173)
cd notarain/frontend && npm i && npm run dev
```
**Env Vars:** `.env` with Mongo URI, Sepolia RPC/KEY, Pinata keys, JWT secret.

## 📝 **Data Flow Summary**
```
Testator Upload → Encrypt (AES) → IPFS (Pinata CID) → Mongo Draft
↓ Submit
Blockchain registerTestament(CID, Hash) → Pending ID → Mongo Update
↓ Notary Dashboard
approveTestament(ID) → Approved → Mongo Sync
↓ Confirm Death
confirmDeath(ID) → Executed → Heirs Access (Decrypt IPFS)
```

This architecture ensures **immutability** (Ethereum), **privacy** (encryption/IPFS), **auditability** (events/Mongo timeline), and **decentralization**. Perfect for crypto/notary coursework demo!

To present: Open `notarain/blockchain/contracts/TestamentRegistry.sol` (currently visible), explain contract → Trace to frontend dashboards.


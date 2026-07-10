# Technical Design — BhoomiChain

**Version:** 1.0 · Companion to [PRD.md](PRD.md) · Build plan in [PHASE_WISE_PLAN.md](PHASE_WISE_PLAN.md)

---

## 1. Architecture overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS (browser / phone)                     │
│   Citizen Portal   │   Registrar Dashboard   │   Public Verify (no login)  │
└───────────────┬──────────────────┬───────────────────────┬────────────────┘
                │                  │                        │
                │ ethers.js (MetaMask signatures)           │ read-only chain reads
                ▼                  ▼                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 (App Router)                             │
│  UI (React + Tailwind + shadcn/ui + Leaflet)                               │
│  API routes:  /api/parcels  /api/transfers  /api/ai/verify-doc            │
│               /api/fraud  /api/certificate  /api/upload                    │
└───────┬───────────────────────┬──────────────────────┬────────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────────┐    ┌──────────────────────────┐
│  HARDHAT NODE │     │  SUPABASE          │    │  CLAUDE VISION API        │
│  (local EVM)  │     │  Postgres + Storage│    │  forgery forensic report  │
│  LandRegistry │     │  + Realtime        │    │                           │
│  .sol (ERC721 │     │  parcels_meta,     │    └──────────────────────────┘
│  +AccessCtrl) │     │  documents, users, │
│               │     │  fraud_alerts,     │
│  EVENTS ──────┼────▶│  audit_log         │  (chain indexer writes events here)
└───────────────┘     └───────────────────┘
```

**Two-layer truth model (key design principle):**
- **On-chain (source of truth):** ownership, transfer approvals, document *hashes*, events. Small, immutable, verifiable.
- **Off-chain (index + files):** documents, metadata, search, AI reports, realtime alerts. Fast, rich, disposable.

The chain never trusts the DB; the DB is a convenience mirror. Anyone can rebuild the DB from chain events → this is what makes it *tamper-evident*.

---

## 2. Tech stack & rationale

| Layer | Choice | Why (hackathon lens) |
|-------|--------|----------------------|
| Smart contracts | Solidity ^0.8.24, Hardhat, OpenZeppelin | Batteries-included, audited primitives, fast local iteration |
| Permissioning | OpenZeppelin `AccessControl` | Enforces "only registrars finalize" — permissioned semantics without Fabric's setup cost |
| Token model | ERC-721 (transfer-locked) | Each parcel = 1 NFT; elegant, provable single-owner, blocks rogue transfers |
| Chain client | ethers.js v6 | Mature, well-documented, MetaMask-friendly |
| Frontend | Next.js 14 App Router + React + Tailwind + shadcn/ui | One codebase for all 3 apps; ships polished UI fast |
| Maps | Leaflet + OpenStreetMap | Free, no API key, great for district fraud map |
| DB / storage / realtime | Supabase (Postgres + Storage + Realtime) | DB + file storage + live alerts in one; Realtime powers the fraud war-room |
| ORM | Prisma | Type-safe, fast schema iteration |
| AI | Claude vision (`claude-opus-4-8` or `claude-sonnet-5`) | Best-in-class vision reasoning for forensic doc analysis |
| Hashing | Node `crypto` SHA-256 | Cryptographic tamper proof, trivial to implement |
| Hosting | Vercel (web) + Supabase (data) + local Hardhat (chain) | Demo runs locally; deploy web for the "scan this QR live" link |

> **Honesty note for judges:** we say *"permissioned semantics via on-chain role-based access control, with a clear migration path to Hyperledger Fabric for a production consortium of state registrars."* This is defensible and mature — do not overclaim a Fabric network you didn't build.

---

## 3. Smart contract design

### 3.1 `LandRegistry.sol`

Inherits `ERC721`, `AccessControl`. Core structures:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LandRegistry is ERC721, AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    enum ParcelStatus { Active, InTransfer }
    enum TransferStatus { None, PendingBuyer, PendingRegistrar, Completed, Rejected }

    struct Parcel {
        uint256 id;
        string  surveyNumber;
        string  district;
        string  geo;            // "lat,lng" or geohash
        uint256 area;           // sq. ft or sq. m
        bytes32 documentHash;   // SHA-256 of current title doc
        uint256 registeredAt;
        ParcelStatus status;
    }

    struct TransferRequest {
        uint256 parcelId;
        address seller;
        address buyer;
        bytes32 newDocumentHash;
        bool    sellerApproved;   // implicit-true on initiate
        bool    buyerApproved;
        bool    registrarApproved;
        TransferStatus status;
        uint256 createdAt;
    }

    uint256 public nextParcelId = 1;
    uint256 public nextTransferId = 1;
    mapping(uint256 => Parcel) public parcels;
    mapping(uint256 => TransferRequest) public transfers;
    mapping(uint256 => uint256) public activeTransferOf; // parcelId => transferId (0 if none)

    event ParcelRegistered(uint256 indexed parcelId, address indexed owner, string surveyNumber, bytes32 documentHash);
    event TransferInitiated(uint256 indexed transferId, uint256 indexed parcelId, address seller, address buyer);
    event TransferApproved(uint256 indexed transferId, address indexed by, string role);
    event TransferCompleted(uint256 indexed transferId, uint256 indexed parcelId, address indexed newOwner);
    event TransferRejected(uint256 indexed transferId, address indexed by, string reason);

    constructor() ERC721("BhoomiChain Land Title", "BHOOMI") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);   // govt admin
        _grantRole(REGISTRAR_ROLE, msg.sender);       // deployer is first registrar (demo convenience)
    }

    // --- Registration (registrar only) ---
    function registerParcel(
        address owner, string calldata surveyNumber, string calldata district,
        string calldata geo, uint256 area, bytes32 documentHash
    ) external onlyRole(REGISTRAR_ROLE) returns (uint256 id) {
        id = nextParcelId++;
        parcels[id] = Parcel(id, surveyNumber, district, geo, area, documentHash, block.timestamp, ParcelStatus.Active);
        _safeMint(owner, id);
        emit ParcelRegistered(id, owner, surveyNumber, documentHash);
    }

    // --- Transfer workflow ---
    function initiateTransfer(uint256 parcelId, address buyer, bytes32 newDocumentHash) external returns (uint256 tid) {
        require(ownerOf(parcelId) == msg.sender, "Not owner");
        require(parcels[parcelId].status == ParcelStatus.Active, "Parcel busy"); // blocks double-sale
        require(buyer != address(0) && buyer != msg.sender, "Bad buyer");
        tid = nextTransferId++;
        transfers[tid] = TransferRequest(parcelId, msg.sender, buyer, newDocumentHash, true, false, false, TransferStatus.PendingBuyer, block.timestamp);
        parcels[parcelId].status = ParcelStatus.InTransfer;
        activeTransferOf[parcelId] = tid;
        emit TransferInitiated(tid, parcelId, msg.sender, buyer);
        emit TransferApproved(tid, msg.sender, "seller");
    }

    function buyerApprove(uint256 tid) external {
        TransferRequest storage t = transfers[tid];
        require(t.status == TransferStatus.PendingBuyer, "Wrong state");
        require(msg.sender == t.buyer, "Not buyer");
        t.buyerApproved = true;
        t.status = TransferStatus.PendingRegistrar;
        emit TransferApproved(tid, msg.sender, "buyer");
    }

    function registrarFinalize(uint256 tid) external onlyRole(REGISTRAR_ROLE) {
        TransferRequest storage t = transfers[tid];
        require(t.status == TransferStatus.PendingRegistrar, "Wrong state");
        t.registrarApproved = true;
        t.status = TransferStatus.Completed;
        Parcel storage p = parcels[t.parcelId];
        p.status = ParcelStatus.Active;
        p.documentHash = t.newDocumentHash;
        activeTransferOf[t.parcelId] = 0;
        _transfer(t.seller, t.buyer, t.parcelId);   // atomic ownership move
        emit TransferApproved(tid, msg.sender, "registrar");
        emit TransferCompleted(tid, t.parcelId, t.buyer);
    }

    function rejectTransfer(uint256 tid, string calldata reason) external {
        TransferRequest storage t = transfers[tid];
        require(t.status == TransferStatus.PendingBuyer || t.status == TransferStatus.PendingRegistrar, "Cannot reject");
        require(msg.sender == t.buyer || msg.sender == t.seller || hasRole(REGISTRAR_ROLE, msg.sender), "Not a party");
        t.status = TransferStatus.Rejected;
        parcels[t.parcelId].status = ParcelStatus.Active;
        activeTransferOf[t.parcelId] = 0;
        emit TransferRejected(tid, msg.sender, reason);
    }

    // --- Lock rogue transfers: only the workflow (_transfer above) may move tokens ---
    function transferFrom(address, address, uint256) public pure override { revert("Use transfer workflow"); }
    function safeTransferFrom(address, address, uint256) public pure override { revert("Use transfer workflow"); }
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override { revert("Use transfer workflow"); }

    function supportsInterface(bytes4 id) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(id);
    }
}
```

**Design notes**
- **Permissioning:** `onlyRole(REGISTRAR_ROLE)` gates registration + finalization → "only authorized government registrars can write." This *is* the permissioned model, enforced by the EVM.
- **Double-sale prevention:** `ParcelStatus.InTransfer` + `activeTransferOf` make a second concurrent transfer impossible at the contract level — a strong point to highlight.
- **Transfer lock:** overriding `transferFrom`/`safeTransferFrom` to revert means the *only* way ownership moves is through the 3-signature workflow. No side-door.
- **3 signatures = 3 wallet txs:** seller (initiate), buyer (approve), registrar (finalize) — each is a real cryptographic signature. This literally implements "digitally signed by the buyer, seller, and authorized registrar."

### 3.2 Testing (Hardhat + Chai)
Minimum tests to write (also great to show judges "we test"):
- register → correct owner + event
- full happy-path transfer → ownership moves, events fire
- non-registrar cannot register/finalize (reverts)
- second transfer on a busy parcel reverts (double-sale)
- direct `transferFrom` reverts

---

## 4. Off-chain data model (Prisma / Postgres)

```prisma
model User {
  id           String   @id @default(cuid())
  wallet       String   @unique
  name         String
  maskedId     String?  // "XXXX-XXXX-1234" Aadhaar-style, mocked
  role         Role     @default(CITIZEN)
  createdAt    DateTime @default(now())
}
enum Role { CITIZEN REGISTRAR ADMIN }

model ParcelMeta {
  id            Int      @id            // == on-chain parcelId
  surveyNumber  String
  district      String
  addressText   String
  lat           Float
  lng           Float
  area          Int
  currentDocId  String?
  createdAt     DateTime @default(now())
  documents     Document[]
}

model Document {
  id         String   @id @default(cuid())
  parcelId   Int
  parcel     ParcelMeta @relation(fields: [parcelId], references: [id])
  storageUrl String   // Supabase Storage
  sha256     String
  aiReport   Json?    // { riskScore, verdict, reasons[], model }
  uploadedBy String
  createdAt  DateTime @default(now())
}

model TransferMeta {
  id           Int      @id            // == on-chain transferId
  parcelId     Int
  seller       String
  buyer        String
  status       String
  createdAt    DateTime @default(now())
}

model FraudAlert {
  id         String   @id @default(cuid())
  parcelId   Int
  type       String   // DOUBLE_SALE | OWNERSHIP_MISMATCH | RAPID_FLIP | FORGED_DOC
  severity   String   // LOW | MED | HIGH
  detail     String
  resolved   Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  actor     String
  action    String
  target    String
  meta      Json?
  createdAt DateTime @default(now())
}
```

---

## 5. API design (Next.js route handlers)

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/upload` | Upload doc → Supabase Storage, return url + sha256 | wallet |
| POST | `/api/ai/verify-doc` | Run forgery report on an uploaded doc | wallet |
| GET | `/api/parcels` | List/search parcels (from DB, mirrors chain) | public |
| GET | `/api/parcels/[id]` | Parcel detail + history (chain events) | public |
| POST | `/api/parcels` | Register (registrar) — signs + sends tx server or client | registrar |
| GET | `/api/transfers?user=` | Transfers for a user | wallet |
| POST | `/api/transfers/initiate` | Metadata mirror after chain tx | seller |
| GET | `/api/fraud` | Active fraud alerts | registrar |
| POST | `/api/fraud/scan` | Run rules engine for a parcel/transfer | system |
| GET | `/api/certificate/[id]` | Generate Title Certificate PDF | public |

> Chain writes happen **client-side via MetaMask** (real signatures). API routes handle files, AI, indexing, and reads. Keep private keys out of the frontend.

**Chain indexer:** a small listener (`scripts/indexer.js` or an API route polling `queryFilter`) subscribes to contract events and upserts `ParcelMeta`, `TransferMeta`, and triggers `POST /api/fraud/scan`. For demo simplicity, you can also index synchronously right after each tx in the client.

---

## 6. Security & trust model

- **Signatures:** all ownership changes require MetaMask-signed txs → non-repudiable, attributable to a wallet.
- **Role gating:** registrar-only functions enforced on-chain (`AccessControl`) — the server can't fake authority.
- **Integrity:** document SHA-256 anchored on-chain at registration/transfer → any later file edit changes the hash → provable tampering.
- **Least privilege:** frontend holds no secrets; Claude API key + Supabase service key live only in server env (`.env`, never committed).
- **Auditability:** every state transition is an on-chain event → complete, immutable history reconstructable by anyone.
- **Permissioned framing:** public can *read*; only govt roles can *write* — mirroring a real land-registry authority model.

---

## 7. QR public verification flow (WOW #1)

```
Parcel → QR encodes https://<app>/verify/123
Judge scans → /verify/123 (server component, no login)
   ├─ reads current owner: contract.ownerOf(123)
   ├─ reads parcel: contract.parcels(123)
   ├─ reads history: contract.queryFilter(TransferCompleted, parcelId=123)
   ├─ reads doc integrity: compare stored sha256 vs on-chain documentHash
   └─ renders: ✅ Verified Owner · full timeline · integrity badge · "Download Certificate"
```

- Generate QR with `qrcode` npm lib; print a sticker or show on a second screen/phone.
- Page must feel *instant* and *official* (govt seal styling, green verified badge).
- This is the "hand the judge your phone" moment — make it flawless.

---

## 8. AI document forgery detection (WOW #2)

**Two independent signals, combined into one Integrity Report:**

1. **Cryptographic (deterministic, always shown):**
   - Compute SHA-256 of the uploaded file.
   - If the parcel already has an on-chain `documentHash`, compare. Mismatch = **TAMPERED (100% certain)**. Match = **UNCHANGED**.

2. **AI forensic (probabilistic, for new docs):**
   - Send the document image to Claude vision with a forensic prompt (see [PROMPTS.md](PROMPTS.md#ai-forgery-prompt)).
   - Model returns structured JSON: `{ riskScore: 0-100, verdict: "LIKELY_GENUINE|SUSPICIOUS|LIKELY_FORGED", reasons: [...], indicators: {fontConsistency, sealIntegrity, digitalArtifacts, numeralTampering} }`.

**Gate:** `verdict === "LIKELY_FORGED"` or `riskScore >= 70` → block finalize; registrar may override with a logged reason.

**Demo tactic:** prepare TWO versions of a sale deed — one clean, one visibly tampered (altered plot area / pasted seal). Upload the tampered one live → red report. Reliability: cache the report for the demo file so a network blip can't ruin the moment (fallback to stored JSON).

---

## 9. Fraud & anomaly engine (WOW #3)

**Rules (run on each new transfer + periodically):**

| Rule | Trigger | Severity |
|------|---------|----------|
| `DOUBLE_SALE` | parcel already `InTransfer` when a new initiate is attempted (also caught on-chain) | HIGH |
| `OWNERSHIP_MISMATCH` | initiator wallet ≠ `ownerOf(parcelId)` | HIGH |
| `RAPID_FLIP` | parcel transferred < N days ago | MED |
| `FORGED_DOC` | AI verdict LIKELY_FORGED / hash mismatch | HIGH |

**Registrar war-room UI:**
- Live alert feed via **Supabase Realtime** (new `FraudAlert` row → pushes to dashboard instantly).
- **Leaflet district map**: markers per parcel, colored green/amber/red; click → parcel + offending transfer.
- KPI tiles: total parcels, pending transfers, active alerts, forgeries blocked.

**Demo tactic:** from a second browser/account, attempt to sell an already-in-transfer plot → a red `DOUBLE_SALE` alert pops on the registrar's screen in real time. Very cinematic.

---

## 10. UX / design system

**Feel:** official, trustworthy, "Digital India" — but modern, not a clunky govt portal.

- **Palette:** deep indigo/navy (`#1E3A8A`) + saffron accent (`#F59E0B`) + green verified (`#16A34A`) + red alert (`#DC2626`). (Echoes tricolor tastefully.)
- **Typography:** Inter / system; large confident headings.
- **Components:** shadcn/ui (Card, Badge, Dialog, Table, Tabs, Toast). Verified badge with a shield/seal icon.
- **Three surfaces, one design language:**
  - **Citizen Portal** — warm, simple, guided ("My Parcels", "Transfer", "Approvals").
  - **Registrar Dashboard** — dense, data-rich, war-room (map + alerts + queue).
  - **Public Verify** — minimal, instant, official (seal + green check + timeline).
- **Micro-wow:** animated "signing…" state, chain-confirmation toast with tx hash, timeline that draws in.

---

## 11. Target folder structure

```
bhoomichain/
├── contracts/
│   ├── contracts/LandRegistry.sol
│   ├── scripts/deploy.js
│   ├── scripts/seed.js            # register demo parcels
│   ├── test/LandRegistry.test.js
│   └── hardhat.config.js
├── web/
│   ├── app/
│   │   ├── (citizen)/portal/...          # my parcels, transfer, approvals
│   │   ├── (registrar)/dashboard/...     # queue, fraud war-room, map
│   │   ├── verify/[id]/page.tsx          # public verify (server component)
│   │   ├── admin/page.tsx                # grant registrar role
│   │   └── api/                          # route handlers (see §5)
│   ├── components/                       # ui, ParcelCard, Timeline, VerifyBadge, FraudMap
│   ├── lib/
│   │   ├── chain.ts                      # ethers provider, contract instance, ABI
│   │   ├── contract-abi.json
│   │   ├── ai.ts                         # Claude vision forgery report
│   │   ├── hash.ts                       # sha256
│   │   ├── supabase.ts
│   │   └── fraud.ts                      # rules engine
│   ├── prisma/schema.prisma
│   └── .env.local
├── docs/
└── package.json (workspaces) or two separate installs
```

---

## 12. Environment variables

```
# web/.env.local
NEXT_PUBLIC_CHAIN_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...        # from deploy
NEXT_PUBLIC_APP_URL=http://localhost:3000 # (or Vercel URL for QR)
ANTHROPIC_API_KEY=sk-ant-...              # server only
DATABASE_URL=postgresql://...             # Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...             # server only
```

---

## 13. Migration path (say this to judges when asked "is this production-ready?")

> "For a state-wide production consortium, we'd migrate the same contract logic to **Hyperledger Fabric** with each district registrar as a peer/MSP, integrate **DigiLocker/Aadhaar** for real e-KYC and e-sign, anchor documents on **IPFS**, and connect to **survey/GIS** systems. The data model, workflow, and integrity guarantees stay identical — we've proven them here."

This shows feasibility + maturity without having to build it in 48 hours.

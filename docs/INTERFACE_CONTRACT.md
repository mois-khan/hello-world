# 🔒 INTERFACE CONTRACT — BhoomiChain (SINGLE SOURCE OF TRUTH)

> **THIS FILE IS LAW.** Every dev and every AI agent (Claude Code / Cursor) MUST use these exact names, paths,
> and shapes. If your code disagrees with this file, **your code is wrong** — fix the code, not this file.
>
> **To change anything here:** announce it in the team chat, update THIS file first, then update code. Never the
> reverse. A silent rename here = hours of merge conflicts.

**Paste this line into every AI agent prompt:**
> *"Strictly follow `docs/INTERFACE_CONTRACT.md` for all names, endpoints, env vars, types, and data shapes. Do not invent or rename anything defined there."*

---

## 0. Naming conventions (non-negotiable)

| Thing | Convention | Example |
|-------|-----------|---------|
| Env vars | `SCREAMING_SNAKE_CASE`, public ones prefixed `NEXT_PUBLIC_` | `NEXT_PUBLIC_CONTRACT_ADDRESS` |
| API routes | lowercase, plural nouns, kebab where needed | `/api/parcels`, `/api/ai/verify-doc` |
| React components | `PascalCase` | `ParcelCard`, `OwnershipTimeline` |
| Lib files | `camelCase.ts` | `lib/chain.ts`, `lib/hash.ts` |
| Functions | `camelCase`, verbs | `registerParcel()`, `getParcel()` |
| DB models (Prisma) | `PascalCase` singular | `ParcelMeta`, `FraudAlert` |
| DB fields | `camelCase` | `surveyNumber`, `documentHash` |
| Solidity funcs/events | `camelCase` / `PascalCase` events | `initiateTransfer`, `TransferCompleted` |
| **IDs** | on-chain `parcelId`/`transferId` are the canonical IDs; DB rows reuse them as `id` | `ParcelMeta.id == on-chain parcelId` |

**Money/units:** `area` is an integer (square feet). Coordinates are two floats `lat`, `lng`. Dates are ISO 8601 strings across APIs.

---

## 1. Chain config (everyone hardcodes the same values)

```
Network name      : BhoomiChain Local (Hardhat)
RPC URL           : http://127.0.0.1:8545
Chain ID          : 31337        // decimal. hex 0x7A69
Currency symbol   : ETH
Contract name     : LandRegistry
Token name/symbol : "BhoomiChain Land Title" / "BHOOMI"
```

Deployed contract address is injected via `NEXT_PUBLIC_CONTRACT_ADDRESS` (see §5). **Never hardcode the address** — read it from env.

---

## 2. Smart contract API (`LandRegistry.sol`) — the on-chain source of truth

### Roles (bytes32)
```
DEFAULT_ADMIN_ROLE   // OpenZeppelin default — the government admin (deployer)
REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE")
```

### Enums (MUST match the off-chain string enums in §4)
```solidity
enum ParcelStatus   { Active, InTransfer }                                   // 0,1
enum TransferStatus { None, PendingBuyer, PendingRegistrar, Completed, Rejected } // 0..4
```

### Write functions (exact signatures)
```solidity
function registerParcel(address owner, string surveyNumber, string district, string geo, uint256 area, bytes32 documentHash) returns (uint256 parcelId)  // REGISTRAR_ROLE
function initiateTransfer(uint256 parcelId, address buyer, bytes32 newDocumentHash) returns (uint256 transferId)  // owner only
function buyerApprove(uint256 transferId)            // buyer only
function registrarFinalize(uint256 transferId)       // REGISTRAR_ROLE
function rejectTransfer(uint256 transferId, string reason)  // buyer | seller | registrar
```

### Read functions
```solidity
function ownerOf(uint256 parcelId) returns (address)
function parcels(uint256 parcelId) returns (Parcel)         // struct in §2.1
function transfers(uint256 transferId) returns (TransferRequest)
function activeTransferOf(uint256 parcelId) returns (uint256) // 0 = none
function hasRole(bytes32 role, address account) returns (bool)
function nextParcelId() returns (uint256)
function nextTransferId() returns (uint256)
```

### 2.1 Structs
```
Parcel          { uint256 id; string surveyNumber; string district; string geo; uint256 area; bytes32 documentHash; uint256 registeredAt; ParcelStatus status; }
TransferRequest { uint256 parcelId; address seller; address buyer; bytes32 newDocumentHash; bool sellerApproved; bool buyerApproved; bool registrarApproved; TransferStatus status; uint256 createdAt; }
```

### 2.2 Events (indexer + timeline read these — DO NOT rename)
```solidity
event ParcelRegistered(uint256 indexed parcelId, address indexed owner, string surveyNumber, bytes32 documentHash);
event TransferInitiated(uint256 indexed transferId, uint256 indexed parcelId, address seller, address buyer);
event TransferApproved(uint256 indexed transferId, address indexed by, string role);   // role: "seller"|"buyer"|"registrar"
event TransferCompleted(uint256 indexed transferId, uint256 indexed parcelId, address indexed newOwner);
event TransferRejected(uint256 indexed transferId, address indexed by, string reason);
```

---

## 3. Shared TypeScript types (`web/lib/types.ts`) — import from here, never redefine

```ts
export type Role = "CITIZEN" | "REGISTRAR" | "ADMIN";

export type ParcelStatus = "Active" | "InTransfer";
export type TransferStatus = "None" | "PendingBuyer" | "PendingRegistrar" | "Completed" | "Rejected";

export interface Parcel {
  id: number;
  surveyNumber: string;
  district: string;
  geo: string;            // "lat,lng"
  area: number;           // sq ft
  documentHash: string;   // 0x-prefixed bytes32
  registeredAt: number;   // unix seconds (from chain)
  status: ParcelStatus;
  owner: string;          // wallet address (from ownerOf)
}

export interface ParcelMeta {
  id: number;             // == on-chain parcelId
  surveyNumber: string;
  district: string;
  addressText: string;
  lat: number;
  lng: number;
  area: number;
  currentDocId: string | null;
}

export interface TransferRequest {
  id: number;             // == on-chain transferId
  parcelId: number;
  seller: string;
  buyer: string;
  newDocumentHash: string;
  status: TransferStatus;
  createdAt: number;
}

export interface AiReport {
  hashMatch: boolean | null;   // null if no prior on-chain hash to compare
  sha256: string;
  riskScore: number;           // 0..100
  verdict: "LIKELY_GENUINE" | "SUSPICIOUS" | "LIKELY_FORGED";
  indicators: {
    fontConsistency: string;
    sealIntegrity: string;
    digitalArtifacts: string;
    numeralTampering: string;
  };
  reasons: string[];
  model: string;
}

export type FraudType = "DOUBLE_SALE" | "OWNERSHIP_MISMATCH" | "RAPID_FLIP" | "FORGED_DOC";
export type Severity = "LOW" | "MED" | "HIGH";

export interface FraudAlert {
  id: string;
  parcelId: number;
  type: FraudType;
  severity: Severity;
  detail: string;
  resolved: boolean;
  createdAt: string;      // ISO
}

export interface UploadResult { url: string; sha256: string; }
```

---

## 4. Database models (Prisma) — field names are FROZEN

> Full schema lives in `web/prisma/schema.prisma` (source in [DESIGN.md §4](DESIGN.md#4-off-chain-data-model-prisma--postgres)).
> Models: `User`, `ParcelMeta`, `Document`, `TransferMeta`, `FraudAlert`, `AuditLog`.

Enum string values MUST match exactly:
```
Role           : CITIZEN | REGISTRAR | ADMIN
FraudAlert.type: DOUBLE_SALE | OWNERSHIP_MISMATCH | RAPID_FLIP | FORGED_DOC
severity       : LOW | MED | HIGH
TransferMeta.status : same strings as TransferStatus (§3)
```

**Supabase Storage bucket name:** `documents` (exactly, lowercase).
**Supabase Realtime:** enabled on table `FraudAlert` (Postgres table name follows Prisma mapping — verify actual table name after migrate and record it here: `______`).

---

## 5. Environment variables — EXACT names (single list, no aliases)

```bash
# ---- Chain ----
NEXT_PUBLIC_CHAIN_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_CONTRACT_ADDRESS=          # filled after `npm run deploy`

# ---- App ----
NEXT_PUBLIC_APP_URL=http://localhost:3000   # used to build QR verify links

# ---- Supabase ----
DATABASE_URL=                          # Postgres connection string (server)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # server only — NEVER expose to client

# ---- AI ----
ANTHROPIC_API_KEY=                     # server only
AI_MODEL=claude-opus-4-8               # keep identical across the team

# ---- Demo ----
DEMO_FORCE_REPORT=false                # true → /api/ai/verify-doc returns cached demo report
```

> ❗ Any new env var must be added HERE and to `web/.env.local.example` in the SAME commit.

---

## 6. REST API contract (Next.js route handlers) — request & response shapes are FROZEN

> Convention: success → `{ ok: true, data: <...> }`; error → `{ ok: false, error: "<message>" }`, HTTP status set appropriately. **Every endpoint returns this envelope.**

### `POST /api/upload`
Uploads a document to Supabase Storage, returns URL + hash. **Owner: Dev C.**
```
Request (multipart/form-data): file=<File>, parcelId?=<number>
Response data: UploadResult   // { url, sha256 }
```

### `POST /api/ai/verify-doc`  · **Owner: Dev C**
```
Request (json): { documentId?: string, url?: string, parcelId?: number }
Response data: AiReport
```

### `GET /api/parcels`  · **Owner: Dev C**
```
Query: ?q=<search>&owner=<wallet>&district=<name>
Response data: Parcel[]        // merged: ParcelMeta + live ownerOf + status
```

### `GET /api/parcels/[id]`  · **Owner: Dev C**
```
Response data: { parcel: Parcel; meta: ParcelMeta; document: { url: string; sha256: string; aiReport: AiReport | null } | null; history: TimelineEvent[] }
```
```ts
interface TimelineEvent { type: "REGISTERED" | "TRANSFERRED"; from?: string; to: string; at: number; txHash: string; }
```

### `POST /api/parcels`  · **Owner: Dev C** (metadata mirror only — the chain write happens client-side via MetaMask)
```
Request (json): { parcelId: number, surveyNumber, district, addressText, lat, lng, area, ownerWallet, docUrl, sha256 }
Response data: ParcelMeta
```

### `GET /api/transfers`  · **Owner: Dev C**
```
Query: ?wallet=<address>&role=<CITIZEN|REGISTRAR>
Response data: TransferRequest[]   // for citizen: as buyer/seller; for registrar: PendingRegistrar
```

### `POST /api/transfers/mirror`  · **Owner: Dev C** (mirror after each chain tx)
```
Request (json): { transferId: number, parcelId: number, seller, buyer, status: TransferStatus, newDocumentHash }
Response data: TransferRequest
```

### `GET /api/fraud`  · **Owner: Dev C**
```
Query: ?resolved=false
Response data: FraudAlert[]
```

### `POST /api/fraud/scan`  · **Owner: Dev C**
```
Request (json): { transferId?: number, parcelId?: number }
Response data: FraudAlert[]        // any new alerts created
```

### `GET /api/certificate/[id]`  · **Owner: Dev C**
```
Response: application/pdf (binary)  // Title Certificate for parcelId
```

### `POST /api/sync`  · **Owner: Dev A/C** (run the chain indexer)
```
Request (json): { from?: number }  // block number
Response data: { parcelsSynced: number, transfersSynced: number }
```

---

## 7. Shared library function signatures (`web/lib/*`) — import, don't reimplement

### `lib/chain.ts` · **Owner: Dev A**
```ts
getProvider(): JsonRpcProvider
getContract(runner?: Signer | Provider): Contract
// writes (need a MetaMask signer)
registerParcel(signer, args: { owner: string; surveyNumber: string; district: string; geo: string; area: number; documentHash: string }): Promise<{ parcelId: number; txHash: string }>
initiateTransfer(signer, parcelId: number, buyer: string, newDocumentHash: string): Promise<{ transferId: number; txHash: string }>
buyerApprove(signer, transferId: number): Promise<{ txHash: string }>
registrarFinalize(signer, transferId: number): Promise<{ txHash: string }>
rejectTransfer(signer, transferId: number, reason: string): Promise<{ txHash: string }>
// reads
getParcel(id: number): Promise<Parcel>
ownerOf(id: number): Promise<string>
getTransfer(id: number): Promise<TransferRequest>
activeTransferOf(parcelId: number): Promise<number>
isRegistrar(address: string): Promise<boolean>
getHistory(parcelId: number): Promise<TimelineEvent[]>   // via queryFilter
```

### `lib/wallet.ts` · **Owner: Dev C**
```ts
connectWallet(): Promise<{ address: string; signer: Signer }>
getConnectedAddress(): string | null
ensureCorrectNetwork(): Promise<void>   // enforce chainId 31337
```

### `lib/hash.ts` · **Owner: Dev C**
```ts
sha256(input: File | Buffer | ArrayBuffer): Promise<string>   // returns "0x..."-prefixed bytes32-compatible hex
```

### `lib/ai.ts` · **Owner: Dev C**
```ts
analyzeDocument(imageBase64: string, mimeType: string): Promise<Omit<AiReport, "hashMatch" | "sha256">>
```

### `lib/fraud.ts` · **Owner: Dev C**
```ts
scanTransfer(transferId: number): Promise<FraudAlert[]>
scanParcel(parcelId: number): Promise<FraudAlert[]>
```

### `lib/indexer.ts` · **Owner: Dev A**
```ts
syncParcels(fromBlock?: number): Promise<number>
syncTransfers(fromBlock?: number): Promise<number>
```

---

## 8. Frontend routes (Dev B owns UI; paths are FROZEN)

| Route | Surface | Purpose |
|-------|---------|---------|
| `/` | Public | Landing + pitch |
| `/verify` | Public | Search parcels |
| `/verify/[id]` | Public | Verification page (owner + history + QR) |
| `/portal/parcels` | Citizen | My parcels |
| `/portal/transfer` | Citizen | Initiate transfer (seller) |
| `/portal/approvals` | Citizen | Approve transfers (buyer) |
| `/dashboard` | Registrar | Fraud war-room (KPIs + alerts + map) |
| `/dashboard/register` | Registrar | Register new parcel |
| `/dashboard/transfers` | Registrar | Transfer queue + finalize |
| `/admin` | Admin | Grant/revoke REGISTRAR_ROLE |

Shared components (in `web/components/`): `ParcelCard`, `ParcelDetail`, `OwnershipTimeline`, `TransferStepper`, `VerifyBadge`, `DocumentIntegrityReport`, `FraudMap`, `FraudFeed`, `KpiTile`, `QrCode`, `WalletButton`.

---

## 9. The double-check rule (avoid the classic conflicts)

Before you (or your agent) write code, confirm against this file:
1. **Env var** exists here with this exact name? If not, add it here first.
2. **API path + shape** matches §6 exactly? Don't invent `/api/getParcels` — it's `GET /api/parcels`.
3. **Type** exists in §3? Import it; don't redefine a local `interface Parcel`.
4. **Contract function/event** matches §2? Names are case-sensitive.
5. **DB field** matches §4? `surveyNumber`, not `survey_number` or `surveyNo`.
6. **Response envelope** is `{ ok, data }` / `{ ok, error }`? Always.

> When in doubt, grep this file. When still in doubt, ask the team before coding — a 2-minute message beats a 2-hour merge conflict.

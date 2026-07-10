# Build Prompts — BhoomiChain

Copy-paste prompts for **Claude Code / Cursor**, one per task, mapped to [PHASE_WISE_PLAN.md](PHASE_WISE_PLAN.md).

## How to use these
1. Keep [PRD.md](PRD.md) + [DESIGN.md](DESIGN.md) open in the repo — the AI reads them for context.
2. **Prepend this context primer to your first prompt of each session:**

> **Context primer (paste once per session):**
> "We're building BhoomiChain, a blockchain land registry for a 48h Digital India hackathon. Stack: Solidity + Hardhat + OpenZeppelin (ERC-721 + AccessControl), Next.js 14 App Router + React + Tailwind + shadcn/ui, ethers.js v6, Prisma + Supabase (Postgres/Storage/Realtime), Claude vision for forgery detection. Read `docs/PRD.md` and `docs/DESIGN.md` for full spec. Optimize for a working, polished, demo-able result over completeness. Match existing code style. Always add loading/error/empty states."

3. Work task-by-task; verify each runs before moving on. Commit after each ✅.

---

# PHASE 0 — Foundations

### P0.1 — Hardhat + contract skeleton (Dev A)
```
Initialize a Hardhat TypeScript project in `contracts/`. Install @openzeppelin/contracts.
Create `contracts/LandRegistry.sol` exactly as specified in docs/DESIGN.md §3.1 (ERC-721 + AccessControl,
REGISTRAR_ROLE, Parcel + TransferRequest structs, register/initiate/buyerApprove/registrarFinalize/reject,
transfer-lock overrides, all events). Make it compile cleanly with `npx hardhat compile`. Do not add features
beyond the spec.
```

### P0.2 — Deploy script + ABI export (Dev A)
```
Create `contracts/scripts/deploy.js` that deploys LandRegistry to the localhost network and prints the
contract address. Then write the compiled ABI to `web/lib/contract-abi.json`. Add npm scripts: "node"
(hardhat node), "deploy" (deploy to localhost). Document the exact commands to run in a comment.
```

### P0.3 — Next.js app + design system (Dev B)
```
Scaffold a Next.js 14 app (TypeScript, App Router, Tailwind) in `web/`. Install and init shadcn/ui; add
card, button, badge, dialog, table, tabs, sonner (toast), input, label components. Set up a design system per
docs/DESIGN.md §10: color tokens (indigo #1E3A8A primary, saffron #F59E0B accent, green #16A34A verified,
red #DC2626 alert), Inter font, an app shell with top nav. Create a landing page featuring the one-line pitch
from README.md. Add empty stub pages for /portal, /dashboard, /verify/[id], /admin. Make it look official but
modern — think 'Digital India, but beautiful'.
```

### P0.4 — Data + chain libs (Dev C)
```
In `web/`: set up Prisma with the schema from docs/DESIGN.md §4 (User, ParcelMeta, Document, TransferMeta,
FraudAlert, AuditLog). Configure DATABASE_URL for Supabase and run the first migration. Create:
- `lib/supabase.ts` (client for browser + server/service-role)
- `lib/hash.ts` (sha256 of a File/Buffer)
- `lib/chain.ts` (ethers v6 JsonRpcProvider to NEXT_PUBLIC_CHAIN_RPC, a getContract() using contract-abi.json
  and NEXT_PUBLIC_CONTRACT_ADDRESS, and a browser BrowserProvider signer helper for MetaMask)
- `lib/wallet.ts` (connect MetaMask, expose connected address, network guard for chainId 31337)
Add a `.env.local.example` with all vars from docs/DESIGN.md §12.
```

---

# PHASE 1 — Core Registry MVP

### P1.1 — Registration contract wrappers + tests (Dev A)
```
In `contracts/test/LandRegistry.test.js` write Hardhat/Chai tests for registerParcel: correct owner after mint,
ParcelRegistered event fields, and that a non-registrar signer reverts. In `web/lib/chain.ts` add typed wrappers:
registerParcel(signer, {owner, surveyNumber, district, geo, area, documentHash}), getParcel(id), ownerOf(id).
```

### P1.2 — Upload + parcel APIs (Dev C)
```
Create Next.js route handlers:
- POST /api/upload — accept a file, store in Supabase Storage bucket 'documents', compute sha256 (lib/hash),
  return { url, sha256 }.
- GET /api/parcels — list parcels from ParcelMeta (support ?q= search on surveyNumber/district).
- GET /api/parcels/[id] — return ParcelMeta joined with latest Document, plus live owner from chain (ownerOf).
Add a lightweight event indexer `lib/indexer.ts` with a function syncParcels() that queries ParcelRegistered
events and upserts ParcelMeta rows. Call it from an /api/sync route we can hit manually.
```

### P1.3 — Register Parcel UI (Dev B)
```
Build the Registrar 'Register Parcel' screen at /dashboard/register: a form (survey number, district, address,
lat, lng, area, owner wallet address, document file). On submit: POST /api/upload to get {url, sha256}, then call
lib/chain registerParcel via the connected MetaMask signer (must be a REGISTRAR_ROLE account), passing the sha256
as documentHash (bytes32). Show a pending toast, then a success toast with the tx hash and new parcelId. Then POST
to /api/sync. Gate the page: warn if connected wallet lacks REGISTRAR_ROLE.
```

### P1.4 — My Parcels + parcel detail (Dev B)
```
Build Citizen Portal /portal/parcels: list parcels owned by the connected wallet (fetch /api/parcels then filter
by on-chain ownerOf == wallet, or add an owner filter to the API). Each parcel → a ParcelCard (survey no, district,
area, verified badge). Build a shared ParcelDetail component showing all fields, current owner, document-integrity
badge, and a link to /verify/[id]. Add loading/empty/error states.
```

### P1.5 — Verify page v1 (Dev C)
```
Build /verify/[id] as a server component (no auth). Read current owner (ownerOf) and parcel struct directly from
chain via lib/chain, plus ParcelMeta from DB. Render an official-looking verification card: green 'Verified on
BhoomiChain' badge, owner (masked name from User table if known, else wallet), parcel details, and a placeholder
'Ownership history' section (filled in Phase 3). Must load fast and feel authoritative.
```

### P1.6 — Seed data (Dev C)
```
Create `contracts/scripts/seed.js`: using the registrar signer, register 8 realistic Indian parcels across
districts (e.g. Rangareddy-Telangana, Pune-Maharashtra, Bengaluru Urban-Karnataka) with believable survey numbers,
areas, and lat/lng, owned by 3 demo citizen accounts. Also insert matching ParcelMeta + User rows via a small
prisma seed. Print a summary table of parcelId → owner → survey number.
```

---

# PHASE 2 — Multi-Sig Transfer Workflow

### P2.1 — Transfer contract wrappers + tests (Dev A)
```
Add Hardhat tests for the transfer workflow: full happy path (initiate→buyerApprove→registrarFinalize moves
ownership and emits TransferCompleted), double-sale (second initiate on a busy parcel reverts), non-registrar
finalize reverts, and direct transferFrom reverts. Add lib/chain wrappers: initiateTransfer(signer, parcelId,
buyer, newDocHash), buyerApprove(signer, tid), registrarFinalize(signer, tid), rejectTransfer(signer, tid, reason),
getTransfer(tid), activeTransferOf(parcelId).
```

### P2.2 — Transfer indexer + API (Dev C)
```
Extend lib/indexer.ts to sync TransferInitiated/Approved/Completed/Rejected into TransferMeta and write an
AuditLog row per event. Create GET /api/transfers?wallet=&role= returning transfers relevant to a user (as seller,
buyer, or — if registrar — all pending-registrar). Trigger POST /api/fraud/scan (stub for now) after each
TransferInitiated.
```

### P2.3 — Initiate transfer UI (Dev B)
```
Build Citizen Portal /portal/transfer: seller picks one of their parcels, enters buyer wallet address, uploads the
new sale deed (POST /api/upload → sha256), then calls initiateTransfer via MetaMask. Show the transfer stepper
(Draft→Buyer→Registrar→Completed) at PENDING_BUYER. Validate the seller actually owns the parcel and it's not
already in transfer.
```

### P2.4 — Buyer approvals UI (Dev B)
```
Build Citizen Portal /portal/approvals: list transfers where connected wallet == buyer and status == PendingBuyer.
Each shows parcel details, seller, the new deed link, and a 'Review & Sign' action that calls buyerApprove via
MetaMask. On success advance the stepper to PENDING_REGISTRAR and toast the tx hash.
```

### P2.5 — Registrar transfer queue (Dev B)
```
Build Registrar Dashboard /dashboard/transfers: list transfers with status PendingRegistrar. Each row → a review
drawer showing parcel, seller, buyer, and the deed (with a placeholder for the AI integrity report from Phase 3).
Actions: 'Finalize' (registrarFinalize via MetaMask, must hold REGISTRAR_ROLE) and 'Reject' (rejectTransfer with a
reason). On finalize, show ownership moved + success state.
```

---

# PHASE 3 — Wow Features

### P3A.1 — Ownership history + QR (Dev B/C) · WOW #1
```
Complete /verify/[id]: build an OwnershipTimeline that reads TransferCompleted + ParcelRegistered events for this
parcelId from chain (queryFilter) and renders a vertical timeline (registered → each transfer with from/to/date/tx
hash). Add a QR code (npm 'qrcode') encoding `${NEXT_PUBLIC_APP_URL}/verify/${id}`, shown on the parcel detail page
and printable. Style the verify page like an official govt certificate with a seal and green verified check.
```

### P3A.2 — Public search + Title Certificate PDF (Dev C)
```
Add a public /verify search page: search parcels by survey number/district (GET /api/parcels?q=) → results link to
/verify/[id]. Add GET /api/certificate/[id] that generates a PDF Title Certificate (use @react-pdf/renderer or
pdf-lib) containing parcel details, current owner, the QR code, and an on-chain proof line (contract address +
latest tx hash). Wire a 'Download Certificate' button on the verify page.
```

### <a id="ai-forgery-prompt"></a>P3B.1 — AI forgery detection (Dev C) · WOW #2
```
Create lib/ai.ts with analyzeDocument(imageBase64) that calls the Claude vision API (model claude-opus-4-8, key
from ANTHROPIC_API_KEY, server-side only) and returns strict JSON. Use this system/user prompt:

  "You are a forensic document examiner for a government land registry. Analyze this land sale deed / title
   document image for signs of forgery or digital tampering. Assess: font/kerning consistency, seal & stamp
   integrity, digital editing artifacts (cloning, mismatched compression, halos), numeral/date/area tampering,
   and layout alignment. Respond ONLY with JSON:
   { \"riskScore\": <0-100 int>, \"verdict\": \"LIKELY_GENUINE|SUSPICIOUS|LIKELY_FORGED\",
     \"indicators\": { \"fontConsistency\": \"...\", \"sealIntegrity\": \"...\", \"digitalArtifacts\": \"...\",
     \"numeralTampering\": \"...\" }, \"reasons\": [\"short bullet\", ...] }"

Then create POST /api/ai/verify-doc: accepts a documentId, loads the file, computes sha256, compares to the
parcel's on-chain documentHash if present (exact tamper proof), runs analyzeDocument, and stores the combined
report on Document.aiReport. Return { hashMatch, sha256, ai }. Handle API errors gracefully and support a
DEMO_FORCE_REPORT env fallback that returns a cached report for the demo file.
```

### P3B.2 — Integrity report UI + finalize gate (Dev B)
```
In the registrar transfer review drawer (P2.5) and the register form (P1.3), show a DocumentIntegrityReport
component: cryptographic result (UNCHANGED / TAMPERED badge from hashMatch), AI risk score gauge (0-100),
verdict badge (green/amber/red), and the reasons list. If verdict==LIKELY_FORGED or riskScore>=70, disable the
Finalize button and require an explicit 'Override & log reason' dialog (writes an AuditLog). Make the red
'FORGERY DETECTED' state visually dramatic for the demo.
```

### P3C.1 — Fraud rules engine (Dev C) · WOW #3
```
Create lib/fraud.ts with scanTransfer(transferId) and scanParcel(parcelId) implementing the rules in
docs/DESIGN.md §9: DOUBLE_SALE (parcel already InTransfer), OWNERSHIP_MISMATCH (initiator != ownerOf), RAPID_FLIP
(last transfer < 7 days), FORGED_DOC (from aiReport). Each detection writes a FraudAlert row (type, severity,
detail). Expose POST /api/fraud/scan and GET /api/fraud (active alerts). Call scanTransfer after each
TransferInitiated in the indexer.
```

### P3C.2 — Registrar war-room dashboard (Dev B) · WOW #3
```
Build Registrar Dashboard home /dashboard: KPI tiles (total parcels, pending transfers, active alerts, forgeries
blocked), a LIVE fraud alert feed subscribed to the FraudAlert table via Supabase Realtime (new rows animate in,
color by severity, link to parcel/transfer), and a Leaflet map (react-leaflet + OpenStreetMap tiles, no API key)
plotting all parcels by lat/lng as markers colored green (clean) / amber (in transfer) / red (flagged); click a
marker → parcel summary popover. Make new HIGH alerts pop with a toast + subtle sound.
```

---

# PHASE 4 — Polish & Demo Hardening

### P4.1 — Rich demo seed + reset (Dev C)
```
Extend the seed to a believable world: 12-15 parcels across real districts, 3-4 already-completed transfers (so
timelines look lived-in), one parcel pre-flagged with a fraud alert, and the demo forged-document with its cached
AI report. Add a `npm run demo:reset` script that wipes transient state and reseeds to a known clean demo starting
point in <30s.
```

### P4.2 — Polish pass (Dev B)
```
Do a full polish pass: consistent spacing/typography, loading skeletons, empty states, friendly error toasts (no
raw errors), animated tx-confirmation and 'signing…' states, the timeline draw-in animation, and mobile
responsiveness for /verify/[id] (the QR-scan target). Add govt-seal styling and a subtle 'Powered by BhoomiChain'
footer with the contract address.
```

### P4.3 — Deploy + phone-ready QR (Dev A/C)
```
Deploy the web app to Vercel with production env vars. Keep the chain local. Make /verify/[id] work from a phone:
either (a) serve verify reads from a hosted RPC/tunnel to the local Hardhat node, or (b) add a read-only cached
mirror of parcel+owner+history in the DB that /verify reads when RPC is unreachable, clearly still backed by the
same on-chain data. Test scanning the QR on a real phone end-to-end. Record a 90-second backup demo video.
```

---

# PHASE 5 — Pitch

### P5.1 — Pitch deck
```
Draft an 8-slide pitch deck outline (as markdown I can put into slides): 1) hook + one-line pitch, 2) the problem
with numbers (6.2cr records, ~66% of civil litigation), 3) our solution + how blockchain uniquely fits, 4) live
demo cue, 5) the 3 wow features, 6) impact on citizens/govt/business, 7) architecture (1 diagram) + honest
permissioned framing, 8) roadmap (Fabric, DigiLocker, IPFS, GIS) + the ask. Keep text minimal, visuals bold.
```

---

## Prompting tips for speed
- **One task per prompt.** Big prompts drift. Small prompts ship.
- **Reference the docs**: "per docs/DESIGN.md §3.1" keeps the AI aligned to your spec.
- **Ask for the run command** at the end of each prompt so you can verify immediately.
- **When stuck on chain issues**, paste the exact error + the relevant contract/lib snippet, not the whole repo.
- **Guardrail every prompt**: "don't add features beyond the spec" — prevents 48h scope creep.

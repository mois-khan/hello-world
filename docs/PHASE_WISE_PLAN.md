# Phase-Wise Build Plan — BhoomiChain (48h · 3 devs)

Companion to [PRD.md](PRD.md) + [DESIGN.md](DESIGN.md). Build prompts for every task: [PROMPTS.md](PROMPTS.md).

---

## The golden rule

> **Get the "Must" (MVP) working end-to-end and demo-able BEFORE touching any "wow" feature.**
> A working register→sign→transfer→verify loop with basic UI beats a half-built AI feature. Protect the demo above all.

## Team split (parallel tracks)

| Dev | Track | Owns |
|-----|-------|------|
| **Dev A — Chain** | Smart contracts + chain integration | `LandRegistry.sol`, Hardhat, deploy/seed, `lib/chain.ts`, ABI, indexer, tests |
| **Dev B — Frontend** | UI across all 3 surfaces | Next.js app, design system, citizen portal, registrar dashboard, verify page |
| **Dev C — Intelligence + Glue** | AI, fraud, data, QR, DevOps | Supabase/Prisma, `/api/*`, AI forgery, fraud engine, QR, map, seed data, deploy, demo |

Tracks converge at every **milestone (🏁)**. Integrate early and often — don't save integration for the end.

---

## Timeline overview

| Phase | Hours | Theme | Milestone |
|-------|-------|-------|-----------|
| 0 | 0–3 | Foundations & scaffolding | 🏁 M0: everything runs empty |
| 1 | 3–14 | Core registry MVP | 🏁 M1: register + verify a parcel |
| 2 | 14–24 | Multi-sig transfer workflow | 🏁 M2: full signed transfer on-chain |
| 3 | 24–38 | Wow features (QR · AI · Fraud) | 🏁 M3: all 3 wow moments live |
| 4 | 38–46 | Polish · seed · demo hardening | 🏁 M4: rehearsed, zero-crash demo |
| 5 | 46–48 | Pitch prep + buffer | 🏁 M5: deck + script locked |

> **Sleep plan (48h is a marathon):** stagger rest. Nobody pulls a full all-nighter — tired demos lose. Aim ~4–5h sleep each in shifts around hour 24–32.

---

## PHASE 0 — Foundations (Hours 0–3)

**Goal:** every layer boots, even if empty. Kill setup risk immediately.

### Dev A — Chain
- [ ] `npx hardhat init` in `contracts/`; install OpenZeppelin.
- [ ] Paste `LandRegistry.sol` skeleton (from [DESIGN.md §3](DESIGN.md#3-smart-contract-design)); compile clean.
- [ ] `scripts/deploy.js`; run `npx hardhat node` + deploy to localhost; print contract address.
- [ ] Export ABI to `web/lib/contract-abi.json`.

### Dev B — Frontend
- [ ] `create-next-app` (TS, App Router, Tailwind) in `web/`.
- [ ] Install shadcn/ui; add Card, Button, Badge, Dialog, Table, Tabs, Toast.
- [ ] Build the **design system + shell**: nav, color tokens (indigo/saffron/green/red), layout for 3 surfaces, landing page with the pitch line.
- [ ] Stub routes: `/portal`, `/dashboard`, `/verify/[id]`, `/admin`.

### Dev C — Intelligence + Glue
- [ ] Create Supabase project; get keys.
- [ ] Prisma schema (from [DESIGN.md §4](DESIGN.md#4-off-chain-data-model-prisma--postgres)); `prisma migrate`.
- [ ] `lib/chain.ts` (ethers provider + contract instance), `lib/supabase.ts`, `lib/hash.ts` (sha256).
- [ ] MetaMask connect helper; import 3 Hardhat accounts (seller/buyer/registrar) into MetaMask + document their addresses.

**🏁 M0 (hr 3):** Hardhat node running with deployed contract · Next.js app loads all routes · DB migrated · wallet connects. **Commit + push.**

---

## PHASE 1 — Core Registry MVP (Hours 3–14)

**Goal:** a registrar can register a parcel on-chain, and anyone can view it.

### Dev A — Chain
- [ ] Finalize `registerParcel` + `parcels` getter; unit tests (register, owner, event, non-registrar reverts).
- [ ] `lib/chain.ts` wrappers: `registerParcel()`, `getParcel(id)`, `ownerOf(id)`.
- [ ] Event indexer: on `ParcelRegistered`, upsert `ParcelMeta` in DB.

### Dev B — Frontend
- [ ] **Registrar → Register Parcel** form (survey no, district, coords, area, owner wallet, doc upload) → calls chain + `/api/upload`.
- [ ] **Citizen Portal → My Parcels**: list parcels where `ownerOf == connectedWallet`.
- [ ] **Parcel detail** component (details + owner + doc integrity badge).
- [ ] Toaster for tx pending/confirmed with tx hash.

### Dev C — Intelligence + Glue
- [ ] `/api/upload` → Supabase Storage, return `{url, sha256}`.
- [ ] `/api/parcels` + `/api/parcels/[id]` (read from DB + chain).
- [ ] Seed script: 6–8 realistic Indian parcels (districts, survey numbers, names, coords).
- [ ] Basic **/verify/[id]** reading owner + details from chain (history comes in Phase 3, but wire the page now).

**🏁 M1 (hr 14):** Register a parcel as registrar → it appears in owner's portal → `/verify/[id]` shows it. **End-to-end write+read on-chain works. Commit.**

> ⚠️ If M1 slips past hr 16, cut scope — freeze registration UI polish, move on. M2 is the heart.

---

## PHASE 2 — Multi-Sig Transfer Workflow (Hours 14–24)

**Goal:** the 3-signature transfer — the product's soul — works fully on-chain.

### Dev A — Chain
- [ ] Finalize `initiateTransfer`, `buyerApprove`, `registrarFinalize`, `rejectTransfer` + transfer-lock overrides.
- [ ] Tests: happy path, double-sale revert, non-registrar finalize revert, direct `transferFrom` revert.
- [ ] `lib/chain.ts` wrappers + `getTransfer(id)`, `activeTransferOf(parcelId)`.
- [ ] Indexer handles `TransferInitiated/Approved/Completed/Rejected` → `TransferMeta` + audit.

### Dev B — Frontend
- [ ] **Seller → Initiate Transfer**: pick parcel, enter buyer wallet, upload new deed, sign tx.
- [ ] **Buyer → Approvals**: pending incoming transfers → "Review & Sign" → buyer approve tx.
- [ ] **Registrar → Transfer Queue**: pending-registrar transfers → doc review → "Finalize" tx.
- [ ] **Transfer status stepper** (Draft → Buyer → Registrar → Completed) shown to all parties.

### Dev C — Intelligence + Glue
- [ ] `/api/transfers` (by user/role), status mirroring after each tx.
- [ ] Wire the 3 MetaMask accounts so the flow can be driven end-to-end in one machine.
- [ ] Start **fraud rules stub**: `OWNERSHIP_MISMATCH`, `DOUBLE_SALE` detection functions (surface in Phase 3).

**🏁 M2 (hr 24):** Seller initiates → buyer signs → registrar finalizes → **ownership moves on-chain**, timeline updates. This is a demoable product. **Commit + tag `mvp`.**

> 🎯 At M2 you already have a winning-*enough* demo. Everything after is amplification. Breathe.

---

## PHASE 3 — Wow Features (Hours 24–38)

**Goal:** the 3 things judges remember. Build in this priority order; each is independently shippable.

### 3A — QR Public Verification (highest ROI, do first) · Dev B + C
- [ ] Full **/verify/[id]** page: current owner, parcel details, **full ownership history** from chain events, doc-integrity badge, official/verified styling.
- [ ] Generate **QR** (`qrcode`) pointing to `NEXT_PUBLIC_APP_URL/verify/[id]`; show on parcel detail + printable.
- [ ] Public **search** by survey number/district.
- [ ] "Download Title Certificate" PDF (QR + on-chain proof ref).

### 3B — AI Forgery Detection · Dev C + A
- [ ] `lib/ai.ts`: Claude vision call → structured integrity report (prompt in [PROMPTS.md](PROMPTS.md#ai-forgery-prompt)).
- [ ] `/api/ai/verify-doc`: upload → sha256 + on-chain hash compare + AI report → store on `Document.aiReport`.
- [ ] Registrar review screen shows the **Integrity Report** (risk score, verdict, reasons); **block finalize** on LIKELY_FORGED (with override + logged reason).
- [ ] Prepare the **two demo deeds** (clean + tampered) and **cache** the tampered report for reliability.

### 3C — Fraud War-Room + Map · Dev C + B
- [ ] `lib/fraud.ts` rules engine (double-sale, mismatch, rapid-flip, forged-doc) → writes `FraudAlert`.
- [ ] **Registrar dashboard**: live alert feed via **Supabase Realtime**; KPI tiles.
- [ ] **Leaflet district map**: parcels as green/amber/red markers; click → parcel/transfer.
- [ ] Trigger path: a second account attempting a double-sale → red alert appears live.

**🏁 M3 (hr 38):** all 3 wow moments work in isolation and can be triggered on demand. **Commit + tag `wow`.**

> ⚠️ Triage: if time is tight, ship in this order — **QR verify > Fraud war-room > AI forgery**. QR verify is the single most memorable moment and lowest risk. Drop the map before dropping QR verify.

---

## PHASE 4 — Polish · Seed · Demo Hardening (Hours 38–46)

**Goal:** make it feel like a real government product and bulletproof the demo.

- [ ] **Seed a rich, believable world**: 10–15 parcels across real districts, a few completed transfers (so history looks lived-in), 1 pre-flagged fraud, the demo forged doc.
- [ ] **Demo happy-path rehearsal**: run the exact [DEMO_SCRIPT.md](DEMO_SCRIPT.md) flow start-to-finish 3× and fix every snag.
- [ ] **Error/empty/loading states** on every screen; friendly failures (no raw stack traces on stage).
- [ ] **Visual polish pass**: consistent spacing, govt-seal styling on verify, animated confirmations, mobile check for the QR scan.
- [ ] **Fallbacks:** cached AI report, pre-seeded alert, "reset demo" script to restore clean state between judge visits.
- [ ] **Deploy web to Vercel** (chain stays local) so the QR opens on a judge's phone → point QR at the Vercel URL + a tunnel (e.g. ngrok) to your local chain read API, OR keep verify reads served from a small hosted mirror. Decide + test early.
- [ ] Record a **90-sec backup demo video** in case live fails catastrophically.

**🏁 M4 (hr 46):** rehearsed, polished, zero-crash demo with fallbacks. **Commit + tag `demo-ready`.**

---

## PHASE 5 — Pitch Prep + Buffer (Hours 46–48)

- [ ] Finalize **pitch deck** (problem → solution → live demo → impact → tech → roadmap). ~8 slides.
- [ ] Assign speaking roles: 1 narrator (story), 1 driver (demo), 1 backup (Q&A/tech depth).
- [ ] Rehearse the **5-min script** + the **60-sec elevator** version.
- [ ] Prep **Q&A defense** (see [DEMO_SCRIPT.md](DEMO_SCRIPT.md) Q&A section): "why not just a database?", "is it really permissioned?", "how does this scale?".
- [ ] Final commit + push. Charge laptops. Water. Deep breath.

**🏁 M5 (hr 48): Ship it. Win it.**

---

## Contingency / cut-lines (decide fast under pressure)

| If you're behind at… | Cut this | Keep this (non-negotiable) |
|----------------------|----------|----------------------------|
| M1 (hr 14) | Registration UI polish, PDF cert | On-chain register + verify |
| M2 (hr 24) | Reject-flow UI, audit log UI | 3-sig transfer happy path |
| M3 (hr 38) | Map, rapid-flip rule, admin UI | QR verify + one wow (fraud or AI) |
| M4 (hr 46) | Vercel/phone QR, backup video | Local zero-crash rehearsed demo |

**Never cut:** the register→sign→transfer→verify loop, and at least ONE wow moment fully working.

---

## Definition of Done (per feature)
1. Works end-to-end on a fresh clone with seed data.
2. Has a loading + error + empty state.
3. Appears in the demo script OR is explicitly deferred.
4. Committed and pushed.

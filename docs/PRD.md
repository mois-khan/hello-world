# Product Requirements Document — BhoomiChain

**Version:** 1.0 · **Domain:** Government · **Event:** Digital India Hackathon (SNIST)
**Status:** Approved for build · **Owner:** Team of 3

---

## 1. Vision

Create a single, trusted, tamper-evident digital source of truth for land ownership in India — where every transfer is cryptographically signed by all parties, permanently recorded on a permissioned blockchain, validated by smart contracts, and instantly verifiable by any citizen.

> **Tagline options:** "One Nation, One Land Ledger" · "The Immutable Truth of Land Ownership" · "Trust, Verified on Chain."

---

## 2. Problem statement (the "why now")

| Pain | Consequence | Evidence to quote to judges |
|------|-------------|------------------------------|
| 6.2 crore+ undigitised land records | No queryable source of truth | Problem statement |
| Fragmented records across silos | Same land claimed by multiple owners | Land disputes = ~66% of civil cases (NITI Aayog / widely cited) |
| Manual verification | Weeks of delay, bribery surface area | Registrar bottlenecks |
| Document forgery | Fraudulent sales, litigation for years | Forged deeds, double-sales |
| No single trusted owner-of-record | Buyers can't trust what they buy | Uncertainty for citizens + businesses |

**Framing for the pitch:** land disputes clog courts for *years* and destroy citizen trust. The root cause isn't lack of digitisation alone — it's the lack of a *tamper-evident, shared* source of truth. Blockchain is the one technology purpose-built for exactly that.

---

## 3. Goals & success metrics

### Product goals
- **G1** — Record land ownership immutably; make history auditable end-to-end.
- **G2** — Require multi-party cryptographic signatures (buyer + seller + registrar) for every transfer.
- **G3** — Enable instant, public, login-free ownership verification.
- **G4** — Detect document forgery *before* records are written.
- **G5** — Surface fraud/anomalies (double-sale) to registrars in real time.

### Hackathon success metrics (what "winning" looks like)
- ✅ A judge scans a QR and sees verified ownership **in under 5 seconds**.
- ✅ A live transfer is signed by 3 wallets and finalized on-chain **during the demo**.
- ✅ A forged document is **caught red** by the AI report on stage.
- ✅ A double-sale attempt triggers a **live fraud alert** on the registrar dashboard.
- ✅ Zero crashes during the 5-minute demo (rehearsed + seeded + fallback).

### Non-goals for the hackathon (explicitly out of scope — protect your time)
- ❌ Real Aadhaar/DigiLocker integration (we mock identity).
- ❌ Production-grade Hyperledger Fabric network (we simulate permissioning via on-chain roles).
- ❌ Real land-survey/GIS integration (we use representative coordinates).
- ❌ Payments/stamp-duty settlement (mention as roadmap only).
- ❌ Mobile native apps (responsive web is enough).

---

## 4. Personas

| Persona | Who | Primary needs | Key screens |
|---------|-----|---------------|-------------|
| **Priya — Citizen (Seller)** | Property owner selling land | Prove ownership, initiate transfer, e-sign | Citizen portal → My Parcels, Initiate Transfer |
| **Arjun — Citizen (Buyer)** | Purchasing property | Verify what he's buying, e-sign, receive title | Public Verify, Citizen portal → Approvals |
| **Registrar Rao — Govt Officer** | Sub-registrar authorizing transfers | Review docs, catch fraud, finalize on-chain | Registrar dashboard, Fraud war-room |
| **Verifier — Any Citizen / Bank / Court** | Anyone verifying ownership | Confirm current owner + history, no login | Public Verify (QR / search) |
| **Admin — State Govt** | Assigns registrar authority | Grant/revoke registrar role | Admin panel |

---

## 5. Functional requirements

### 5.1 Identity & roles (M — must)
- FR-1: Users connect a wallet (MetaMask). Wallet address = on-chain identity.
- FR-2: Off-chain profile (name, masked Aadhaar-style ID, role) linked to wallet.
- FR-3: Roles enforced **on-chain** via OpenZeppelin `AccessControl`: `DEFAULT_ADMIN_ROLE` (govt), `REGISTRAR_ROLE`. Citizens are any address.
- FR-4: Admin can grant/revoke `REGISTRAR_ROLE`.

### 5.2 Parcel registration (M)
- FR-5: Registrar registers a new land parcel: survey number, district, coordinates, area, owner wallet, and the ownership document.
- FR-6: Document is hashed (SHA-256); **only the hash + metadata go on-chain**, the file goes to off-chain storage.
- FR-7: Each parcel is minted as an **ERC-721 token** (tokenId = parcelId); the token owner = the legal owner.
- FR-8: Direct ERC-721 transfers are **blocked** — ownership can only move through the approved transfer workflow (§5.3).
- FR-9: `ParcelRegistered` event emitted; parcel visible in public verify.

### 5.3 Multi-signature transfer workflow (M — the heart of the product)
A transfer is a 3-of-3 approval state machine on-chain:

```
DRAFT ─(seller initiates)→ PENDING_BUYER ─(buyer approves)→ PENDING_REGISTRAR
      ─(registrar finalizes)→ COMPLETED
      any party → REJECTED
```

- FR-10: **Seller** initiates transfer for a parcel they own, naming the buyer wallet + attaching the new deed (hashed).
- FR-11: **Buyer** reviews and cryptographically approves (wallet signature → on-chain tx).
- FR-12: **Registrar** reviews documents + fraud flags, then finalizes → token ownership transfers atomically on-chain.
- FR-13: Any party can reject with a reason; state → `REJECTED`.
- FR-14: Every state change emits an event → full immutable audit trail.
- FR-15: A parcel with an active transfer **cannot** start a second one (prevents double-sale at contract level).

### 5.4 Public verification (M — wow #1)
- FR-16: Every parcel has a public URL `/verify/[parcelId]` + a QR encoding it.
- FR-17: Verify page (no login) reads **directly from chain**: current owner, parcel details, full ownership history (from events), and document-integrity status.
- FR-18: Public search by survey number / district.
- FR-19: "Download Title Certificate" (PDF) with QR + on-chain proof reference.

### 5.5 AI document forgery detection (M — wow #2)
- FR-20: On any document upload, run a **Document Integrity Report**:
  - (a) **Cryptographic:** compute SHA-256; compare against on-chain hash if one exists → binary tamper proof.
  - (b) **AI forensic:** Claude vision analyzes the image for forgery signals (font/kerning inconsistency, digital-edit artifacts, mismatched seals/stamps, altered numerals, misaligned text) → **risk score (0–100) + human-readable reasons**.
- FR-21: High-risk documents are **blocked** from being finalized on-chain (registrar override with logged justification).
- FR-22: Report is stored and shown to the registrar during review.

### 5.6 Fraud / anomaly engine (M — wow #3)
- FR-23: Rules engine flags: **double-sale** (parcel in 2 pending transfers), **ownership mismatch** (initiator ≠ on-chain owner), **rapid re-transfer** (flip < N days), **forged-doc** (from §5.5).
- FR-24: Registrar dashboard shows live alerts (Supabase Realtime) + a **district map** (Leaflet) with parcels colored by status (green=clean, amber=pending, red=flagged).
- FR-25: Each alert links to the parcel + the offending transfer for one-click action.

### 5.7 Audit & history (M)
- FR-26: Every on-chain event is indexed and shown as a human-readable timeline per parcel.
- FR-27: Off-chain audit log records who did what, when (for actions that don't hit the chain).

---

## 6. Non-functional requirements

| # | Requirement | Target |
|---|-------------|--------|
| NFR-1 | Verify page load | < 2s |
| NFR-2 | On-chain tx confirmation (local node) | near-instant |
| NFR-3 | AI forgery report | < 8s |
| NFR-4 | Demo reliability | zero crashes; seeded + fallback data |
| NFR-5 | Security | private keys never in frontend bundle; registrar actions role-gated on-chain |
| NFR-6 | Accessibility | responsive, works on a phone (for the QR scan moment) |
| NFR-7 | Auditability | 100% of ownership changes traceable to signed txs |

---

## 7. Feature priority (MoSCoW) — build in this order

| Priority | Features |
|----------|----------|
| **Must (MVP)** | Roles, parcel registration, multi-sig transfer, public QR verify, chain history |
| **Should (wow)** | AI forgery report, fraud engine + map, live alerts |
| **Could (polish)** | Title certificate PDF, public search, admin role UI, analytics tiles |
| **Won't (roadmap)** | Real DigiLocker, Fabric network, stamp-duty payments, GIS, mobile app |

> **Rule:** nothing in "Should" starts until every "Must" works end-to-end and is demo-able. See [PHASE_WISE_PLAN.md](PHASE_WISE_PLAN.md).

---

## 8. Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Blockchain unfamiliarity eats time | High | Start from Hardhat + OpenZeppelin templates; contract skeleton in Phase 0; prompts in [PROMPTS.md](PROMPTS.md) |
| MetaMask fumbling on stage | Med | Pre-import 3 Hardhat accounts; rehearse; fallback "one-click sign" backend path |
| AI API latency/failure in demo | Med | Cache a pre-computed report for the demo doc; show cryptographic hash proof as primary, AI as secondary |
| Scope creep | High | MoSCoW discipline; "Should" gated behind working "Must" |
| Live-demo network flake | Med | Everything runs on **local** Hardhat node; no dependence on public testnet |
| Data looks fake to judges | Med | Seed realistic Indian districts, survey numbers, names, coordinates |

---

## 9. What makes this a *winning* PRD (judging alignment)

Government-domain hackathons typically score on: **Impact · Innovation · Feasibility · Completeness · Presentation.**

- **Impact** → quantified problem (6.2 cr records, 66% of civil cases), citizen + govt + business beneficiaries.
- **Innovation** → not "just blockchain": AI forgery gate + real-time fraud war-room + hash-anchored integrity.
- **Feasibility** → working local chain, honest permissioned-via-roles framing, clear roadmap to Fabric/DigiLocker.
- **Completeness** → end-to-end flow: register → sign → transfer → verify, all live.
- **Presentation** → the 3 wow moments + a rehearsed 5-min script ([DEMO_SCRIPT.md](DEMO_SCRIPT.md)).

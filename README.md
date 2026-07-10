# 🏛️ BhoomiChain — The Immutable Truth of Land Ownership

> A blockchain-based, tamper-evident land registry for India.
> Built for the **Digital India Hackathon** (Government domain) — Srinidhi Institute (SNIST).

**Team:** 3 developers · **Build window:** 48 hours · **Goal:** Win. And be unforgettable.

---

## The one-line pitch (memorize this)

> *"India has 6.2 crore undigitised land records and land disputes are the single largest source of civil litigation. BhoomiChain turns every property into a cryptographically-signed, tamper-proof record that any citizen can verify in 5 seconds by scanning a QR code — while AI catches forged documents **before** they ever poison the ledger."*

## Why judges will remember us (the 3 wow moments)

1. **"Hand the judge your phone."** Scan a QR sticker on a property → instantly see the verified owner + full immutable ownership history, straight from the blockchain, no login. (→ [QR Verification](docs/DESIGN.md#7-qr-public-verification-flow))
2. **"Watch AI catch a forgery live."** Upload a tampered sale deed → AI forensic report flags it red **before** it reaches the chain, and the document's SHA-256 hash makes any future tampering mathematically impossible to hide. (→ [AI Forgery Detection](docs/DESIGN.md#8-ai-document-forgery-detection))
3. **"The registrar's war room."** A live fraud dashboard lights up in real time when someone tries to sell the same plot twice (double-sale), with a district map of flagged parcels. (→ [Fraud Engine](docs/DESIGN.md#9-fraud--anomaly-engine))

---

## 📚 Documentation map — read in this order

| # | Document | What it gives you |
|---|----------|-------------------|
| 1 | **[PRD.md](docs/PRD.md)** | Product vision, personas, every feature spec, success metrics, scope guardrails |
| 2 | **[DESIGN.md](docs/DESIGN.md)** | Full technical architecture, smart contracts, data models, APIs, security, folder structure |
| 3 | **[PHASE_WISE_PLAN.md](docs/PHASE_WISE_PLAN.md)** | Hour-by-hour 48h plan, 3-person parallel tracks, milestones, checkpoints |
| 4 | **[PROMPTS.md](docs/PROMPTS.md)** | Copy-paste build prompts for every phase & task (for Claude Code / Cursor) |
| 5 | **[DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)** | The 5-minute judge walkthrough, pitch narrative, and Q&A defense |

---

## Tech stack at a glance

```
Frontend    Next.js 14 (App Router) · React · TailwindCSS · shadcn/ui · Leaflet (maps)
Chain       Solidity ^0.8.24 · Hardhat · OpenZeppelin (AccessControl + ERC-721) · ethers.js v6
Wallet      MetaMask (pre-funded Hardhat accounts for buyer/seller/registrar)
Backend     Next.js API routes · Prisma
Data        PostgreSQL (Supabase — DB + Storage + Realtime) · SHA-256 doc hashing
AI          Claude vision API (forgery forensic report) + cryptographic hash integrity
Infra       Hardhat local node · Vercel (frontend) · Supabase (data)
```

## Repo layout (target)

```
bhoomichain/
├── contracts/          # Solidity smart contracts + Hardhat
├── web/                # Next.js app (citizen portal + registrar dashboard + public verify)
├── docs/               # ← you are here
└── scripts/            # seed data, deploy, demo helpers
```

## Quick start (once built)

```bash
# 1. Chain
cd contracts && npm i && npx hardhat node          # terminal 1
npx hardhat run scripts/deploy.js --network localhost   # terminal 2

# 2. Web
cd web && npm i && npm run dev                      # terminal 3 → localhost:3000

# 3. Seed realistic Indian demo data
npm run seed
```

---

**North star:** every decision optimizes for a *working, polished, verifiable demo* over feature count. A judge who can touch it and verify it beats a slide deck every time.

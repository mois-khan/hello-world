# 🚀 KICKOFF — Scaffold the Repo at Hour 0 (run this AT the hackathon)

> **Purpose:** get from an empty folder → a repo that **compiles and runs empty** (Milestone **M0**) in ~2–3 hours,
> with all 3 devs working in parallel. This is a *runbook you execute on-site* — no code is pre-written.
>
> **Before any command:** open [docs/INTERFACE_CONTRACT.md](docs/INTERFACE_CONTRACT.md) — every name below comes from it.
> Paste the [Universal Primer](handouts/BUILD_PLAYBOOK.pdf) at the top of every AI agent prompt.

---

## ⏱️ Pre-flight (10 min, everyone)

- [ ] Node 20+, Git, MetaMask installed (`node -v`, `git --version`)
- [ ] `.env.local` values ready from the **[Setup PDF](handouts/SETUP_CREDENTIALS.pdf)** (Supabase ×4, `ANTHROPIC_API_KEY`)
- [ ] GitHub repo `bhoomichain` created, all 3 added, everyone cloned it
- [ ] Copy the `docs/` folder into the repo so agents can read the specs
- [ ] Agree: **Dev A = Chain**, **Dev B = Frontend**, **Dev C = Intelligence+Glue** (see [PARALLEL_WORKFLOW.md](docs/PARALLEL_WORKFLOW.md) §1)

> **Parallel from here.** The 3 tracks below run at the same time. Dev C does **Step C1 (types) FIRST** — A and B import from it.

---

## 🟣 TRACK A — Chain (Dev A)

### A1 · Init Hardhat
```bash
mkdir contracts && cd contracts
npm init -y
npm i --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init          # choose: JavaScript project, add .gitignore
npm i @openzeppelin/contracts
```

### A2 · Create the contract (agent prompt)
> **Primer +** "Create `contracts/contracts/LandRegistry.sol` **exactly** as specified in `docs/DESIGN.md` §3.1 (ERC-721 + AccessControl, `REGISTRAR_ROLE`, `Parcel` + `TransferRequest` structs, `ParcelStatus`/`TransferStatus` enums, functions `registerParcel`/`initiateTransfer`/`buyerApprove`/`registrarFinalize`/`rejectTransfer`, the transfer-lock overrides, and all 5 events). Match `docs/INTERFACE_CONTRACT.md` §2 names exactly. Then make it compile with `npx hardhat compile`. Do not add anything beyond the spec."

**Look for:** `npx hardhat compile` succeeds with no errors.

### A3 · Deploy script + ABI export (agent prompt)
> **Primer +** "Create `contracts/scripts/deploy.js` that deploys `LandRegistry` to the localhost network and prints the address. After compiling, copy the ABI to `web/lib/contract-abi.json`. Add npm scripts `node` (hardhat node) and `deploy` (deploy to localhost). Follow `docs/PROMPTS.md` P0.2."

```bash
# terminal 1
npx hardhat node
# terminal 2
npx hardhat run scripts/deploy.js --network localhost   # note the printed address → goes in web/.env.local
```

**Look for:** node runs, deploy prints a contract address, `web/lib/contract-abi.json` exists.

### A4 · Chain lib stub
> **Primer +** "Create `web/lib/chain.ts` implementing the function signatures in `docs/INTERFACE_CONTRACT.md` §7 (`getProvider`, `getContract`, `registerParcel`, `initiateTransfer`, `buyerApprove`, `registrarFinalize`, `rejectTransfer`, `getParcel`, `ownerOf`, `getTransfer`, `activeTransferOf`, `isRegistrar`, `getHistory`). Use ethers v6, read RPC from `NEXT_PUBLIC_CHAIN_RPC` and address from `NEXT_PUBLIC_CONTRACT_ADDRESS`, and `web/lib/contract-abi.json`. Import types from `@/lib/types`. Stub bodies are fine for now but keep exact signatures."

---

## 🔵 TRACK B — Frontend (Dev B)

### B1 · Create the Next.js app
```bash
npx create-next-app@latest web --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*"
cd web
npx shadcn@latest init          # choose defaults / Slate base color
npx shadcn@latest add card button badge dialog table tabs sonner input label skeleton drawer
npm i ethers@6 qrcode leaflet react-leaflet
```

### B2 · Design system + app shell (agent prompt)
> **Primer +** "Set up the design system from `docs/DESIGN.md` §10: color tokens (indigo `#1E3A8A` primary, saffron `#F59E0B` accent, green `#16A34A` verified, red `#DC2626` alert) in the Tailwind config + globals, Inter font, and an app shell with a top nav + `WalletButton`. Build a landing page (`/`) with the one-line pitch from `README.md`. Official but modern — 'Digital India, but beautiful'."

### B3 · Stub every route (agent prompt)
> **Primer +** "Create stub pages (each just a heading + 'coming soon') for every route in `docs/INTERFACE_CONTRACT.md` §8: `/verify`, `/verify/[id]`, `/portal/parcels`, `/portal/transfer`, `/portal/approvals`, `/dashboard`, `/dashboard/register`, `/dashboard/transfers`, `/admin`. Use the App Router folder structure. They must all load without errors."

**Look for:** `npm run dev` → every route opens, nav works, wallet connect button renders.

---

## 🟢 TRACK C — Intelligence + Glue (Dev C) — **do C1 first, everyone waits on it**

### C1 · Shared types (DO THIS FIRST — A & B import from it)
> **Primer +** "Create `web/lib/types.ts` containing **exactly** the TypeScript types in `docs/INTERFACE_CONTRACT.md` §3 (`Role`, `ParcelStatus`, `TransferStatus`, `Parcel`, `ParcelMeta`, `TransferRequest`, `AiReport`, `FraudType`, `Severity`, `FraudAlert`, `UploadResult`, `TimelineEvent`). Copy them verbatim — do not change field names or add fields. Export all."

📣 **Announce in team chat when `lib/types.ts` is pushed** → A and B pull immediately.

### C2 · Prisma + Supabase
```bash
cd web
npm i @prisma/client @supabase/supabase-js
npm i -D prisma
npx prisma init
```
> **Primer +** "Fill `web/prisma/schema.prisma` with the models in `docs/DESIGN.md` §4 (`User`, `ParcelMeta`, `Document`, `TransferMeta`, `FraudAlert`, `AuditLog`) and enums matching `docs/INTERFACE_CONTRACT.md` §4. Set the datasource to `env(\"DATABASE_URL\")`. Then create `web/lib/supabase.ts` (browser client + server service-role client), `web/lib/hash.ts` (`sha256` → `0x`-prefixed hex), and `web/lib/wallet.ts` (`connectWallet`, `getConnectedAddress`, `ensureCorrectNetwork` for chainId 31337) per §7."

```bash
npx prisma migrate dev --name init
```
Then in Supabase dashboard: create the **`documents`** storage bucket (public). Record the real `FraudAlert` table name in `INTERFACE_CONTRACT.md` §4.

### C3 · Stub all API routes (agent prompt)
> **Primer +** "Create stub Next.js route handlers for EVERY endpoint in `docs/INTERFACE_CONTRACT.md` §6: `POST /api/upload`, `POST /api/ai/verify-doc`, `GET+POST /api/parcels`, `GET /api/parcels/[id]`, `GET /api/transfers`, `POST /api/transfers/mirror`, `GET /api/fraud`, `POST /api/fraud/scan`, `GET /api/certificate/[id]`, `POST /api/sync`. Each returns the correct typed shape as **mock data** wrapped in `{ ok: true, data }`. Import types from `@/lib/types`. This lets Dev B build against real endpoints immediately."

### C4 · env wiring
> **Primer +** "Create `web/.env.local.example` with every var from `docs/INTERFACE_CONTRACT.md` §5 (exact names)." Then everyone copies it to `web/.env.local` and fills values from the Setup PDF + the deployed contract address from A3.

---

## 🏁 M0 — Integration smoke test (all 3 together, ~15 min)

Run this together on `main` after merging the three tracks:

```bash
# 1. Chain
cd contracts && npx hardhat node            # terminal 1
npx hardhat run scripts/deploy.js --network localhost   # terminal 2 → paste address into web/.env.local
# 2. Web
cd web && npm run dev                        # terminal 3
```

**M0 is GREEN when:**
- [ ] Contract compiled + deployed; address in `web/.env.local`
- [ ] `web/lib/contract-abi.json` present
- [ ] `web/lib/types.ts` exists and A/B/C all import from it (nobody redefined a type)
- [ ] `npm run dev` loads every route from §8 with no console errors
- [ ] MetaMask connects on chainId `31337`
- [ ] `prisma migrate` done; `documents` bucket created
- [ ] Every `/api/*` stub returns `{ ok, data }` with the right shape
- [ ] Env var names match §5 exactly

✅ **Commit + push + tag `m0`.** You're now build-ready → proceed to **Phase 1** in [PHASE_WISE_PLAN.md](docs/PHASE_WISE_PLAN.md), guided by [BUILD_PLAYBOOK.pdf](handouts/BUILD_PLAYBOOK.pdf).

---

## 🚩 Drift check before you tag m0 (30 sec)
- No local `interface Parcel {…}` anywhere → everyone imports from `@/lib/types`
- No renamed endpoints (`/api/getParcels` ❌ → `GET /api/parcels` ✅)
- No renamed env vars (`SUPABASE_KEY` ❌ → `SUPABASE_SERVICE_ROLE_KEY` ✅)
- No `survey_no` / `surveyNo` ❌ → `surveyNumber` ✅
- All responses use `{ ok, data }` / `{ ok, error }`

> The whole point of M0: prove all three tracks fit together **while there's nothing to lose**. If M0 is green, the rest is just filling in bodies behind stable seams.

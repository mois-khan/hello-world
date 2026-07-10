# 👥 Parallel Workflow — How 3 Devs Build Without Colliding

Pairs with [PHASE_WISE_PLAN.md](PHASE_WISE_PLAN.md) (what to build when) and
[INTERFACE_CONTRACT.md](INTERFACE_CONTRACT.md) (the shared names that keep your code compatible).

> **The whole trick:** agree on the *seams* (§ Interface Contract) up front, then each person builds behind their
> seam without waiting on the others. Integrate every few hours, not at the end.

---

## 1. Ownership map (who owns what — minimize overlap)

| | **Dev A — Chain** | **Dev B — Frontend** | **Dev C — Intelligence + Glue** |
|---|---|---|---|
| **Owns folders** | `contracts/**`, `web/lib/chain.ts`, `web/lib/indexer.ts`, `web/lib/contract-abi.json` | `web/app/**` (pages/UI), `web/components/**` | `web/app/api/**`, `web/lib/{ai,fraud,hash,supabase,wallet}.ts`, `web/prisma/**`, seed scripts |
| **Owns** | Smart contract, deploy, ABI, chain reads/writes, event indexer, tests | All screens, design system, components, wiring UI → lib | DB, all APIs, AI forgery, fraud engine, storage, QR/PDF, seed data, deploy |
| **Depends on** | nothing (starts first) | `lib/chain.ts` (A) + APIs (C) — but codes against the **contract** until they land | `lib/chain.ts` (A) for indexer |
| **Provides to others** | `getContract`, chain wrappers, ABI, deployed address | reusable components | APIs, types, DB, `lib/*` helpers |

**Rule:** you may *read* anyone's files; you may only *edit* files you own. Need a change in someone else's file? Ask them, or open a tiny PR they review.

---

## 2. Work against the contract, not against each other (no blocking)

You do **not** wait for a teammate's real code. You code against [INTERFACE_CONTRACT.md](INTERFACE_CONTRACT.md) and stub the rest:

- **Dev B** builds screens against the typed API shapes using **mock data** (`web/lib/mocks.ts`) until Dev C's real endpoints land. Swap mock → real by flipping one flag. The UI never blocks on the backend.
- **Dev C** builds APIs returning the exact `{ ok, data }` shapes; tests with `curl`/Thunder Client before any UI exists.
- **Dev A** ships `lib/chain.ts` wrappers early (even returning fake data first), so B/C import a stable interface while the contract firms up.

> Because everyone targets the *same frozen names/shapes*, the mock and the real thing are drop-in interchangeable. That's the point of the contract file.

---

## 3. Git workflow (lightweight, conflict-averse)

```
main            ← always working/demo-able. Protected. Only merge green code.
├─ chain/*      ← Dev A branches
├─ ui/*         ← Dev B branches
└─ api/*        ← Dev C branches
```

- **Branch naming:** `chain/transfer-workflow`, `ui/registrar-queue`, `api/fraud-engine`.
- **Small, frequent commits.** Push at least every 1–2 hours.
- **Merge to `main` at every milestone** (M0–M5) and whenever a feature is DONE + tested. Pull `main` before you start each new task.
- **PRs optional but fast:** a 60-second glance is enough; velocity > ceremony. But NEVER merge red (broken build) code to `main`.
- **One person = "integration lead" per merge window** (rotate) to resolve any conflicts quickly.

### Conflict-proofing habits
1. **Never edit `INTERFACE_CONTRACT.md`, `prisma/schema.prisma`, or `.env.local.example` casually** — these are shared. Announce, then change, in one commit.
2. **Keep `.env.local` out of git** (it's in `.gitignore`); share secrets via the team chat / the Setup PDF, not the repo.
3. **`contract-abi.json` regenerates** when the contract changes — Dev A owns regenerating + committing it, then pings B/C to pull.
4. **Don't reformat files you don't own** (no repo-wide prettier runs mid-hackathon — it creates giant fake diffs).

---

## 4. The daily/shift cadence (48h)

| When | 15-min sync — answer 3 questions each |
|------|----------------------------------------|
| Hour 0 | Kickoff: confirm the contract file, assign Phase 0 tasks |
| Every ~4–6 hrs / each milestone | "What did I finish? What am I blocked on? Did I change any shared name?" |
| Before sleep shift | Handoff note in chat: branch state + next task |
| Hour 46 | Freeze features; only bugfix + polish + rehearse |

**Blocked > 20 min?** Say it out loud immediately. In a 48h sprint, silent blockers are the enemy.

---

## 5. Using AI agents in parallel (critical — this is how you avoid agent drift)

You'll each run Claude Code / Cursor on your own track. To stop three agents from inventing three different `Parcel`
types or three spellings of an endpoint:

1. **Every agent prompt starts with the same primer** (from [PROMPTS.md](PROMPTS.md)) **plus this line:**
   > *"Strictly follow `docs/INTERFACE_CONTRACT.md` for all names, endpoints, env vars, types, and data shapes. Do not invent or rename anything defined there. Import shared types from `web/lib/types.ts`."*
2. **Point the agent at the contract file explicitly:** "Read `docs/INTERFACE_CONTRACT.md` §6 before writing this API."
3. **Scope each agent to its owner's folders** — tell it which directories it may edit (from §1 above).
4. **One task per agent run.** Big multi-file agent runs cause the most drift and conflicts.
5. **After an agent run, grep for drift:** did it create a new type instead of importing? a new env var name? Fix immediately.
6. **Shared types are defined once** in `web/lib/types.ts` (Dev C creates it first, hour 0–1). Everyone imports; nobody redefines.

> Think of `INTERFACE_CONTRACT.md` as the "system prompt" all three of your agents share. Same contract in → compatible code out.

---

## 6. Integration test ritual (do this at every milestone)

A 5-minute smoke test the team runs together on `main`:
1. Fresh pull, `npm i` where needed, `npm run demo:reset`.
2. Hardhat node up, contract deployed, address in `.env`.
3. Register a parcel (A+B+C paths) → appears in portal → shows on `/verify/[id]`.
4. Run one transfer end-to-end.
5. If any step breaks → that's the top priority before anyone starts new work.

Green smoke test = you always have a demo, no matter what happens next.

---

## 7. Quick reference — "who do I ask?"

| I need… | Ask |
|--------|-----|
| A new contract function / event | **Dev A** (then update Contract file §2) |
| A new API endpoint / DB field | **Dev C** (then update Contract file §4/§6) |
| A shared component / route | **Dev B** (then update Contract file §8) |
| A new env var | Whoever needs it → add to Contract §5 + `.env.local.example` → tell everyone |
| A new shared type | **Dev C** adds to `lib/types.ts` → announce |

**Golden rule again:** change the [INTERFACE_CONTRACT.md](INTERFACE_CONTRACT.md) *first*, code *second*, and *tell the team*. Do that, and three people build like one.

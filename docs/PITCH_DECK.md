# 🎤 Pitch Deck — BhoomiChain (8 slides)

**Total pitch: ~7 min** (≈2 min slides framing + ~5 min live demo woven in). Pairs with [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
Design: minimal text, one big idea per slide, bold visuals. Palette: indigo `#1E3A8A` + saffron `#F59E0B` + green `#16A34A`.
Speaking roles: **Narrator** (story) · **Driver** (demo) · **Backup** (Q&A).

> Rule: slides are a *backdrop*, not a script. The **live product is the star** — slides 4–6 mostly cue the demo.

---

## SLIDE 1 — Hook / Title  ·  ~20s  ·  *Narrator*

**On screen:**
- Logo + **BhoomiChain**
- Tagline: *"The Immutable Truth of Land Ownership"*
- Sub: Blockchain Land Registry · Digital India Hackathon · Government Domain
- One subtle visual: a land parcel → a chain link → a green verified shield

**Say:**
> "What if any citizen could prove who owns a piece of land — in 5 seconds, with zero chance of forgery? That's BhoomiChain."

**Speaker note:** Open with energy. Don't read the tagline — say the hook question.

---

## SLIDE 2 — The Problem  ·  ~40s  ·  *Narrator*

**On screen (3 big numbers, nothing else):**
- **6.2 crore** undigitised land records
- **~66%** of civil court cases are land disputes
- **Years** — how long a single dispute can take

Small caption: *Fragmented records · manual verification · document forgery · no single source of truth*

**Say:**
> "India has 6.2 crore undigitised land records. Land disputes are the single largest source of civil litigation — cases drag on for *years*. The root cause isn't just paperwork — it's that there's **no tamper-proof, shared source of truth** for who owns what."

**Speaker note:** Let the numbers land. Pause after "years."

---

## SLIDE 3 — The Insight + Solution  ·  ~30s  ·  *Narrator*

**On screen:**
- Left: "A database has an admin who can *quietly edit* records." (❌)
- Right: "A blockchain makes history *append-only* and *verifiable by anyone*." (✅)
- Bottom band: **Permissioned blockchain + multi-party signatures + smart-contract validation**

**Say:**
> "Blockchain is the one technology built for exactly this. On BhoomiChain, every land transfer is **cryptographically signed by the buyer, the seller, AND a government registrar**, validated by a smart contract, and recorded permanently. No one — not even an official — can secretly rewrite history."

**Speaker note:** This slide pre-answers the #1 judge question ("why not just a database?"). Say it with conviction.

---

## SLIDE 4 — Live Demo Cue  ·  DEMO ~5 min  ·  *Driver takes over*

**On screen (kept up during the demo):**
- Big text: **"Let's see it live."**
- A thin 3-step strip judges can follow: **① Verify (QR)  →  ② Transfer (3 signatures)  →  ③ Fraud caught (AI + alerts)**

**Do (from [DEMO_SCRIPT.md](DEMO_SCRIPT.md)):**
1. **QR verify** — hand a judge your phone, they scan → verified owner + full on-chain history, no login.
2. **3-signature transfer** — seller initiates → buyer approves → registrar finalizes (3 real MetaMask signatures) → ownership moves on-chain.
3. **AI forgery catch** — upload the tampered deed → hash mismatch + AI "LIKELY_FORGED" → Finalize disabled.
4. **Live fraud alert** — a double-sale attempt pops a red alert on the registrar's war-room in real time.

**Narrator bridges between beats** with one-liners; Driver drives.

**Speaker note:** This is where you win. Rehearsed, seeded, fallbacks ready. End the demo on the completed transfer + green verified badge.

---

## SLIDE 5 — What Makes Us Different  ·  ~25s  ·  *Narrator*

**On screen (3 icons):**
- 🔎 **Instant public verification** — QR, no login, anyone
- 🤖 **AI forgery gate** — fraud caught *before* it hits the ledger + SHA-256 hash integrity
- 🚨 **Real-time fraud war-room** — double-sale blocked at the smart-contract level

Caption: *"Not just 'a blockchain' — a fraud-proof trust layer."*

**Say:**
> "We didn't just put records on a chain. We added an **AI forgery gate**, cryptographic document integrity, and a **live fraud command center** — so fraud is stopped before it ever reaches the ledger."

---

## SLIDE 6 — Impact  ·  ~30s  ·  *Narrator*

**On screen:** three beneficiaries, one line each:
- 👨‍👩‍👧 **Citizens** — verify ownership in seconds; no more stolen land or decade-long cases
- 🏛️ **Government** — less litigation, less fraud surface, transparent registries
- 🏦 **Business / Banks / Courts** — instant, trustable proof of title for loans & verdicts

Bottom, bold: *"Years in court → minutes on chain — for 6.2 crore records."*

**Say:**
> "For a citizen like Priya, this is the difference between a decade in court and a transfer done in minutes. For the government, it's less litigation and less fraud. For banks and courts, it's title they can finally trust."

---

## SLIDE 7 — How It Works (Architecture)  ·  ~25s  ·  *Backup / tech voice*

**On screen (one clean diagram):**
```
Citizen / Registrar / Public
        │  (MetaMask signatures / read-only)
        ▼
   Next.js app  ──►  Permissioned Smart Contract (Solidity, role-gated)
        │                     │ events
        ├──► Claude AI  ◄──── forgery report
        └──► Supabase (docs off-chain, hashes on-chain, live alerts)
```
Caption: *On-chain: ownership + hashes + history. Off-chain: files + search. Anyone can rebuild the truth from the chain.*

**Say:**
> "Only hashes and ownership live on-chain — tiny and immutable. Documents live off-chain. Write access is gated to authorized government registrars on-chain — that's what makes it **permissioned**. It's built to scale to crores of records."

**Speaker note:** Keep it to 25s. If a judge wants depth, Backup handles it in Q&A.

---

## SLIDE 8 — Roadmap + The Ask / Close  ·  ~20s  ·  *Narrator*

**On screen:**
- **Production roadmap:** Hyperledger Fabric consortium (district registrars as peers) · DigiLocker + Aadhaar e-sign · IPFS for documents · GIS/survey integration
- Inspired by: 🇦🇪 UAE · 🇸🇪 Sweden digital land registries · 🇮🇳 Digital India
- Final line, big: **"BhoomiChain — trust, verified on chain."**

**Say:**
> "Our path to production is clear: Hyperledger Fabric for a state consortium, DigiLocker and Aadhaar for real identity, IPFS for documents. The model works — we've proven it today. **BhoomiChain: trust, verified on chain.** Thank you."

**Speaker note:** End confident, land the tagline, smile, invite questions.

---

## Appendix — hidden backup slides (don't present; open only if asked)

- **A1 · Security & trust model** — signatures non-repudiable, role-gating on-chain, hash integrity, full auditability (from [DESIGN.md §6](DESIGN.md#6-security--trust-model)).
- **A2 · Why permissioned, not public crypto** — government-authorized writers, public readers; no gas/speculation; key recovery via verified identity.
- **A3 · Q&A cheat answers** — the 7 defenses from [DEMO_SCRIPT.md](DEMO_SCRIPT.md#qa-defense-rehearse-these--judges-will-ask).
- **A4 · Tech stack** — Solidity/Hardhat/OpenZeppelin (ERC-721 + AccessControl), Next.js, ethers v6, Prisma+Supabase, Claude vision.

---

## Delivery checklist
- [ ] Slides built (Canva / Google Slides / PowerPoint) — minimal text, bold visuals, the palette
- [ ] Slide 4 stays up during the live demo (3-step strip visible)
- [ ] Roles assigned: Narrator / Driver / Backup
- [ ] 7-min run-through timed 2×; also practice a **90-sec version** (Slides 1, 2, 4-demo-short, 6, 8)
- [ ] Backup demo video embedded on Slide 4 (in case live fails)
- [ ] Tagline memorized by all three

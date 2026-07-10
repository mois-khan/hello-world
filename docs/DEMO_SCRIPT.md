# Demo Script & Winning Strategy — BhuRaksha

The document that wins the room. Rehearse the 5-min script until it's muscle memory.

---

## The narrative arc (tell a story, don't list features)

Judges remember **stories and stakes**, not feature tours. Frame everything around one fictional citizen:

> **"Meet Priya. She inherited her family's land in Rangareddy. When she tried to sell it, a fraudster had already forged a deed and 'sold' the same plot to someone else. In today's India, Priya spends **7 years** in court. On BhuRaksha, this fraud is **impossible** — and here's why."**

Then the demo *is* Priya's story unfolding. Every click resolves a stake.

---

## The 5-minute live demo script

> **Roles:** *Narrator* (tells the story), *Driver* (runs the screen), *Backup* (Q&A + watches for issues).
> **Pre-flight (before judges arrive):** run `npm run demo:reset`; Hardhat node up; contract deployed; MetaMask has 3 accounts imported (Seller/Buyer/Registrar); 3 browser profiles/tabs open and logged into the right roles; the tampered demo deed file on the desktop; phone charged for the QR scan.

### Beat 0 — Hook (30s) — *Narrator*
> "India has **6.2 crore undigitised land records**, and land disputes are the **single largest source of civil litigation** — cases drag on for *years*. The root cause? There's no single, tamper-proof source of truth for who owns what. We built one. It's called **BhuRaksha**."

*(Screen: landing page with the pitch line + govt-styled hero.)*

### Beat 1 — Instant public verification (60s) — WOW #1 · *Driver + hand a judge the phone*
> "First — trust. Anyone, with no login, can verify any property in seconds."

- Open a parcel → show its **QR code**.
- **Hand a judge your phone**: "Scan this."
- Verify page loads: ✅ **Verified on BhuRaksha**, current owner, and the **full immutable ownership history** — every past transfer with a tx hash.
> "That history lives on the blockchain. No official can quietly rewrite it. A bank, a court, a buyer — anyone — can confirm ownership in 5 seconds."

**Why it lands:** the judge *physically participates*. That's the moment they remember.

### Beat 2 — The signed transfer (90s) — the core · *Driver, switching accounts*
> "Now watch a real ownership transfer. It takes **three cryptographic signatures** — buyer, seller, and a government registrar. No single party can move ownership alone."

- **As Seller (Priya):** initiate transfer of her parcel to the Buyer, upload the new deed → **MetaMask signature #1**.
- **As Buyer:** open Approvals → "Review & Sign" → **MetaMask signature #2**.
- **As Registrar:** open the transfer queue → review → we'll finalize in a moment.
> "Every signature is cryptographic and permanent. This is 'digitally signed by buyer, seller, and registrar' — enforced by a smart contract, not a policy PDF."

### Beat 3 — AI catches the forgery (60s) — WOW #2 · *Driver, as Registrar*
> "But what if the deed itself is forged? Before the registrar can approve, our AI examines the document."

- In the registrar review, show the **Document Integrity Report** on the tampered deed:
  - **Cryptographic:** hash mismatch → **TAMPERED** (mathematically certain).
  - **AI forensic:** risk score jumps red → **LIKELY_FORGED**, with reasons ("pasted seal", "altered plot area").
- The **Finalize button is disabled**.
> "The fraud is stopped *before* it ever touches the ledger. Priya's plot cannot be stolen with a fake deed."

Then swap to the **genuine** deed → green report → **finalize (MetaMask signature #3)** → ownership moves on-chain, timeline updates live.

### Beat 4 — The fraud war-room (45s) — WOW #3 · *Driver, as Registrar*
> "And registrars get a live fraud command center."

- Show the dashboard: KPI tiles + **district map** (green/amber/red parcels).
- From a second tab, attempt a **double-sale** of an in-transfer plot.
- A **red DOUBLE_SALE alert pops in live** (Supabase Realtime).
> "The same plot can never be sold twice — the smart contract blocks it, and the registrar sees the attempt in real time."

### Beat 5 — Impact close (15s) — *Narrator*
> "Register. Sign. Transfer. Verify — all tamper-proof, all in minutes instead of years. **For Priya, and for 6.2 crore records, that's the difference between trust and a decade in court.** BhuRaksha — the immutable truth of land ownership."

**Total: ~5 min.** Practice trimming to a **3-min** version (Beats 0,1,2,3,5) and a **90-sec** version (Beats 0,1,5) for shorter judge visits.

---

## The one-visit-per-judge variant (booth/expo style)

If judges roam a hall and stop briefly, lead with the phone: **"Scan this QR — that's a property verified live on our blockchain."** Then, based on interest, go deeper into the signed transfer or the AI forgery catch. Always end on the impact line.

---

## Q&A defense (rehearse these — judges WILL ask)

| Question | Your answer |
|----------|-------------|
| **"Why blockchain? Why not just a database?"** | "A database has an admin who can silently edit or delete records — exactly the trust failure causing today's disputes. Blockchain makes ownership history append-only and cryptographically verifiable by *anyone*, with no trusted middleman. That tamper-evidence is the whole point." |
| **"Is this really 'permissioned'?"** | "Yes — write access is role-gated on-chain: only wallets granted the government REGISTRAR_ROLE can register or finalize. The public can read and verify but never write. For a production state consortium we'd run this on Hyperledger Fabric with each district registrar as a peer — same logic, same guarantees, we've proven the model here." |
| **"How does AI forgery detection actually work?"** | "Two layers. One is deterministic: we hash every document (SHA-256) and anchor it on-chain, so any later edit is mathematically provable. The other is Claude's vision model doing forensic analysis — seals, fonts, digital artifacts, altered numbers — returning a risk score. The hash is the proof; the AI is the early-warning gate." |
| **"Does this scale to 6.2 crore records?"** | "The on-chain footprint is tiny — we store only hashes and ownership, not documents. Reads are cached and served instantly. Documents live off-chain (IPFS in production). Fabric consortiums already run at national scale (e.g. trade-finance networks). The architecture is designed for it." |
| **"What about Aadhaar / real identity?"** | "We mock identity for the hackathon. Production integrates DigiLocker + Aadhaar e-sign for real e-KYC — the transfer workflow is already built to slot those signatures in." |
| **"What if someone loses their private key?"** | "In production, registrar-mediated key recovery via verified identity — a governed process, since this is a permissioned government system, not anonymous crypto. We deliberately keep a human authority in the loop." |
| **"Isn't the government the single point of trust again?"** | "The government *authorizes* registrars, but it cannot *rewrite history* — every action is a signed, permanent event auditable by citizens, courts, and the press. We shift power from 'trust us' to 'verify us.'" |

---

## Scoring self-check (map to typical rubric)

| Criterion | Are we winning it? |
|-----------|--------------------|
| **Impact** | ✅ Quantified problem, real citizen story, 3 beneficiary groups |
| **Innovation** | ✅ Beyond 'a blockchain': AI forgery gate + real-time fraud war-room + hash-anchored integrity |
| **Feasibility** | ✅ Working local chain, honest permissioned framing, clear Fabric/DigiLocker path |
| **Completeness** | ✅ Full loop live: register → sign → transfer → verify |
| **Presentation** | ✅ Story-driven, judge participates (QR scan), rehearsed, fallbacks ready |

---

## The intangibles that win

1. **Let a judge touch it.** Participation > observation. The QR scan is your secret weapon — lead with it.
2. **Tell Priya's story**, don't tour features. Stakes make it memorable.
3. **Confidence on the "why blockchain" question** separates winners from "cool demo" also-rans. Own it (see Q&A).
4. **Zero crashes.** One white-screen erases a great pitch. Rehearse 3×, seed data, keep the backup video.
5. **End on impact, every time.** "Years in court vs. minutes on chain, for 6.2 crore records." Land the plane.
6. **Look like a real product.** The govt-seal styling and the verified-green badge make judges feel it's deployable *today*.

---

## Final 10-minute pre-demo checklist
- [ ] `npm run demo:reset` run; clean known state
- [ ] Hardhat node up · contract deployed · address in web `.env`
- [ ] 3 MetaMask accounts imported + funded + labeled (Seller / Buyer / Registrar)
- [ ] 3 browser tabs/profiles pre-opened on the right roles
- [ ] Tampered + genuine demo deeds on the desktop
- [ ] Phone charged, on the same network, QR scan tested once
- [ ] Backup demo video accessible offline
- [ ] Speaking roles assigned (Narrator / Driver / Backup)
- [ ] Deep breath. You built something that matters. Go win it. 🏆

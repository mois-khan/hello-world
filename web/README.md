# BhuRaksha Web Application

India's Trusted Land Registry Layer — production-ready Next.js frontend inspired by premium architectural UI design (black/white/neon-lime aesthetic with glassmorphism and 3D land parcel hero).

## Quick Start

```bash
cd web
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — Features and portal entry points |
| `/verify` | TrustSeal public verification search (by ID or ULPIN) |
| `/verify/[id]` | Public immutable ownership record and AI document integrity report |
| `/portal/parcels` | Citizen Portal — view your connected MetaMask parcels |
| `/portal/transfer` | Multi-sig Property Transfer |
| `/portal/approvals` | Escrow inbox for pending transfers |
| `/dashboard` | Registrar War-Room (Live Fraud Map & AI Feed) |
| `/dashboard/register` | Registrar minting tool to register new parcels |

## Demo ULPINs

| ULPIN | Scenario |
|---|---|
| `29KA-0482-0174-52` | Verified agricultural land (3 co-owners) |
| `27MH-1234-0567-89` | Double-sale blocked (pending transfer) |
| `29KA-0482-0174-53` | Active bank lien |

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — video-inspired design tokens (lime `#C8F135`, black, glassmorphism)
- **Framer Motion** — page transitions, scroll animations
- **React Three Fiber** — 3D land parcel hero with trust shield dome
- **Lucide React** — icons

## Design System

Adapted from reference video aesthetic:
- Black hero sections with giant background typography
- Neon lime (`#C8F135`) accent on black/white
- Glassmorphism cards (`backdrop-blur`, white/10 borders)
- Pill-shaped navigation and filter buttons
- Muted blue-grey (`#8B9CB3`) section backgrounds
- Large display typography (Inter, font-black)
- Metadata rows with uppercase labels

## Build

```bash
npm run build
npm start
```

## Related Docs

See `/docs` for PRD, architecture, design spec, TechSpec, Schema, and implementation plan.

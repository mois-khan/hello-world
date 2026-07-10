"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Shield,
  FileSearch,
  Building2,
  Landmark,
  Scale,
  Users,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParcelCard } from "@/components/ParcelCard";
import { FadeIn } from "@/components/PageTransition";
import { bhumiApi } from "@/lib/api-client";
import type { Parcel } from "@/lib/types";

const CITIZEN_SERVICES = [
  { href: "/verify", icon: Shield, title: "Verify Parcel", desc: "Instant public ownership verification", hindi: "पार्सल सत्यापन" },
  { href: "/portal/parcels", icon: MapPin, title: "My Parcels", desc: "View parcels linked to your wallet", hindi: "मेरे पार्सल" },
  { href: "/portal/transfer", icon: FileSearch, title: "Initiate Transfer", desc: "Multi-party signed transfer workflow", hindi: "हस्तांतरण" },
  { href: "/portal/approvals", icon: Users, title: "Buyer Approvals", desc: "Review and sign incoming transfers", hindi: "खरीदार अनुमोदन" },
];

const INSTITUTIONAL_PORTALS = [
  { href: "/dashboard", icon: Building2, title: "Fraud War-Room", desc: "Live alerts, district map, and KPIs" },
  { href: "/dashboard/transfers", icon: Building2, title: "Transfer Queue", desc: "Review and finalize pending transfers" },
  { href: "/dashboard/register", icon: Landmark, title: "Register Parcel", desc: "Mint new land titles on-chain" },
  { href: "/admin", icon: Scale, title: "Admin Panel", desc: "Grant or revoke registrar roles" },
];

const STATS = [
  { label: "On-Chain Parcels", value: "Live" },
  { label: "Verify Time", value: "< 5 sec" },
  { label: "Transfer Signatures", value: "3-of-3" },
  { label: "Double-Sale Guard", value: "Active" },
];

const HIGHLIGHTS = [
  { title: "Public QR Verify", desc: "Any citizen can verify ownership in seconds — no login required." },
  { title: "AI Forgery Detection", desc: "Claude vision analyzes documents before records are finalized." },
  { title: "Fraud War-Room", desc: "Registrars see live alerts and a district map of flagged parcels." },
  { title: "Immutable History", desc: "Every transfer is cryptographically signed and permanently recorded." },
  { title: "Multi-Party Transfers", desc: "Seller, buyer, and registrar must all sign before ownership moves." },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(true);
  const [parcelsError, setParcelsError] = useState("");

  useEffect(() => {
    bhumiApi
      .getParcels()
      .then((data) => setParcels(data.slice(0, 3)))
      .catch((e) => setParcelsError(e instanceof Error ? e.message : "Failed to load parcels"))
      .finally(() => setParcelsLoading(false));
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/verify?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />

      <main id="main-content">
        <section className="bg-gov-blue text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-gov-saffron text-sm font-semibold uppercase tracking-wide mb-2">
                  Digital India Hackathon · BhuRaksha
                </p>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                  One Nation, One Land Ledger
                </h2>
                <p className="font-hindi text-white/80 text-lg mb-2">
                  एक राष्ट्र, एक भूमि खाता
                </p>
                <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-lg">
                  BhuRaksha is a blockchain land registry where every transfer is cryptographically
                  signed by all parties, permanently recorded on-chain, and instantly verifiable by any citizen.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/verify" className="gov-btn-secondary text-sm">
                    Verify a Parcel
                  </Link>
                  <Link href="/dashboard" className="gov-btn bg-transparent border border-white/30 text-white hover:bg-white/10 text-sm">
                    Registrar Dashboard
                  </Link>
                </div>
              </div>

              <div className="gov-card-elevated p-6 md:p-8 text-gov-text">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-gov-blue" />
                  <h3 className="font-bold text-gov-navy text-lg">Public Verification</h3>
                </div>
                <p className="text-gov-muted text-sm mb-5">
                  Search by survey number or district — no login required
                </p>
                <label className="metric-label" htmlFor="hero-search">Survey Number or District</label>
                <input
                  id="hero-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. 123/4 or Bengaluru Urban"
                  className="gov-input mt-2"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="gov-btn-primary w-full mt-5 disabled:opacity-40"
                >
                  Search Registry
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-4 relative z-10">
          <div className="gov-notice flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>Demo platform:</strong> BhuRaksha uses a local Hardhat node for on-chain records.
              The chain is the source of truth; off-chain data mirrors it for search and files.
            </p>
          </div>
        </div>

        <section className="py-8 border-b border-gov-border bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-gov-blue">{stat.value}</p>
                  <p className="text-sm text-gov-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <h2 className="gov-section-title mb-2">Citizen Portal</h2>
              <p className="text-gov-muted mb-8 pl-5">Services for property owners and buyers</p>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CITIZEN_SERVICES.map((service, i) => (
                <FadeIn key={service.href} delay={i * 0.05}>
                  <Link href={service.href} className="gov-service-tile group block h-full">
                    <service.icon className="w-8 h-8 text-gov-blue mb-3 group-hover:text-gov-saffron transition-colors" />
                    <h3 className="font-semibold text-gov-navy">{service.title}</h3>
                    <p className="font-hindi text-xs text-gov-muted mt-0.5">{service.hindi}</p>
                    <p className="text-sm text-gov-muted mt-2">{service.desc}</p>
                    <span className="inline-flex items-center gap-1 text-gov-blue text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                      Access <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 md:px-8 bg-white border-y border-gov-border">
          <div className="max-w-7xl mx-auto">
            <h2 className="gov-section-title mb-8">Registrar & Admin</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {INSTITUTIONAL_PORTALS.map((portal) => (
                <Link key={portal.href} href={portal.href} className="gov-service-tile flex items-start gap-4">
                  <portal.icon className="w-10 h-10 text-gov-blue shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gov-navy">{portal.title}</h3>
                    <p className="text-sm text-gov-muted mt-1">{portal.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <h2 className="gov-section-title mb-2">Registered Parcels</h2>
              <p className="text-gov-muted mb-8 pl-5">Live records from the on-chain registry</p>
            </FadeIn>

            {parcelsLoading && (
              <div className="gov-card p-8 text-center text-gov-muted">Loading parcels…</div>
            )}

            {parcelsError && (
              <div className="gov-card p-6 text-red-700 bg-red-50 border-red-200">{parcelsError}</div>
            )}

            {!parcelsLoading && !parcelsError && parcels.length === 0 && (
              <div className="gov-card p-8 text-center text-gov-muted">
                No parcels registered yet. Run the seed script to populate demo data.
              </div>
            )}

            {!parcelsLoading && parcels.length > 0 && (
              <div className="grid md:grid-cols-3 gap-5">
                {parcels.map((parcel, i) => (
                  <FadeIn key={parcel.id} delay={i * 0.1}>
                    <ParcelCard parcel={parcel} />
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 px-4 md:px-8 bg-gov-blue-light border-t border-gov-border">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
            <FadeIn>
              <h2 className="gov-section-title mb-4">About BhuRaksha</h2>
              <p className="text-gov-text leading-relaxed mb-4">
                BhuRaksha creates a single, trusted, tamper-evident digital source of truth for land
                ownership in India. Every transfer requires cryptographic signatures from the seller,
                buyer, and authorized registrar — with AI-powered document forgery detection and a
                real-time fraud war-room for government officers.
              </p>
              <div className="gov-disclaimer">
                Built on Solidity + Hardhat + OpenZeppelin (ERC-721), Next.js, Prisma + Supabase,
                and Claude vision for forensic document analysis.
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h3 className="font-semibold text-gov-navy mb-4">Key Capabilities</h3>
              <div className="space-y-3">
                {HIGHLIGHTS.map((item) => (
                  <div key={item.title} className="gov-card p-4">
                    <p className="font-semibold text-gov-navy">{item.title}</p>
                    <p className="text-sm text-gov-muted mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/verify" className="gov-btn-primary mt-6 inline-flex">
                Try Public Verify <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { ParcelCard } from "@/components/ParcelCard";
import { FadeIn } from "@/components/PageTransition";
import { connectWallet, getConnectedAddress } from "@/lib/wallet";
import type { Parcel } from "@/lib/types";

async function fetchParcelsByOwner(owner: string): Promise<Parcel[]> {
  const res = await fetch(`/api/parcels?owner=${encodeURIComponent(owner)}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Failed to load parcels");
  return json.data as Parcel[];
}

export default function PortalParcelsPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(async (owner?: string | null) => {
    setLoading(true);
    setError("");
    try {
      if (!owner) {
        setParcels([]);
        return;
      }
      const data = await fetchParcelsByOwner(owner);
      setParcels(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load parcels");
      setParcels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existing = getConnectedAddress();
    if (existing) {
      setWallet(existing);
      load(existing);
    } else {
      setLoading(false);
    }
  }, [load]);

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const { address } = await connectWallet();
      setWallet(address);
      await load(address);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection failed");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="My Parcels"
        hindiTitle="मेरे पार्सल"
        subtitle="Parcels owned by your connected wallet — read from on-chain records"
        breadcrumbs={[{ label: "Citizen Portal", href: "/portal/parcels" }, { label: "My Parcels" }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {!wallet && (
            <div className="gov-card-elevated p-8 text-center">
              <Wallet className="w-12 h-12 text-gov-blue mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gov-navy">Connect Your Wallet</h2>
              <p className="text-gov-muted text-sm mt-2 mb-6">
                Your wallet address is your on-chain identity. Connect MetaMask to view parcels you own.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="gov-btn-primary disabled:opacity-50"
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            </div>
          )}

          {wallet && (
            <p className="text-sm text-gov-muted mb-6 font-mono">
              Connected: {wallet}
            </p>
          )}

          {loading && (
            <div className="gov-card p-8 text-center">
              <div className="w-10 h-10 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gov-muted text-sm">Loading parcels from registry…</p>
            </div>
          )}

          {error && (
            <div className="gov-card p-6 mb-6 text-red-700 bg-red-50 border-red-200">{error}</div>
          )}

          {!loading && !error && wallet && parcels.length === 0 && (
            <div className="gov-card p-8 text-center">
              <p className="text-gov-navy font-semibold">No parcels found</p>
              <p className="text-gov-muted text-sm mt-2">
                No registered parcels are linked to this wallet yet.
              </p>
              <Link href="/verify" className="gov-btn-primary mt-6 inline-flex items-center gap-2">
                Search Public Registry <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {!loading && parcels.length > 0 && (
            <div className="grid md:grid-cols-2 gap-5">
              {parcels.map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.1}>
                  <Link href={`/verify/${p.id}`}>
                    <ParcelCard parcel={p} />
                  </Link>
                </FadeIn>
              ))}
            </div>
          )}

          {wallet && parcels.length > 0 && (
            <FadeIn delay={0.3}>
              <Link href="/portal/transfer" className="gov-btn-primary mt-8 inline-flex items-center gap-2">
                Initiate Transfer <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

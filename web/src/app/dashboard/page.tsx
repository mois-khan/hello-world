"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { FraudFeed } from "@/components/FraudFeed";
import { FraudMap } from "@/components/FraudMap";
import { bhumiApi } from "@/lib/api-client";

export default function DashboardPage() {
  const [mode, setMode] = useState("simulator");
  const [parcelCount, setParcelCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);

  useEffect(() => {
    bhumiApi.getChainMode().then((m) => setMode(m.mode)).catch(() => {});
    bhumiApi.getParcels().then((p) => setParcelCount(p.length)).catch(() => {});
    bhumiApi.getTransfers(undefined, "REGISTRAR").then((t) => setTransferCount(t.length)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Registrar Fraud War-Room"
        hindiTitle="पंजीयक धोखाधड़ी नियंत्रण कक्ष"
        subtitle="Live fraud alerts, district map, and blockchain-backed parcel monitoring"
        breadcrumbs={[{ label: "Fraud War-Room" }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Chain Mode", value: mode },
              { label: "Total Parcels", value: String(parcelCount) },
              { label: "Pending Registrar", value: String(transferCount) },
              { label: "Network", value: "31337" },
            ].map((k) => (
              <div key={k.label} className="gov-card p-4 text-center">
                <p className="text-2xl font-bold text-gov-blue">{k.value}</p>
                <p className="text-xs text-gov-muted mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gov-navy mb-3">Live Fraud Alerts</h3>
              <FraudFeed refreshMs={4000} />
            </div>
            <FraudMap />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

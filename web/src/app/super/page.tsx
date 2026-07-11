"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { ParcelCard } from "@/components/ParcelCard";
import { PageTransition, FadeIn } from "@/components/PageTransition";
import { bhumiApi } from "@/lib/api-client";
import type { Parcel } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function SuperPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    bhumiApi
      .getParcels()
      .then(setParcels)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load parcels"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Super Admin / Testing"
        hindiTitle="सुपर एडमिन"
        subtitle="Developer view of all registered properties on the blockchain network"
        breadcrumbs={[{ label: "Super Admin" }]}
      />

      <main id="main-content" className="flex-1 py-12 px-4 md:px-8">
        <PageTransition>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-6 border-b border-gov-border pb-4">
              <h2 className="text-xl font-bold text-gov-navy">All Blockchain Properties</h2>
              <p className="text-sm text-gov-muted font-mono bg-white px-3 py-1 rounded border border-gov-border">
                Total: {parcels.length}
              </p>
            </div>

            {loading && (
              <div className="gov-card p-12 text-center text-gov-muted flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-gov-blue" />
                <p>Syncing state from blockchain...</p>
              </div>
            )}

            {error && (
              <div className="gov-card p-6 border-red-200 bg-red-50 text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && parcels.length === 0 && (
              <div className="gov-card p-12 text-center text-gov-muted">
                No parcels found in the registry. Ensure you have run the seed script.
              </div>
            )}

            {!loading && parcels.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {parcels.map((parcel, i) => (
                  <FadeIn key={parcel.id} delay={i * 0.05}>
                    <ParcelCard parcel={parcel} />
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}

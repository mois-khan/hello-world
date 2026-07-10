"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldX, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { TransferTimeline } from "@/components/TransferTimeline";
import { PageTransition } from "@/components/PageTransition";
import { bhumiApi } from "@/lib/api-client";
import { DEMO_WALLETS } from "@/lib/demo-constants";
import { connectWallet } from "@/lib/wallet";
import type { Parcel } from "@/lib/types";

function TransferContent() {
  const searchParams = useSearchParams();
  const [parcelId, setParcelId] = useState("");
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [step, setStep] = useState<"input" | "blocked" | "progress">("input");
  const [blockReason, setBlockReason] = useState("");
  const [buyerWallet, setBuyerWallet] = useState(DEMO_WALLETS.buyer);
  const [transferId, setTransferId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingParcel, setLoadingParcel] = useState(false);

  useEffect(() => {
    const id = searchParams.get("parcelId");
    if (id) setParcelId(id);
  }, [searchParams]);

  useEffect(() => {
    const id = Number(parcelId);
    if (!id || Number.isNaN(id)) {
      setParcel(null);
      return;
    }
    setLoadingParcel(true);
    bhumiApi
      .getParcel(id)
      .then((data) => setParcel(data.parcel))
      .catch(() => setParcel(null))
      .finally(() => setLoadingParcel(false));
  }, [parcelId]);

  const handleSubmit = async () => {
    const id = Number(parcelId);
    if (!id || Number.isNaN(id)) return;

    if (parcel?.status === "InTransfer") {
      setBlockReason("This parcel already has an active transfer in progress.");
      setStep("blocked");
      bhumiApi.scanFraud({ parcelId: id }).catch(() => {});
      return;
    }

    setSubmitting(true);
    try {
      let documentHash = "0x" + "e".repeat(64);
      if (file) {
        const upload = await bhumiApi.uploadDocument(file, id);
        documentHash = upload.sha256;
      }

      const seller = (await connectWallet().catch(() => null))?.address ?? DEMO_WALLETS.seller;
      const result = await bhumiApi.chainAction({
        action: "initiate",
        seller,
        parcelId: id,
        buyer: buyerWallet,
        newDocumentHash: documentHash,
      });
      setTransferId(result.transferId ?? null);
      await bhumiApi.scanFraud({ transferId: result.transferId, parcelId: id });
      setStep("progress");
    } catch (e) {
      setBlockReason(e instanceof Error ? e.message : "Transfer blocked");
      setStep("blocked");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <section className="py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="gov-card-elevated p-6 md:p-8"
              >
                <p className="metric-label mb-4">Step 1 — Select Parcel</p>
                <label className="metric-label" htmlFor="parcel-id">Parcel ID</label>
                <input
                  id="parcel-id"
                  type="number"
                  min={1}
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  placeholder="Enter on-chain parcel ID"
                  className="gov-input mt-2"
                />

                {loadingParcel && (
                  <p className="text-sm text-gov-muted mt-3">Loading parcel details…</p>
                )}

                {parcel && !loadingParcel && (
                  <div className="mt-4 p-4 bg-gov-blue-light rounded-card text-sm">
                    <p className="font-semibold text-gov-navy">
                      Survey {parcel.surveyNumber} · {parcel.district}
                    </p>
                    <p className="text-gov-muted mt-1">
                      Status: {parcel.status} · Area: {parcel.area} sq.ft
                    </p>
                  </div>
                )}

                <div className="mt-8">
                  <label className="metric-label" htmlFor="buyer-wallet">Buyer Wallet Address</label>
                  <input
                    id="buyer-wallet"
                    type="text"
                    value={buyerWallet}
                    onChange={(e) => setBuyerWallet(e.target.value)}
                    className="gov-input mt-2 font-mono text-sm"
                  />
                </div>

                <div className="mt-6">
                  <label className="metric-label" htmlFor="title-deed">New Title Deed (PDF/Image)</label>
                  <input
                    id="title-deed"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="gov-input mt-2"
                  />
                  <p className="text-xs text-gov-muted mt-1">This document will be analyzed by AI for fraud detection.</p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!parcelId || !file || submitting || !parcel || parcel.status === "InTransfer"}
                  className="gov-btn-primary mt-8 flex items-center gap-2 disabled:opacity-40"
                >
                  {submitting ? "Initiating on blockchain…" : "Initiate Transfer"} <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-gov-muted mt-4 gov-disclaimer">
                  Seller signs first. Buyer and registrar must approve before ownership moves on-chain.
                </p>
              </motion.div>
            )}

            {step === "blocked" && (
              <motion.div
                key="blocked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="gov-card p-8 bg-red-50 border-red-200"
              >
                <ShieldX className="w-14 h-14 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-center text-red-800">Transfer Blocked</h2>
                <p className="text-center text-red-700 mt-2">{blockReason}</p>
                <button onClick={() => setStep("input")} className="gov-btn-primary mx-auto mt-6 block">
                  Try Again
                </button>
              </motion.div>
            )}

            {step === "progress" && (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid md:grid-cols-2 gap-6"
              >
                <div className="gov-card p-6">
                  <p className="metric-label mb-2">Transfer ID</p>
                  <p className="text-2xl font-bold text-gov-navy">{transferId ?? "—"}</p>
                  <p className="text-gov-muted mt-4 text-sm">
                    Parcel {parcelId} → Buyer {buyerWallet.slice(0, 10)}…
                  </p>
                </div>
                <div className="gov-card p-6">
                  <p className="metric-label mb-4">Transfer Progress</p>
                  <TransferTimeline currentStep={1} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  );
}

export default function PortalTransferPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Initiate Transfer"
        hindiTitle="हस्तांतरण प्रारंभ करें"
        subtitle="Seller workflow — initiate a multi-party signed property transfer on BhuRaksha"
        breadcrumbs={[
          { label: "Citizen Portal", href: "/portal/parcels" },
          { label: "Initiate Transfer" },
        ]}
      />

      <main id="main-content" className="flex-1">
        <Suspense fallback={<div className="py-16 text-center text-gov-muted">Loading…</div>}>
          <TransferContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

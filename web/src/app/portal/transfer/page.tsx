"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldX, ArrowRight, Eye, PenTool } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { TransferTimeline } from "@/components/TransferTimeline";
import { PageTransition } from "@/components/PageTransition";
import { bhumiApi } from "@/lib/api-client";
import { DEMO_WALLETS } from "@/lib/demo-constants";
import { connectWallet, getConnectedAddress } from "@/lib/wallet";
import type { Parcel } from "@/lib/types";

function TransferContent() {
  const searchParams = useSearchParams();
  const [parcelId, setParcelId] = useState("");
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [step, setStep] = useState<"input" | "blocked" | "progress">("input");
  const [blockReason, setBlockReason] = useState("");
  const [buyerWallet, setBuyerWallet] = useState(DEMO_WALLETS.buyer);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  useEffect(() => {
    // Listen for wallet changes
    const checkWallet = () => setConnectedAddress(getConnectedAddress());
    checkWallet();
    window.addEventListener("wallet_connected", (e: any) => setConnectedAddress(e.detail));
    window.addEventListener("wallet_disconnected", () => setConnectedAddress(null));
  }, []);
  const [sellerName, setSellerName] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [transferId, setTransferId] = useState<number | null>(null);
  const [agreementText, setAgreementText] = useState("The property is transferred with all absolute rights of ownership, without any encumbrances or pending disputes.");
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [loadingParcel, setLoadingParcel] = useState(false);
  const [previewPdfBase64, setPreviewPdfBase64] = useState<string | null>(null);
  const [generatedDocHash, setGeneratedDocHash] = useState<string | null>(null);

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

  const handleGeneratePdf = async () => {
    if (!parcel || !sellerName || !buyerName) return;

    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/document/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          parcelId: parcel.id,
          surveyNumber: parcel.surveyNumber,
          district: parcel.district,
          area: parcel.area,
          sellerName,
          buyerName,
          agreementText
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDocHash(data.documentHash);
        const binaryString = window.atob(data.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPreviewPdfBase64(url);
      }
    } catch (e) {
      console.error("Failed to generate PDF", e);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrintDocument = async () => {
    if (!previewPdfBase64) return;
    const link = document.createElement("a");
    link.href = previewPdfBase64;
    link.download = `TitleDeed_${parcelId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    const id = Number(parcelId);
    if (!id || Number.isNaN(id) || !generatedDocHash) return;

    if (parcel?.status === "InTransfer") {
      setBlockReason("This parcel already has an active transfer in progress.");
      setStep("blocked");
      bhumiApi.scanFraud({ parcelId: id }).catch(() => {});
      return;
    }

    setSubmitting(true);
    try {
      const seller = getConnectedAddress() ?? DEMO_WALLETS.seller;
      const result = await bhumiApi.chainAction({
        action: "initiate",
        seller,
        sellerName,
        parcelId: id,
        buyer: buyerWallet,
        buyerName,
        newDocumentHash: generatedDocHash,
      });
      setTransferId(result.transferId ?? null);
      bhumiApi.scanFraud({ transferId: result.transferId, parcelId: id }).catch(console.error);
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
                    <p className="text-xs font-mono mt-2 text-slate-500">
                      Owner: {parcel.owner}
                    </p>
                    {connectedAddress && connectedAddress.toLowerCase() !== parcel.owner.toLowerCase() && (
                      <p className="text-red-600 font-semibold mt-2 text-xs bg-red-50 p-2 rounded">
                        Warning: Your connected wallet ({connectedAddress.slice(0,6)}...) does not match the parcel owner. The transfer will be blocked. Please switch to the owner's wallet in MetaMask.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="metric-label" htmlFor="seller-name">Your Full Name (Seller)</label>
                    <input
                      id="seller-name"
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="gov-input mt-2"
                    />
                  </div>
                  <div>
                    <label className="metric-label" htmlFor="buyer-name">Buyer Full Name</label>
                    <input
                      id="buyer-name"
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Priya Patel"
                      className="gov-input mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="metric-label" htmlFor="buyer-wallet">Buyer Wallet Address</label>
                    <input
                      id="buyer-wallet"
                      type="text"
                      value={buyerWallet}
                      onChange={(e) => setBuyerWallet(e.target.value)}
                      className="gov-input mt-2 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="metric-label" htmlFor="agreement-text">Transfer Agreement Terms</label>
                  <textarea
                    id="agreement-text"
                    rows={4}
                    value={agreementText}
                    onChange={(e) => setAgreementText(e.target.value)}
                    className="gov-input mt-2 resize-none"
                  />
                </div>

                {!generatedDocHash ? (
                  <button
                    onClick={handleGeneratePdf}
                    disabled={!parcelId || !sellerName || !buyerName || generatingPdf || !parcel || parcel.status === "InTransfer"}
                    className="gov-btn-secondary mt-8 w-full flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {generatingPdf ? "Generating Document..." : "Generate Sale Deed"} <PenTool className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="mt-8 space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-card flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-800 flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Document Generated
                        </p>
                        <p className="text-xs text-green-700 mt-1">Hash: {generatedDocHash.slice(0, 16)}...</p>
                      </div>
                      <button
                        onClick={handlePrintDocument}
                        className="text-sm font-semibold text-green-700 hover:underline flex items-center gap-1"
                      >
                        Print / Save as PDF
                      </button>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="gov-btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-40"
                    >
                      {submitting ? "Initiating on blockchain…" : "Initiate Transfer"} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

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

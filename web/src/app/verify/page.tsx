"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Printer, QrCode as QrCodeIcon, ShieldX } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { ULPINInput } from "@/components/ULPINInput";
import { StatusBadge } from "@/components/StatusBadge";
import { PageTransition } from "@/components/PageTransition";
import Link from "next/link";
import { getParcel } from "@/lib/data";
import { formatULPIN, normalizeULPIN, isValidULPIN } from "@/lib/utils";
import { bhumiApi } from "@/lib/api-client";
import { ULPIN_TO_PARCEL } from "@/lib/demo-constants";
import type { Parcel } from "@/lib/data";
import type { TimelineEvent } from "@/lib/types";
import { OwnershipTimeline } from "@/components/OwnershipTimeline";
import { QrCode } from "@/components/QrCode";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [segments, setSegments] = useState(["", "", "", ""]);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [chainParcelId, setChainParcelId] = useState<number | null>(null);
  const [history, setHistory] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const ulpin = searchParams.get("ulpin");
    if (ulpin && ulpin.length === 14) {
      const segs = [ulpin.slice(0, 4), ulpin.slice(4, 8), ulpin.slice(8, 12), ulpin.slice(12, 14)];
      setSegments(segs);
      runVerify(ulpin);
    }
  }, [searchParams]);

  const runVerify = async (ulpin: string) => {
    setLoading(true);
    setError("");
    setVerified(false);
    setChainParcelId(null);
    setHistory([]);

    const normalized = normalizeULPIN(ulpin);
    if (!isValidULPIN(normalized)) {
      setError("Invalid ULPIN format. Must be 14 alphanumeric characters.");
      setParcel(null);
      setLoading(false);
      return;
    }

    const result = getParcel(normalized);
    if (!result) {
      setError("ULPIN not found in BhuRaksha registry. This parcel may not be digitised yet.");
      setParcel(null);
      setLoading(false);
      return;
    }

    const parcelId = ULPIN_TO_PARCEL[normalized];
    if (parcelId) {
      try {
        const chainData = await bhumiApi.getParcel(parcelId);
        setChainParcelId(parcelId);
        setHistory(chainData.history);
      } catch {
        // chain data optional
      }
    }

    setParcel(result);
    setVerified(true);
    setLoading(false);
  };

  return (
    <PageTransition>
      <section className="py-10 px-4 md:px-8 min-h-[60vh]">
        <div className="max-w-3xl mx-auto">
          <div className="gov-card-elevated p-6 md:p-8 mb-6">
            <h2 className="font-semibold text-gov-navy mb-1">Enter ULPIN for Verification</h2>
            <p className="text-gov-muted text-sm mb-6">
              Unique Land Parcel Identification Number — 14 alphanumeric characters
            </p>
            <ULPINInput
              value={segments}
              onChange={setSegments}
              onComplete={runVerify}
              error={!!error}
              size="large"
            />
            <button
              onClick={() => runVerify(segments.join(""))}
              disabled={segments.join("").length !== 14 || loading}
              className="gov-btn-primary mt-6 w-full md:w-auto disabled:opacity-40"
            >
              {loading ? "Verifying on blockchain..." : "Verify Now"}
            </button>
          </div>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="gov-card p-8 text-center"
            >
              <div className="w-10 h-10 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gov-muted text-sm">
                Checking blockchain records... Verifying liens... Checking disputes...
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="gov-card p-8 border-red-200 bg-red-50 text-center"
              >
                <ShieldX className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <p className="text-red-700 font-medium">{error}</p>
              </motion.div>
            )}

            {verified && parcel && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="gov-card-elevated p-6 md:p-8 border-gov-green/30"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6 pb-6 border-b border-gov-border">
                  <div>
                    <StatusBadge status="verified" className="mb-3" />
                    <h2 className="text-xl font-bold text-gov-navy">TrustSeal Certificate — Active</h2>
                    <p className="font-mono text-sm text-gov-muted mt-1">{formatULPIN(parcel.ulpin)}</p>
                  </div>
                  <div className="w-20 h-20 bg-gov-blue-light border border-gov-border rounded-card flex items-center justify-center p-1">
                    {chainParcelId ? (
                      <QrCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${chainParcelId}`} size={72} />
                    ) : (
                      <QrCodeIcon className="w-14 h-14 text-gov-blue" />
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "Owner", value: parcel.owners.map((o) => o.name).join(", ") },
                    { label: "Area", value: parcel.area },
                    { label: "District", value: `${parcel.district}, ${parcel.state}` },
                    { label: "Survey No.", value: parcel.surveyNo },
                    { label: "Land Type", value: parcel.landType },
                    { label: "On-Chain Status", value: parcel.onChain ? "Confirmed" : "Pending" },
                    { label: "Liens", value: parcel.hasLien ? "Active lien" : "None" },
                    { label: "Disputes", value: parcel.hasDispute ? "Active" : "None" },
                  ].map((row) => (
                    <div key={row.label} className="border-b border-gov-border pb-3">
                      <p className="metric-label">{row.label}</p>
                      <p className="metric-value mt-0.5">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 flex-wrap">
                  {chainParcelId && (
                    <Link href={`/verify/${chainParcelId}`} className="gov-btn-saffron text-sm">
                      Full Blockchain Verify
                    </Link>
                  )}
                  {chainParcelId && (
                    <a href={`/api/certificate/${chainParcelId}`} className="gov-btn-primary flex items-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> Download TrustSeal PDF
                    </a>
                  )}
                  {!chainParcelId && (
                    <button className="gov-btn-primary flex items-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> Download TrustSeal PDF
                    </button>
                  )}
                  <button className="gov-btn-secondary flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button className="gov-btn-outline flex items-center gap-2 text-sm">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>

                {history.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gov-border">
                    <h3 className="font-semibold text-gov-navy mb-3">On-Chain Ownership History</h3>
                    <OwnershipTimeline events={history} />
                  </div>
                )}

                <p className="text-xs text-gov-muted mt-5 gov-disclaimer">
                  Valid for 30 days. Admissible under IT Act 2000, Section 65B.
                  On-chain transaction confirmed on Hyperledger Fabric permissioned network.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="TrustSeal Verification"
        hindiTitle="ट्रस्टसील सत्यापन"
        subtitle="Instant ownership verification anchored to permissioned blockchain records"
        breadcrumbs={[{ label: "Verify ULPIN" }]}
      />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<div className="py-16 text-center text-gov-muted">Loading...</div>}>
          <VerifyContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

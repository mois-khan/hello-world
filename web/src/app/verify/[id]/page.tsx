"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { OwnershipTimeline } from "@/components/OwnershipTimeline";
import { QrCode } from "@/components/QrCode";
import { DocumentIntegrityReport } from "@/components/DocumentIntegrityReport";
import { bhumiApi } from "@/lib/api-client";
import type { Parcel, TimelineEvent, AiReport } from "@/lib/types";
import { shortenAddress } from "@/lib/wallet";

export default function VerifyByIdPage() {
  const params = useParams();
  const id = params.id as string;
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [history, setHistory] = useState<TimelineEvent[]>([]);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    bhumiApi
      .getParcel(id)
      .then((data) => {
        setParcel(data.parcel);
        setHistory(data.history);
        setAiReport(data.document?.aiReport ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${id}`
      : `/verify/${id}`;

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Public Verification"
        hindiTitle="सार्वजनिक सत्यापन"
        subtitle="Login-free ownership verification — data read directly from permissioned blockchain"
        breadcrumbs={[{ label: "Verify", href: "/verify" }, { label: `Parcel ${id}` }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {loading && <p className="text-center text-gov-muted">Loading from blockchain…</p>}
          {error && (
            <div className="gov-card p-6 text-red-700 bg-red-50 border-red-200">{error}</div>
          )}

          {parcel && (
            <div className="space-y-6">
              <div className="gov-card-elevated p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gov-green font-bold mb-3">
                      <ShieldCheck className="w-6 h-6" />
                      Verified on BhoomiChain
                    </div>
                    <h2 className="text-xl font-bold text-gov-navy">
                      Parcel #{parcel.id} · Survey {parcel.surveyNumber}
                    </h2>
                    <p className="text-gov-muted mt-2">{parcel.district}</p>
                    <p className="mt-4">
                      <span className="metric-label">Current Owner</span>
                      <br />
                      <span className="font-mono font-semibold">{shortenAddress(parcel.owner)}</span>
                    </p>
                    <p className="mt-2 text-sm">
                      Status: <strong>{parcel.status}</strong> · Area: {parcel.area} sq.ft
                    </p>
                  </div>
                  <div className="text-center">
                    <QrCode value={verifyUrl} />
                    <p className="text-xs text-gov-muted mt-2">Scan to verify</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 flex-wrap">
                  <a href={`/api/certificate/${parcel.id}`} className="gov-btn-primary flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" /> Download Title Certificate
                  </a>
                  <Link href={`/portal/transfer?parcelId=${parcel.id}`} className="gov-btn-secondary text-sm">
                    Initiate Transfer
                  </Link>
                </div>
              </div>

              {aiReport && <DocumentIntegrityReport report={aiReport} />}

              <div className="gov-card p-6">
                <h3 className="font-bold text-gov-navy mb-4">Immutable Ownership History</h3>
                <OwnershipTimeline events={history} />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

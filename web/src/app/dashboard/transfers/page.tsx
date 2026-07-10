"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { DocumentIntegrityReport } from "@/components/DocumentIntegrityReport";
import { bhumiApi } from "@/lib/api-client";
import { DEMO_WALLETS } from "@/lib/demo-constants";
import type { TransferRequest, AiReport } from "@/lib/types";
import { shortenAddress } from "@/lib/wallet";

export default function DashboardTransfersPage() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [reports, setReports] = useState<Record<number, AiReport>>({});
  const [loading, setLoading] = useState<number | null>(null);

  const load = () => {
    bhumiApi.getTransfers(DEMO_WALLETS.registrar, "REGISTRAR").then(setTransfers).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const finalize = async (tid: number, parcelId: number) => {
    const report = reports[tid];
    if (report && (report.verdict === "LIKELY_FORGED" || report.riskScore >= 70)) {
      alert("Cannot finalize — document flagged as LIKELY_FORGED. Override not permitted in demo.");
      return;
    }
    setLoading(tid);
    try {
      await bhumiApi.chainAction({
        action: "registrarFinalize",
        registrar: DEMO_WALLETS.registrar,
        transferId: tid,
      });
      await bhumiApi.scanFraud({ transferId: tid, parcelId });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Finalize failed");
    } finally {
      setLoading(null);
    }
  };

  const runDocCheck = async (tid: number, parcelId: number) => {
    try {
      const data = await bhumiApi.getParcel(parcelId);
      if (data.document) {
        const report = await bhumiApi.verifyDocument({
          url: data.document.url,
          parcelId,
        });
        setReports((r) => ({ ...r, [tid]: report }));
      }
    } catch {
      // no document
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Registrar Transfer Queue"
        hindiTitle="पंजीयक हस्तांतरण कतार"
        subtitle="Review documents, AI integrity reports, and finalize on-chain with cryptographic signature"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transfers" }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-5">
          {transfers.length === 0 && (
            <p className="gov-card p-6 text-center text-gov-muted">No pending registrar transfers</p>
          )}
          {transfers.map((t) => (
            <div key={t.id} className="gov-card-elevated p-6">
              <p className="font-mono font-bold text-gov-blue">Transfer #{t.id}</p>
              <p className="text-sm text-gov-muted mt-1">
                Parcel {t.parcelId} · {shortenAddress(t.seller)} → {shortenAddress(t.buyer)}
              </p>
              <p className="text-xs text-gov-muted mt-1">Status: {t.status}</p>

              {reports[t.id] && <div className="mt-4"><DocumentIntegrityReport report={reports[t.id]} /></div>}

              <div className="flex gap-3 mt-4 flex-wrap">
                <button onClick={() => runDocCheck(t.id, t.parcelId)} className="gov-btn-secondary text-sm">
                  Run AI Integrity Check
                </button>
                <button
                  onClick={() => finalize(t.id, t.parcelId)}
                  disabled={loading === t.id || t.status !== "PendingRegistrar"}
                  className="gov-btn-primary text-sm disabled:opacity-40"
                >
                  {loading === t.id ? "Finalizing…" : "Finalize on Chain"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

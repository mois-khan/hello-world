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
  const [aiLoading, setAiLoading] = useState<number | null>(null);

  const load = () => {
    bhumiApi.getTransfers(DEMO_WALLETS.registrar, "REGISTRAR").then(setTransfers).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const finalize = async (tid: number, parcelId: number) => {
    const report = reports[tid];
    if (report && (report.verdict === "LIKELY_FORGED" || report.riskScore >= 70)) {
      alert("Cannot finalize — document flagged as LIKELY_FORGED.");
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

  const reject = async (tid: number) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setLoading(tid);
    try {
      await bhumiApi.chainAction({
        action: "reject",
        actor: DEMO_WALLETS.registrar,
        transferId: tid,
        reason,
      });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setLoading(null);
    }
  };

  const runDocCheck = async (tid: number, parcelId: number) => {
    setAiLoading(tid);
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
      alert("Failed to run AI check.");
    } finally {
      setAiLoading(null);
    }
  };

  const awaitingBuyer = transfers.filter(t => t.status === "PendingBuyer");
  const aiQueue = transfers.filter(t => t.status === "PendingRegistrar" && !reports[t.id]);
  const readyForReview = transfers.filter(t => t.status === "PendingRegistrar" && reports[t.id]);
  const archived = transfers.filter(t => t.status === "Completed" || t.status === "Rejected");

  const renderCard = (t: TransferRequest) => (
    <div key={t.id} className="bg-white p-4 rounded-md shadow-sm border border-slate-200 flex flex-col gap-3">
      <div>
        <p className="font-mono font-bold text-gov-blue text-sm">Transfer #{t.id}</p>
        <p className="text-xs text-gov-muted mt-1">
          Parcel {t.parcelId} <br/> {shortenAddress(t.seller)} → {shortenAddress(t.buyer)}
        </p>
      </div>

      {reports[t.id] && (
        <div className="mt-1">
          <DocumentIntegrityReport report={reports[t.id]} />
        </div>
      )}

      {t.status === "PendingRegistrar" && (
        <div className="flex flex-col gap-2 mt-2">
          {!reports[t.id] && (
            <button
              onClick={() => runDocCheck(t.id, t.parcelId)}
              disabled={aiLoading === t.id}
              className="gov-btn-secondary text-xs py-1.5 w-full justify-center disabled:opacity-50"
            >
              {aiLoading === t.id ? "Analyzing..." : "Run AI Check"}
            </button>
          )}
          
          {reports[t.id] && (
            <button
              onClick={() => finalize(t.id, t.parcelId)}
              disabled={loading === t.id}
              className="gov-btn-primary text-xs py-1.5 w-full justify-center disabled:opacity-50"
            >
              {loading === t.id ? "Finalizing..." : "Approve & Finalize"}
            </button>
          )}
          
          <button
            onClick={() => reject(t.id)}
            disabled={loading === t.id}
            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md font-semibold text-xs disabled:opacity-40 transition-colors text-center"
          >
            Reject Transfer
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Registrar War Room"
        hindiTitle="पंजीयक वार रूम"
        subtitle="Secure Kanban board to review AI Fraud Reports and approve land transfers"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "War Room" }]}
      />

      <main id="main-content" className="flex-1 p-4 md:p-8 overflow-x-auto">
        <div className="flex flex-nowrap gap-6 min-w-max md:min-w-0 md:grid md:grid-cols-4 md:gap-6 h-full items-start">
          
          {/* Column 1 */}
          <div className="w-80 md:w-auto flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-semibold text-slate-700">1. Awaiting Citizen</h3>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">{awaitingBuyer.length}</span>
            </div>
            {awaitingBuyer.map(renderCard)}
            {awaitingBuyer.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No pending transfers</p>}
          </div>

          {/* Column 2 */}
          <div className="w-80 md:w-auto flex flex-col gap-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <div className="flex justify-between items-center pb-2 border-b border-amber-200">
              <h3 className="font-semibold text-amber-800">2. AI Queue</h3>
              <span className="bg-amber-200 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">{aiQueue.length}</span>
            </div>
            {aiQueue.map(renderCard)}
            {aiQueue.length === 0 && <p className="text-xs text-amber-500/50 italic text-center py-4">No documents to scan</p>}
          </div>

          {/* Column 3 */}
          <div className="w-80 md:w-auto flex flex-col gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
              <h3 className="font-semibold text-emerald-800">3. Ready for Review</h3>
              <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">{readyForReview.length}</span>
            </div>
            {readyForReview.map(renderCard)}
            {readyForReview.length === 0 && <p className="text-xs text-emerald-500/50 italic text-center py-4">No transfers ready</p>}
          </div>

          {/* Column 4 */}
          <div className="w-80 md:w-auto flex flex-col gap-4 bg-slate-100 p-4 rounded-xl border border-slate-300">
            <div className="flex justify-between items-center pb-2 border-b border-slate-300">
              <h3 className="font-semibold text-slate-600">4. Archived</h3>
              <span className="bg-slate-300 text-slate-700 text-xs px-2 py-1 rounded-full font-bold">{archived.length}</span>
            </div>
            {archived.map(renderCard)}
            {archived.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No recent archives</p>}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

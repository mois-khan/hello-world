"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { bhumiApi } from "@/lib/api-client";
import { connectWallet, getConnectedAddress, shortenAddress } from "@/lib/wallet";
import type { TransferRequest, Parcel } from "@/lib/types";
import { FileSignature, Eye, PenTool } from "lucide-react";

function StampDutyChallan({ parcel }: { parcel: Parcel }) {
  const baseRate = 5000;
  const propertyValue = parcel.area * baseRate;
  const stampDuty = propertyValue * 0.06;
  const regFee = propertyValue * 0.01;
  const total = propertyValue + stampDuty + regFee;

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="mt-4 border-2 border-dashed border-gov-blue/30 bg-gov-blue-light/10 p-5 rounded-lg relative overflow-hidden shadow-inner">
      <div className="absolute top-0 right-0 bg-gov-blue text-white text-[10px] px-3 py-1 font-bold uppercase tracking-wider rounded-bl-lg">Official Challan</div>
      <h4 className="font-bold text-gov-navy text-sm mb-4 border-b border-gov-blue/20 pb-2 flex items-center gap-2">
        <FileSignature className="w-4 h-4 text-gov-blue" />
        State Stamp Duty & Registration Assessment
      </h4>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gov-muted">
          <span>Property Area</span>
          <span>{parcel.area} sq.ft</span>
        </div>
        <div className="flex justify-between text-gov-muted">
          <span>Estimated Circle Rate (₹{baseRate}/sq.ft)</span>
          <span>{formatINR(propertyValue)}</span>
        </div>
        <div className="flex justify-between text-gov-muted">
          <span>State Stamp Duty (6%)</span>
          <span className="text-red-600 font-medium">+{formatINR(stampDuty)}</span>
        </div>
        <div className="flex justify-between text-gov-muted border-b border-gov-blue/20 pb-3">
          <span>Registration Fee (1%)</span>
          <span className="text-red-600 font-medium">+{formatINR(regFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-gov-navy pt-1 text-lg">
          <span>Total Payable</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>
      <p className="text-[11px] text-gov-muted mt-4 text-center italic bg-white/50 p-2 rounded">
        By cryptographically signing this transfer, the Total Payable amount will be automatically deducted from your linked wallet and remitted to the State Revenue Department.
      </p>
    </div>
  );
}

export default function ApprovalsPage() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [parcels, setParcels] = useState<Record<number, Parcel>>({});
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState<number | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null);
  const [generatedDocHashes, setGeneratedDocHashes] = useState<{ [key: number]: string }>({});
  const [generatedHtmls, setGeneratedHtmls] = useState<{ [key: number]: string }>({});

  const load = async (w: string) => {
    const data = await bhumiApi.getTransfers(w);
    const pending = data.filter((t) => t.status === "PendingBuyer");
    setTransfers(pending);

    const parcelMap: Record<number, Parcel> = {};
    for (const t of pending) {
      if (!parcelMap[t.parcelId]) {
        try {
          const res = await bhumiApi.getParcel(t.parcelId);
          parcelMap[t.parcelId] = res.parcel;
        } catch {}
      }
    }
    setParcels(parcelMap);
  };

  useEffect(() => {
    connectWallet()
      .then(({ address }) => { setWallet(address); return load(address); })
      .catch(() => load(""));
  }, []);

  const handleGeneratePdf = async (tid: number, parcelId: number) => {

    setGeneratingPdf(tid);
    try {
      const res = await fetch("/api/document/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign-buyer",
          parcelId
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDocHashes(prev => ({ ...prev, [tid]: data.documentHash }));
        setGeneratedHtmls(prev => ({ ...prev, [tid]: data.html }));
      }
    } catch (e) {
      console.error("Failed to generate PDF", e);
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handlePrintDocument = async (tid: number) => {
    const html = generatedHtmls[tid];
    if (!html) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.createElement('div');
    element.innerHTML = html;
    html2pdf().from(element).set({
      margin: 10,
      filename: `Final_TitleDeed_${tid}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  const approve = async (tid: number) => {
    const hash = generatedDocHashes[tid];
    if (!hash) return;
    setLoading(tid);
    try {
      const addr = wallet || getConnectedAddress() || "";
      await bhumiApi.chainAction({ action: "buyerApprove", buyer: addr, transferId: tid, finalDocumentHash: hash });
      await load(addr);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setLoading(null);
    }
  };

  const reject = async (tid: number) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setLoading(tid);
    try {
      const addr = wallet || getConnectedAddress() || "";
      await bhumiApi.chainAction({ action: "reject", actor: addr, transferId: tid, reason });
      await load(addr);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Buyer Approvals"
        hindiTitle="खरीदार अनुमोदन"
        subtitle="Review Stamp Duty Challans and cryptographically sign incoming property transfers"
        breadcrumbs={[{ label: "Buyer Approvals" }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {transfers.length === 0 && (
            <p className="gov-card p-6 text-center text-gov-muted">No pending approvals for your wallet</p>
          )}
          {transfers.map((t) => (
            <div key={t.id} className="gov-card p-6 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-4 flex-wrap border-b border-gov-border pb-4">
                <div>
                  <p className="font-bold text-gov-navy text-lg">Transfer #{t.id}</p>
                  <p className="text-sm text-gov-muted mt-1">
                    Parcel {t.parcelId} · Seller {shortenAddress(t.seller)} → You
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(t.id)}
                    disabled={loading === t.id || !generatedDocHashes[t.id]}
                    className="gov-btn-primary text-sm disabled:opacity-40"
                  >
                    {loading === t.id ? "Signing…" : "Pay & Approve Transfer"}
                  </button>
                  <button
                    onClick={() => reject(t.id)}
                    disabled={loading === t.id}
                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md font-semibold text-sm disabled:opacity-40 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {parcels[t.parcelId] && <StampDutyChallan parcel={parcels[t.parcelId]} />}
              
              {!generatedDocHashes[t.id] ? (
                <button
                  onClick={() => handleGeneratePdf(t.id, t.parcelId)}
                  disabled={generatingPdf === t.id}
                  className="gov-btn-secondary mt-4 max-w-sm flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {generatingPdf === t.id ? "Generating Final Deed..." : "Sign & Generate Deed"} <PenTool className="w-4 h-4" />
                </button>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-card flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-800 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Final Deed Generated
                      </p>
                      <p className="text-xs text-green-700 mt-1">Hash: {generatedDocHashes[t.id].slice(0, 16)}...</p>
                    </div>
                    <button
                      onClick={() => handlePrintDocument(t.id)}
                      className="text-sm font-semibold text-green-700 hover:underline"
                    >
                      Print / Save as PDF
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

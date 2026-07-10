"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { bhumiApi } from "@/lib/api-client";
import { connectWallet } from "@/lib/wallet";
import type { TransferRequest } from "@/lib/types";
import { shortenAddress } from "@/lib/wallet";

export default function ApprovalsPage() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState<number | null>(null);

  const load = async (w: string) => {
    const data = await bhumiApi.getTransfers(w);
    setTransfers(data.filter((t) => t.status === "PendingBuyer"));
  };

  useEffect(() => {
    connectWallet()
      .then(({ address }) => { setWallet(address); return load(address); })
      .catch(() => load(""));
  }, []);

  const approve = async (tid: number) => {
    setLoading(tid);
    try {
      const addr = wallet || (await connectWallet()).address;
      await bhumiApi.chainAction({ action: "buyerApprove", buyer: addr, transferId: tid });
      await load(addr);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Approval failed");
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
        subtitle="Review and cryptographically sign incoming property transfers"
        breadcrumbs={[{ label: "Buyer Approvals" }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {transfers.length === 0 && (
            <p className="gov-card p-6 text-center text-gov-muted">No pending approvals for your wallet</p>
          )}
          {transfers.map((t) => (
            <div key={t.id} className="gov-card p-5 flex justify-between items-center gap-4 flex-wrap">
              <div>
                <p className="font-semibold">Transfer #{t.id} · Parcel {t.parcelId}</p>
                <p className="text-sm text-gov-muted">
                  Seller {shortenAddress(t.seller)} → You
                </p>
              </div>
              <button
                onClick={() => approve(t.id)}
                disabled={loading === t.id}
                className="gov-btn-primary text-sm disabled:opacity-40"
              >
                {loading === t.id ? "Signing…" : "Review & Sign"}
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

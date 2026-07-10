"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { DEMO_WALLETS } from "@/lib/demo-constants";

export default function AdminPage() {
  const [wallet, setWallet] = useState("");
  const [message, setMessage] = useState("");

  const grantRole = async () => {
    setMessage(`REGISTRAR_ROLE grant queued for ${wallet}. On Hardhat: use deployer account to call grantRole on LandRegistry.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Government Admin Panel"
        hindiTitle="सरकारी व्यवस्थापक पैनल"
        subtitle="Grant or revoke REGISTRAR_ROLE on the permissioned blockchain network"
        breadcrumbs={[{ label: "Admin" }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-lg mx-auto gov-card-elevated p-6 space-y-4">
          <p className="text-sm text-gov-muted">
            Default admin (Hardhat account #0): <code className="text-xs">{DEMO_WALLETS.registrar}</code>
          </p>
          <div>
            <label className="metric-label">Wallet to grant REGISTRAR_ROLE</label>
            <input
              className="gov-input mt-1 font-mono text-sm"
              placeholder="0x…"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
          </div>
          <button onClick={grantRole} className="gov-btn-primary w-full" disabled={!wallet}>
            Grant Registrar Role
          </button>
          {message && <p className="gov-disclaimer text-sm">{message}</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}

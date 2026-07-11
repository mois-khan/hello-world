"use client";

import { useState, useEffect, useCallback } from "react";
import { connectWallet, getConnectedAddress, shortenAddress, disconnectWallet } from "@/lib/wallet";
import { Wallet, LogOut } from "lucide-react";

import { DEMO_WALLETS } from "@/lib/demo-constants";

const WALLET_NAMES: Record<string, string> = {
  [DEMO_WALLETS.registrar.toLowerCase()]: "Registrar Rao",
  [DEMO_WALLETS.seller.toLowerCase()]: "Rahul Sharma (Seller)",
  [DEMO_WALLETS.buyer.toLowerCase()]: "Priya Patel (Buyer)",
  [DEMO_WALLETS.owner3.toLowerCase()]: "Owner 3",
  [DEMO_WALLETS.userA.toLowerCase()]: "User A",
  [DEMO_WALLETS.userB.toLowerCase()]: "User B",
};

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAddress(getConnectedAddress());
    
    const handleConnect = (e: any) => setAddress(e.detail);
    const handleDisconnect = () => setAddress(null);
    
    window.addEventListener("wallet_connected", handleConnect);
    window.addEventListener("wallet_disconnected", handleDisconnect);
    return () => {
      window.removeEventListener("wallet_connected", handleConnect);
      window.removeEventListener("wallet_disconnected", handleDisconnect);
    };
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { address: addr } = await connectWallet();
      setAddress(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setAddress(null);
    window.location.reload();
  }, []);

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600 hidden lg:inline">{error}</span>}
      {address ? (
        <div className="flex items-center gap-2 bg-slate-100 rounded border border-slate-200 pl-3 pr-1 py-1">
          <Wallet className="w-3.5 h-3.5 text-gov-navy" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gov-navy leading-none mb-0.5">{WALLET_NAMES[address.toLowerCase()] || "Citizen"}</span>
            <span className="text-[10px] font-mono text-gov-muted leading-none">{shortenAddress(address)}</span>
          </div>
          <button 
            onClick={disconnect}
            className="p-1 ml-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-600 transition-colors"
            title="Disconnect Wallet"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="gov-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Wallet className="w-3.5 h-3.5" />
          {loading ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}

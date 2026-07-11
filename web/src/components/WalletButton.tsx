"use client";

import { useState, useEffect, useCallback } from "react";
import { connectWallet, getConnectedAddress, shortenAddress, disconnectWallet } from "@/lib/wallet";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

import { DEMO_WALLETS } from "@/lib/demo-constants";

const WALLET_NAMES: Record<string, string> = {
  [DEMO_WALLETS.registrar.toLowerCase()]: "Registrar",
  [DEMO_WALLETS.seller.toLowerCase()]: "Sanjana (Seller)",
  [DEMO_WALLETS.buyer.toLowerCase()]: "Yogesh (Buyer)",
};

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

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
      setShowDropdown(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const connectDemo = useCallback(async (demoAddress: string) => {
    setLoading(true);
    setError("");
    try {
      const { address: addr } = await connectWallet(demoAddress);
      setAddress(addr);
      setShowDropdown(false);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo connection failed");
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
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
            className="gov-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            {loading ? "Connecting…" : "Select Persona"}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden z-50">
              <button
                onClick={() => connectDemo(DEMO_WALLETS.seller)}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 border-b border-slate-100"
              >
                <div className="font-semibold text-gov-navy">Sanjana (Seller)</div>
                <div className="text-[10px] text-gov-muted font-mono mt-0.5">{shortenAddress(DEMO_WALLETS.seller)}</div>
              </button>
              <button
                onClick={() => connectDemo(DEMO_WALLETS.buyer)}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 border-b border-slate-100"
              >
                <div className="font-semibold text-gov-navy">Yogesh (Buyer)</div>
                <div className="text-[10px] text-gov-muted font-mono mt-0.5">{shortenAddress(DEMO_WALLETS.buyer)}</div>
              </button>
              <button
                onClick={() => connectDemo(DEMO_WALLETS.registrar)}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 border-b border-slate-100"
              >
                <div className="font-semibold text-gov-navy">Registrar</div>
                <div className="text-[10px] text-gov-muted font-mono mt-0.5">{shortenAddress(DEMO_WALLETS.registrar)}</div>
              </button>
              <button
                onClick={connect}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 bg-slate-50/50 flex justify-between items-center"
              >
                <span className="font-medium text-slate-700">Real MetaMask</span>
                <Wallet className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

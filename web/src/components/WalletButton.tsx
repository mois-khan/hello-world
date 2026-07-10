"use client";

import { useState, useEffect, useCallback } from "react";
import { connectWallet, getConnectedAddress, shortenAddress } from "@/lib/wallet";
import { Wallet } from "lucide-react";

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAddress(getConnectedAddress());
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

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600 hidden lg:inline">{error}</span>}
      <button
        onClick={connect}
        disabled={loading}
        className="gov-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
      >
        <Wallet className="w-3.5 h-3.5" />
        {address ? shortenAddress(address) : loading ? "Connecting…" : "Connect Wallet"}
      </button>
    </div>
  );
}

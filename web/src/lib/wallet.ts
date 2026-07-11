"use client";

import { BrowserProvider, type Signer } from "ethers";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);

let cachedAddress: string | null = null;
let cachedProvider: BrowserProvider | null = null;

export async function connectWallet(mockAddress?: string): Promise<{ address: string }> {
  if (mockAddress) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("demo_wallet_address", mockAddress);
      cachedAddress = mockAddress;
      window.dispatchEvent(new CustomEvent("wallet_connected", { detail: mockAddress }));
    }
    return { address: mockAddress };
  }

  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Install MetaMask or use demo mode.");
  }
  await ensureCorrectNetwork();
  if (!cachedProvider) {
    cachedProvider = new BrowserProvider(window.ethereum);
  }
  const accounts = await cachedProvider.send("eth_requestAccounts", []);
  cachedAddress = accounts[0];
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("demo_wallet_address");
    window.dispatchEvent(new CustomEvent("wallet_connected", { detail: accounts[0] }));
  }
  return { address: accounts[0] };
}

export function getConnectedAddress(): string | null {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("demo_wallet_address");
    if (stored) return stored;
  }
  return cachedAddress;
}

export function disconnectWallet(): void {
  cachedAddress = null;
  cachedProvider = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("demo_wallet_address");
    window.dispatchEvent(new Event("wallet_disconnected"));
  }
}

export async function ensureCorrectNetwork(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) return;
  const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
  const current = parseInt(chainIdHex as string, 16);
  if (current === CHAIN_ID) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
    });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${CHAIN_ID.toString(16)}`,
            chainName: "BhuRaksha Local",
            rpcUrls: [process.env.NEXT_PUBLIC_CHAIN_RPC || "http://127.0.0.1:8545"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      selectedAddress?: string | null;
    };
  }
}

"use client";

import { BrowserProvider, type Signer } from "ethers";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);

let cachedAddress: string | null = null;
let cachedProvider: BrowserProvider | null = null;

export async function connectWallet(): Promise<{ address: string; signer: Signer }> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Install MetaMask or use demo mode.");
  }
  await ensureCorrectNetwork();
  if (!cachedProvider) {
    cachedProvider = new BrowserProvider(window.ethereum);
  }
  const accounts = await cachedProvider.send("eth_requestAccounts", []);
  const signer = await cachedProvider.getSigner();
  cachedAddress = accounts[0];
  return { address: accounts[0], signer };
}

export function getConnectedAddress(): string | null {
  return cachedAddress;
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
    };
  }
}

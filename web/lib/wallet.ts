import { BrowserProvider, Signer } from 'ethers';

export async function connectWallet(): Promise<{ address: string; signer: Signer }> {
  if (!(window as any).ethereum) throw new Error("MetaMask not found");
  await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { address, signer };
}

export function getConnectedAddress(): string | null {
  return (window as any).ethereum?.selectedAddress || null;
}

export async function ensureCorrectNetwork(): Promise<void> {
  if (!(window as any).ethereum) return;
  const chainId = '0x' + (31337).toString(16);
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId,
          chainName: 'BhoomiChain Local',
          rpcUrls: [process.env.NEXT_PUBLIC_CHAIN_RPC || 'http://127.0.0.1:8545'],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
        }]
      });
    } else {
      throw err;
    }
  }
}

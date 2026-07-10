import { JsonRpcProvider, Contract, BrowserProvider, Signer, Provider } from 'ethers';
import { Parcel, TransferRequest, TimelineEvent } from './types';
import abi from './contract-abi.json';

const rpcUrl = process.env.NEXT_PUBLIC_CHAIN_RPC || 'http://127.0.0.1:8545';
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(rpcUrl);
}

export function getContract(runner?: Signer | Provider): Contract {
  const providerOrSigner = runner || getProvider();
  return new Contract(contractAddress, abi, providerOrSigner);
}

export async function registerParcel(
  signer: Signer,
  args: { owner: string; surveyNumber: string; district: string; geo: string; area: number; documentHash: string }
): Promise<{ parcelId: number; txHash: string }> {
  const contract = getContract(signer);
  const tx = await contract.registerParcel(args.owner, args.surveyNumber, args.district, args.geo, args.area, args.documentHash);
  const receipt = await tx.wait();
  return { parcelId: 1, txHash: receipt.hash };
}

export async function initiateTransfer(
  signer: Signer, parcelId: number, buyer: string, newDocumentHash: string
): Promise<{ transferId: number; txHash: string }> {
  const contract = getContract(signer);
  const tx = await contract.initiateTransfer(parcelId, buyer, newDocumentHash);
  const receipt = await tx.wait();
  return { transferId: 1, txHash: receipt.hash };
}

export async function buyerApprove(signer: Signer, transferId: number): Promise<{ txHash: string }> {
  const contract = getContract(signer);
  const tx = await contract.buyerApprove(transferId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function registrarFinalize(signer: Signer, transferId: number): Promise<{ txHash: string }> {
  const contract = getContract(signer);
  const tx = await contract.registrarFinalize(transferId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function rejectTransfer(signer: Signer, transferId: number, reason: string): Promise<{ txHash: string }> {
  const contract = getContract(signer);
  const tx = await contract.rejectTransfer(transferId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function getParcel(id: number): Promise<Parcel> {
  const contract = getContract();
  return await contract.parcels(id);
}

export async function ownerOf(id: number): Promise<string> {
  const contract = getContract();
  return await contract.ownerOf(id);
}

export async function getTransfer(id: number): Promise<TransferRequest> {
  const contract = getContract();
  return await contract.transfers(id);
}

export async function activeTransferOf(parcelId: number): Promise<number> {
  const contract = getContract();
  return await contract.activeTransferOf(parcelId);
}

export async function isRegistrar(address: string): Promise<boolean> {
  const contract = getContract();
  const REGISTRAR_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'; // Should be keccak256("REGISTRAR_ROLE")
  return await contract.hasRole(REGISTRAR_ROLE, address);
}

export async function getHistory(parcelId: number): Promise<TimelineEvent[]> {
  return [];
}

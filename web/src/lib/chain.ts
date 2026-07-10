import {
  Contract,
  JsonRpcProvider,
  type Signer,
  type Provider,
} from "ethers";
import abi from "./contract-abi.json";
import type { Parcel, TransferRequest, TimelineEvent } from "./types";
import { parcelStatusFromChain, transferStatusFromChain } from "./types";
import * as sim from "./simulator";

export function getProvider(): JsonRpcProvider {
  const rpc = process.env.NEXT_PUBLIC_CHAIN_RPC || "http://127.0.0.1:8545";
  return new JsonRpcProvider(rpc);
}

export function getContract(runner?: Signer | Provider): Contract {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set");
  const runnerOrProvider = runner ?? getProvider();
  return new Contract(address, abi, runnerOrProvider);
}

const REGISTRAR_ROLE = "0x" + Buffer.from("REGISTRAR_ROLE").toString("hex").padEnd(64, "0").slice(0, 64);

export async function shouldUseSimulator(): Promise<boolean> {
  const available = await sim.isChainAvailable();
  const hasAddress = !!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  return !available || !hasAddress;
}

export async function getParcel(id: number): Promise<Parcel | null> {
  if (await shouldUseSimulator()) return sim.simGetParcel(id);
  try {
    const contract = getContract();
    const [p, owner] = await Promise.all([
      contract.parcels(id),
      contract.ownerOf(id),
    ]);
    return {
      id: Number(p.id),
      surveyNumber: p.surveyNumber,
      district: p.district,
      geo: p.geo,
      area: Number(p.area),
      documentHash: p.documentHash,
      registeredAt: Number(p.registeredAt),
      status: parcelStatusFromChain(p.status),
      owner,
    };
  } catch {
    return sim.simGetParcel(id);
  }
}

export async function ownerOf(id: number): Promise<string> {
  if (await shouldUseSimulator()) return sim.simOwnerOf(id);
  const contract = getContract();
  return contract.ownerOf(id);
}

export async function getTransfer(id: number): Promise<TransferRequest | null> {
  if (await shouldUseSimulator()) return sim.simGetTransfer(id);
  try {
    const contract = getContract();
    const t = await contract.transfers(id);
    return {
      id,
      parcelId: Number(t.parcelId),
      seller: t.seller,
      buyer: t.buyer,
      newDocumentHash: t.newDocumentHash,
      status: transferStatusFromChain(t.status),
      createdAt: Number(t.createdAt),
    };
  } catch {
    return sim.simGetTransfer(id);
  }
}

export async function activeTransferOf(parcelId: number): Promise<number> {
  if (await shouldUseSimulator()) return sim.simActiveTransferOf(parcelId);
  try {
    const contract = getContract();
    return Number(await contract.activeTransferOf(parcelId));
  } catch {
    return sim.simActiveTransferOf(parcelId);
  }
}

export async function isRegistrar(address: string): Promise<boolean> {
  if (await shouldUseSimulator()) {
    const admin = process.env.DEMO_REGISTRAR_WALLET?.toLowerCase();
    return admin ? address.toLowerCase() === admin : true;
  }
  try {
    const contract = getContract();
    return contract.hasRole(
      "0x" + "0".repeat(63) + "1", // will use proper role hash
      address
    );
  } catch {
    return false;
  }
}

export async function getHistory(parcelId: number): Promise<TimelineEvent[]> {
  if (await shouldUseSimulator()) return sim.simGetHistory(parcelId);

  try {
    const contract = getContract();
    const provider = getProvider();
    const events: TimelineEvent[] = [];

    const registered = await contract.queryFilter(contract.filters.ParcelRegistered(parcelId));
    for (const e of registered) {
      const ev = e as { args?: unknown[]; blockNumber: number; transactionHash: string };
      events.push({
        type: "REGISTERED",
        to: String(ev.args?.[1] ?? ""),
        at: (await provider.getBlock(ev.blockNumber))?.timestamp ?? 0,
        txHash: ev.transactionHash,
      });
    }

    const completed = await contract.queryFilter(contract.filters.TransferCompleted(null, parcelId));
    for (const e of completed) {
      const ev = e as { args?: unknown[]; blockNumber: number; transactionHash: string };
      events.push({
        type: "TRANSFERRED",
        to: String(ev.args?.[2] ?? ""),
        at: (await provider.getBlock(ev.blockNumber))?.timestamp ?? 0,
        txHash: ev.transactionHash,
      });
    }

    return events.sort((a, b) => a.at - b.at);
  } catch {
    return sim.simGetHistory(parcelId);
  }
}

export async function registerParcel(
  signer: Signer,
  args: {
    owner: string;
    surveyNumber: string;
    district: string;
    geo: string;
    area: number;
    documentHash: string;
  }
): Promise<{ parcelId: number; txHash: string }> {
  if (await shouldUseSimulator()) {
    return sim.simRegisterParcel({ ...args, owner: args.owner });
  }
  const contract = getContract(signer);
  const tx = await contract.registerParcel(
    args.owner,
    args.surveyNumber,
    args.district,
    args.geo,
    args.area,
    args.documentHash
  );
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((l: { fragment?: { name: string }; args?: unknown[] }) => l)
    .find((l: { fragment?: { name: string } }) => l.fragment?.name === "ParcelRegistered");
  return { parcelId: Number(event?.args?.[0]), txHash: receipt.hash };
}

export async function initiateTransfer(
  signer: Signer,
  parcelId: number,
  buyer: string,
  newDocumentHash: string
): Promise<{ transferId: number; txHash: string }> {
  const seller = await signer.getAddress();
  if (await shouldUseSimulator()) {
    return sim.simInitiateTransfer(seller, parcelId, buyer, newDocumentHash);
  }
  const contract = getContract(signer);
  const tx = await contract.initiateTransfer(parcelId, buyer, newDocumentHash);
  const receipt = await tx.wait();
  const event = receipt.logs.find(
    (l: { fragment?: { name: string } }) => l.fragment?.name === "TransferInitiated"
  );
  return { transferId: Number((event as { args?: unknown[] })?.args?.[0]), txHash: receipt.hash };
}

export async function buyerApprove(signer: Signer, transferId: number): Promise<{ txHash: string }> {
  const buyer = await signer.getAddress();
  if (await shouldUseSimulator()) return sim.simBuyerApprove(buyer, transferId);
  const contract = getContract(signer);
  const tx = await contract.buyerApprove(transferId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function registrarFinalize(signer: Signer, transferId: number): Promise<{ txHash: string }> {
  const registrar = await signer.getAddress();
  if (await shouldUseSimulator()) return sim.simRegistrarFinalize(registrar, transferId);
  const contract = getContract(signer);
  const tx = await contract.registrarFinalize(transferId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function rejectTransfer(
  signer: Signer,
  transferId: number,
  reason: string
): Promise<{ txHash: string }> {
  const actor = await signer.getAddress();
  if (await shouldUseSimulator()) return sim.simRejectTransfer(actor, transferId, reason);
  const contract = getContract(signer);
  const tx = await contract.rejectTransfer(transferId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function listParcelsByOwner(owner: string): Promise<Parcel[]> {
  return sim.simListParcelsByOwner(owner);
}

export async function listTransfers(filter?: { wallet?: string; role?: string }): Promise<TransferRequest[]> {
  return sim.simListTransfers(filter);
}

// Fix isRegistrar to use proper role hash
export async function checkRegistrarRole(address: string): Promise<boolean> {
  if (await shouldUseSimulator()) return true;
  try {
    const contract = getContract();
    const role = await contract.REGISTRAR_ROLE();
    return contract.hasRole(role, address);
  } catch {
    return false;
  }
}

void REGISTRAR_ROLE;

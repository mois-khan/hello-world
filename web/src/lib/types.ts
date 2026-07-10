export type Role = "CITIZEN" | "REGISTRAR" | "ADMIN";

export type ParcelStatus = "Active" | "InTransfer";
export type TransferStatus = "None" | "PendingBuyer" | "PendingRegistrar" | "Completed" | "Rejected";

export interface Parcel {
  id: number;
  surveyNumber: string;
  district: string;
  geo: string;
  area: number;
  documentHash: string;
  registeredAt: number;
  status: ParcelStatus;
  owner: string;
  ownerName?: string;
  ulpin?: string;
}

export interface ParcelMeta {
  id: number;
  surveyNumber: string;
  district: string;
  addressText: string;
  lat: number;
  lng: number;
  area: number;
  currentDocId: string | null;
  ulpin?: string;
  ownerWallet?: string;
}

export interface TransferRequest {
  id: number;
  parcelId: number;
  seller: string;
  buyer: string;
  newDocumentHash: string;
  status: TransferStatus;
  createdAt: number;
}

export interface AiReport {
  hashMatch: boolean | null;
  sha256: string;
  riskScore: number;
  verdict: "LIKELY_GENUINE" | "SUSPICIOUS" | "LIKELY_FORGED";
  indicators: {
    fontConsistency: string;
    sealIntegrity: string;
    digitalArtifacts: string;
    numeralTampering: string;
  };
  reasons: string[];
  model: string;
}

export type FraudType = "DOUBLE_SALE" | "OWNERSHIP_MISMATCH" | "RAPID_FLIP" | "FORGED_DOC";
export type Severity = "LOW" | "MED" | "HIGH";

export interface FraudAlert {
  id: string;
  parcelId: number;
  type: FraudType;
  severity: Severity;
  detail: string;
  resolved: boolean;
  createdAt: string;
}

export interface UploadResult {
  url: string;
  sha256: string;
}

export interface TimelineEvent {
  type: "REGISTERED" | "TRANSFERRED" | "INITIATED" | "APPROVED" | "REJECTED";
  from?: string;
  to: string;
  at: number;
  txHash: string;
  role?: string;
  reason?: string;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const PARCEL_STATUS_MAP = ["Active", "InTransfer"] as const;
export const TRANSFER_STATUS_MAP = ["None", "PendingBuyer", "PendingRegistrar", "Completed", "Rejected"] as const;

export function parcelStatusFromChain(value: number | bigint): ParcelStatus {
  return PARCEL_STATUS_MAP[Number(value)] ?? "Active";
}

export function transferStatusFromChain(value: number | bigint): TransferStatus {
  return TRANSFER_STATUS_MAP[Number(value)] ?? "None";
}

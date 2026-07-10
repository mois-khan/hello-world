export type Role = "CITIZEN" | "REGISTRAR" | "ADMIN";

export type ParcelStatus = "Active" | "InTransfer";
export type TransferStatus = "None" | "PendingBuyer" | "PendingRegistrar" | "Completed" | "Rejected";

export interface Parcel {
  id: number;
  surveyNumber: string;
  district: string;
  geo: string;            // "lat,lng"
  area: number;           // sq ft
  documentHash: string;   // 0x-prefixed bytes32
  registeredAt: number;   // unix seconds (from chain)
  status: ParcelStatus;
  owner: string;          // wallet address (from ownerOf)
}

export interface ParcelMeta {
  id: number;             // == on-chain parcelId
  surveyNumber: string;
  district: string;
  addressText: string;
  lat: number;
  lng: number;
  area: number;
  currentDocId: string | null;
}

export interface TransferRequest {
  id: number;             // == on-chain transferId
  parcelId: number;
  seller: string;
  buyer: string;
  newDocumentHash: string;
  status: TransferStatus;
  createdAt: number;
}

export interface AiReport {
  hashMatch: boolean | null;   // null if no prior on-chain hash to compare
  sha256: string;
  riskScore: number;           // 0..100
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
  createdAt: string;      // ISO
}

export interface UploadResult { 
  url: string; 
  sha256: string; 
}

export interface TimelineEvent { 
  type: "REGISTERED" | "TRANSFERRED"; 
  from?: string; 
  to: string; 
  at: number; 
  txHash: string; 
}

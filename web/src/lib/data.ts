export type ParcelStatus = "active" | "pending_transfer" | "disputed" | "frozen";
export type RiskLevel = "low" | "medium" | "high";

export interface Owner {
  name: string;
  share: number;
}

export interface Parcel {
  ulpin: string;
  state: string;
  district: string;
  surveyNo: string;
  area: string;
  areaSqM: number;
  landType: string;
  status: ParcelStatus;
  owners: Owner[];
  hasLien: boolean;
  hasDispute: boolean;
  pendingTransfer?: string;
  onChain: boolean;
  lastUpdated: string;
}

export interface Transfer {
  id: string;
  ref: string;
  ulpin: string;
  seller: string;
  buyer: string;
  status: string;
  fraudScore: number;
  riskLevel: RiskLevel;
  fraudFlags: string[];
  value: number;
  createdAt: string;
}

export interface DistrictScore {
  rank: number;
  district: string;
  state: string;
  score: number;
  onChainPct: number;
  avgVerifySec: number;
  disputes: number;
}

export const DEMO_PARCELS: Record<string, Parcel> = {
  "29KA0482017452": {
    ulpin: "29KA0482017452",
    state: "Telangana",
    district: "Medak",
    surveyNo: "142/2A",
    area: "2.0 acres",
    areaSqM: 8093.71,
    landType: "Agricultural",
    status: "active",
    owners: [
      { name: "Ramesh Goud", share: 33.33 },
      { name: "Venkat Goud", share: 33.33 },
      { name: "Suresh Goud", share: 33.34 },
    ],
    hasLien: false,
    hasDispute: false,
    onChain: true,
    lastUpdated: "2026-07-08",
  },
  "27MH1234056789": {
    ulpin: "27MH1234056789",
    state: "Maharashtra",
    district: "Pune",
    surveyNo: "89/B",
    area: "1200 sq.ft",
    areaSqM: 111.48,
    landType: "Residential",
    status: "pending_transfer",
    owners: [{ name: "Suresh Patil", share: 100 }],
    hasLien: false,
    hasDispute: false,
    pendingTransfer: "TX-2840",
    onChain: true,
    lastUpdated: "2026-07-07",
  },
  "29KA0482017453": {
    ulpin: "29KA0482017453",
    state: "Telangana",
    district: "Medak",
    surveyNo: "145/1",
    area: "1.5 acres",
    areaSqM: 6070.28,
    landType: "Agricultural",
    status: "active",
    owners: [{ name: "Lakshmi Devi", share: 100 }],
    hasLien: true,
    hasDispute: false,
    onChain: true,
    lastUpdated: "2026-06-15",
  },
};

export const DEMO_TRANSFERS: Transfer[] = [
  {
    id: "tx-2847",
    ref: "TX-2847",
    ulpin: "29KA0482017452",
    seller: "Ramesh Goud",
    buyer: "Priya Sharma",
    status: "sro_review",
    fraudScore: 12,
    riskLevel: "low",
    fraudFlags: [],
    value: 2500000,
    createdAt: "2026-07-05",
  },
  {
    id: "tx-2840",
    ref: "TX-2840",
    ulpin: "27MH1234056789",
    seller: "Suresh Patil",
    buyer: "Amit Deshmukh",
    status: "sro_review",
    fraudScore: 87,
    riskLevel: "high",
    fraudFlags: ["Benami pattern", "Rapid resale", "Above circle rate"],
    value: 8500000,
    createdAt: "2026-07-07",
  },
  {
    id: "tx-2846",
    ref: "TX-2846",
    ulpin: "27MH1234056789",
    seller: "Priya Sharma",
    buyer: "Rajesh Kumar",
    status: "sro_review",
    fraudScore: 18,
    riskLevel: "low",
    fraudFlags: [],
    value: 4200000,
    createdAt: "2026-07-08",
  },
];

export const TRANSPARENCY_DATA: DistrictScore[] = [
  { rank: 1, district: "Medak", state: "Telangana", score: 94, onChainPct: 89.2, avgVerifySec: 3.2, disputes: 12 },
  { rank: 2, district: "Pune", state: "Maharashtra", score: 91, onChainPct: 85.0, avgVerifySec: 4.1, disputes: 28 },
  { rank: 3, district: "Bangalore Urban", state: "Karnataka", score: 88, onChainPct: 82.0, avgVerifySec: 4.8, disputes: 45 },
  { rank: 4, district: "Hyderabad", state: "Telangana", score: 85, onChainPct: 78.5, avgVerifySec: 5.1, disputes: 38 },
  { rank: 5, district: "Nashik", state: "Maharashtra", score: 82, onChainPct: 74.0, avgVerifySec: 5.5, disputes: 22 },
];

export const FEATURES = [
  { id: "trustseal", title: "TrustSeal", subtitle: "5-second verification", desc: "Cryptographically signed Chain-of-Title certificate" },
  { id: "double-sale", title: "Double-Sale Guard", subtitle: "Zero fraud", desc: "Blocks duplicate sales at smart contract level" },
  { id: "lienlock", title: "LienLock", subtitle: "Bank protection", desc: "Hard-blocks transfer until bank NOC received" },
  { id: "mutation", title: "MutationSync", subtitle: "< 24 hours", desc: "Auto-triggers revenue mutation on transfer" },
  { id: "vansh", title: "VanshPariksha", subtitle: "Heir consent", desc: "All co-owners must eSign before transfer" },
  { id: "shield", title: "BhumiShield", subtitle: "AI risk score", desc: "Pre-transaction fraud detection for SRO" },
  { id: "geo", title: "GeoMismatch", subtitle: "Pre-sale check", desc: "Boundary validation against Bhu-Naksha" },
  { id: "csc", title: "CSC Kiosk", subtitle: "Rural access", desc: "Assisted verification in vernacular" },
  { id: "nyay", title: "NyaySetu", subtitle: "Justice bridge", desc: "Auto-freeze + e-Courts evidence bundle" },
  { id: "transparency", title: "Transparency Index", subtitle: "Public score", desc: "District governance accountability" },
];

export function getParcel(ulpin: string): Parcel | null {
  return DEMO_PARCELS[normalizeKey(ulpin)] ?? null;
}

function normalizeKey(ulpin: string): string {
  return ulpin.replace(/-/g, "").toUpperCase();
}

export function checkDoubleSale(ulpin: string): { blocked: boolean; pendingRef?: string } {
  const parcel = getParcel(ulpin);
  if (!parcel) return { blocked: false };
  if (parcel.status === "pending_transfer" && parcel.pendingTransfer) {
    return { blocked: true, pendingRef: parcel.pendingTransfer };
  }
  return { blocked: false };
}

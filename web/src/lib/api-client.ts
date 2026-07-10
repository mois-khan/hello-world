import type {
  Parcel,
  TransferRequest,
  FraudAlert,
  AiReport,
  UploadResult,
  TimelineEvent,
  ParcelMeta,
} from "./types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "API error");
  return json.data as T;
}

export const bhumiApi = {
  getParcels: (q?: string) =>
    api<Parcel[]>(`/api/parcels${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  getParcel: (id: number | string) =>
    api<{
      parcel: Parcel;
      meta: ParcelMeta | null;
      document: { url: string; sha256: string; aiReport: AiReport | null } | null;
      history: TimelineEvent[];
    }>(`/api/parcels/${id}`),

  getTransfers: (wallet?: string, role?: string) => {
    const params = new URLSearchParams();
    if (wallet) params.set("wallet", wallet);
    if (role) params.set("role", role);
    return api<TransferRequest[]>(`/api/transfers?${params}`);
  },

  getFraudAlerts: () => api<FraudAlert[]>("/api/fraud?resolved=false"),

  uploadDocument: async (file: File, parcelId?: number) => {
    const form = new FormData();
    form.append("file", file);
    if (parcelId) form.append("parcelId", String(parcelId));
    return api<UploadResult>("/api/upload", { method: "POST", body: form });
  },

  verifyDocument: (body: { documentId?: string; url?: string; parcelId?: number }) =>
    api<AiReport>("/api/ai/verify-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  chainAction: (body: Record<string, unknown>) =>
    api<{ transferId?: number; parcelId?: number; txHash: string }>("/api/chain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  scanFraud: (body: { transferId?: number; parcelId?: number }) =>
    api<FraudAlert[]>("/api/fraud/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  getChainMode: () => api<{ mode: string }>("/api/chain"),
};

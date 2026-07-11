"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { bhumiApi } from "@/lib/api-client";
import { DEMO_WALLETS } from "@/lib/demo-constants";
import { connectWallet } from "@/lib/wallet";
import MapDynamic from "@/components/MapDynamic";

function generateRandomULPIN() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 14; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function RegisterParcelPage() {
  const [form, setForm] = useState({
    surveyNumber: "",
    district: "",
    geo: "17.75,78.05",
    area: 1000,
    owner: DEMO_WALLETS.seller,
    ulpin: generateRandomULPIN(),
  });
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setResult("");
    try {
      let documentHash = "0x" + "0".repeat(64);
      if (file) {
        const upload = await bhumiApi.uploadDocument(file);
        documentHash = upload.sha256;
      }

      const registrar = (await connectWallet().catch(() => null))?.address ?? DEMO_WALLETS.registrar;

      const res = await bhumiApi.chainAction({
        action: "register",
        owner: form.owner,
        surveyNumber: form.surveyNumber,
        district: form.district,
        geo: form.geo,
        area: form.area,
        documentHash,
        ulpin: form.ulpin.replace(/-/g, "").toUpperCase() || undefined,
        registrar,
      });

      setResult(`Parcel #${res.parcelId} registered on-chain. Tx: ${res.txHash}`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Register New Parcel"
        hindiTitle="नया पार्सल पंजीकृत करें"
        subtitle="Registrar-only: mint ERC-721 land title token with document hash anchored on-chain"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Register" }]}
      />

      <main id="main-content" className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-xl mx-auto gov-card-elevated p-6 md:p-8 space-y-4">
          {[
            { key: "surveyNumber", label: "Survey Number", type: "text" },
            { key: "district", label: "District", type: "text" },
            { key: "area", label: "Area (sq.ft)", type: "number" },
            { key: "owner", label: "Owner Wallet", type: "text" },
            { key: "ulpin", label: "ULPIN (optional)", type: "text" },
          ].map((f) => (
            <div key={f.key}>
              <label className="metric-label">{f.label}</label>
              <input
                type={f.type}
                className="gov-input mt-1"
                value={String(form[f.key as keyof typeof form])}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                  })
                }
              />
            </div>
          ))}

          <div>
            <label className="metric-label flex items-center justify-between">
              <span>Geospatial Coordinates</span>
              <span className="text-[10px] bg-gov-blue-light text-gov-blue px-2 py-0.5 rounded">
                Click map to select
              </span>
            </label>
            <div className="h-48 mt-2 border border-gov-border rounded-card overflow-hidden">
              <MapDynamic
                lat={parseFloat(form.geo.split(",")[0]) || 17.75}
                lng={parseFloat(form.geo.split(",")[1]) || 78.05}
                zoom={14}
                onChange={(lat, lng) => setForm({ ...form, geo: `${lat.toFixed(6)},${lng.toFixed(6)}` })}
              />
            </div>
            <p className="text-xs text-gov-muted mt-1 font-mono">{form.geo}</p>
          </div>

          <div>
            <label className="metric-label">Title Document</label>
            <input
              type="file"
              className="gov-input mt-1"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <button onClick={handleRegister} disabled={loading} className="gov-btn-primary w-full disabled:opacity-40">
            {loading ? "Registering on blockchain…" : "Register Parcel"}
          </button>

          {result && <p className="text-sm gov-disclaimer">{result}</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}

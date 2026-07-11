
"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyDocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    exists: boolean;
    hash: string;
    parcelId?: number;
    ulpin?: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      // 1. We upload it temporarily to hash it and get a URL (same mechanism)
      const form = new FormData();
      form.append("file", file);
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.ok) throw new Error(uploadData.error || "Upload failed");

      const hash = uploadData.sha256;

      // 2. We query the hash in the DB
      const checkRes = await fetch(`/api/verify/hash?hash=${hash}`);
      const checkData = await checkRes.json();
      if (!checkData.ok) throw new Error(checkData.error || "Verification failed");

      setResult({
        exists: checkData.exists,
        hash,
        parcelId: checkData.parcelId,
        ulpin: checkData.ulpin,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const testAuthentic = () => {
    setLoading(true);
    setFile(null);
    setTimeout(() => {
      setResult({
        exists: true,
        hash: "0x8f2d5b6c9e0a1f2d3c4b5a69788796a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9",
        parcelId: 1,
        ulpin: "29KA0482017452"
      });
      setError("");
      setLoading(false);
    }, 800);
  };

  const testFake = () => {
    setLoading(true);
    setFile(null);
    setTimeout(() => {
      setResult({
        exists: false,
        hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      });
      setError("");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Navbar />
      <PageHeader
        title="Document Verification Portal"
        hindiTitle="????????? ???????"
        subtitle="Upload a scanned land document to verify its cryptographic authenticity."
        breadcrumbs={[{ label: "Verify", href: "/verify" }, { label: "Document" }]}
      />

      <main id="main-content" className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="gov-card-elevated p-6 md:p-10">
            <h2 className="text-xl font-bold text-gov-navy mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gov-blue" />
              Upload Document for Verification
            </h2>
            <p className="text-gov-muted text-sm mb-8">
              BhuRaksha uses cryptographic hashing. Upload a PDF or image of the Title Certificate. The system will calculate its digital footprint and verify if it matches any authentic document anchored on the blockchain.
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="border-2 border-dashed border-gov-border rounded-xl p-8 text-center hover:border-gov-blue transition-colors cursor-pointer bg-slate-50 relative">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setResult(null);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-gov-blue/60" />
                  <div>
                    <p className="font-semibold text-gov-navy">
                      {file ? file.name : "Click or drag document here"}
                    </p>
                    <p className="text-sm text-gov-muted mt-1">
                      {file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "Supports PDF, JPG, PNG"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="gov-btn-primary w-full py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && file ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Cryptographic Hash"}
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-4 justify-center border-t border-gov-border pt-8">
              <button 
                onClick={testAuthentic}
                disabled={loading}
                className="flex-1 min-w-[200px] px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-btn text-sm font-semibold hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                {loading && !file && !result ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Demo Authentic Document
              </button>
              <button 
                onClick={testFake}
                disabled={loading}
                className="flex-1 min-w-[200px] px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-btn text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                {loading && !file && !result ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Demo Tampered Document
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-btn text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className={`mt-8 p-6 border rounded-xl shadow-sm ${result.exists ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-4">
                  {result.exists ? (
                    <CheckCircle className="w-8 h-8 text-green-600 shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
                  )}
                  <div>
                    <h3 className={`text-lg font-bold ${result.exists ? "text-green-800" : "text-red-800"}`}>
                      {result.exists ? "AUTHENTIC DOCUMENT" : "UNVERIFIED OR TAMPERED"}
                    </h3>
                    <p className={`text-sm mt-1 ${result.exists ? "text-green-700" : "text-red-700"}`}>
                      {result.exists 
                        ? "This document`s cryptographic footprint perfectly matches an official record in the BhuRaksha Registry."
                        : "This document does not match any record. It may be forged, digitally altered, or unregistered."}
                    </p>
                    
                    <div className="mt-4 p-3 bg-white/50 rounded-lg text-sm font-mono overflow-hidden">
                      <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Document SHA-256 Hash</p>
                      <p className="truncate text-slate-800 font-semibold" title={result.hash}>{result.hash}</p>
                    </div>

                    {result.exists && result.parcelId && (
                      <div className="mt-6">
                        <Link href={`/verify/${result.parcelId}`} className="gov-btn-primary text-sm inline-flex items-center gap-2">
                          View Official Parcel Record
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


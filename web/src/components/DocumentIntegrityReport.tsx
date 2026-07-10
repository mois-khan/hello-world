"use client";

import type { AiReport } from "@/lib/types";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export function DocumentIntegrityReport({ report }: { report: AiReport }) {
  const Icon =
    report.verdict === "LIKELY_GENUINE"
      ? ShieldCheck
      : report.verdict === "SUSPICIOUS"
      ? ShieldAlert
      : ShieldX;

  const color =
    report.verdict === "LIKELY_GENUINE"
      ? "text-gov-green border-green-200 bg-green-50"
      : report.verdict === "SUSPICIOUS"
      ? "text-amber-700 border-amber-200 bg-amber-50"
      : "text-red-700 border-red-200 bg-red-50";

  return (
    <div className={`gov-card p-5 border ${color}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-8 h-8 shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold">Document Integrity Report</h3>
          <p className="text-sm mt-1">
            Verdict: <strong>{report.verdict.replace(/_/g, " ")}</strong> · Risk Score:{" "}
            <strong>{report.riskScore}/100</strong>
          </p>
          {report.hashMatch !== null && (
            <p className="text-xs mt-2">
              Cryptographic check:{" "}
              {report.hashMatch ? "✓ Hash matches on-chain anchor" : "✗ HASH MISMATCH — TAMPERED"}
            </p>
          )}
          <ul className="mt-3 space-y-1 text-sm">
            {report.reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(report.indicators).map(([k, v]) => (
              <div key={k} className="bg-white/60 rounded-btn px-2 py-1">
                <span className="text-gov-muted capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>{" "}
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

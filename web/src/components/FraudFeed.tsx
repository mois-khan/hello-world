"use client";

import { useEffect, useState } from "react";
import type { FraudAlert } from "@/lib/types";
import { bhumiApi } from "@/lib/api-client";
import { AlertTriangle } from "lucide-react";

export function FraudFeed({ refreshMs = 5000 }: { refreshMs?: number }) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);

  useEffect(() => {
    const load = () => bhumiApi.getFraudAlerts().then(setAlerts).catch(() => {});
    load();
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  if (alerts.length === 0) {
    return (
      <div className="gov-card p-4 text-sm text-gov-muted text-center">
        No active fraud alerts
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`gov-card p-4 border-l-4 ${
            a.severity === "HIGH"
              ? "border-red-500 bg-red-50"
              : a.severity === "MED"
              ? "border-gov-saffron bg-amber-50"
              : "border-gov-blue bg-gov-blue-light"
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <div>
              <p className="font-bold text-sm">{a.type.replace(/_/g, " ")}</p>
              <p className="text-xs text-gov-muted mt-0.5">Parcel #{a.parcelId}</p>
              <p className="text-sm mt-1">{a.detail}</p>
              <p className="text-xs text-gov-muted mt-2">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Parcel } from "@/lib/types";
import { bhumiApi } from "@/lib/api-client";

const MapInner = dynamic(() => import("./FraudMapInner"), {
  ssr: false,
  loading: () => <div className="min-h-[500px] bg-gov-grey rounded-card animate-pulse flex items-center justify-center text-gov-muted">Loading map...</div>,
});

export function FraudMap() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bhumiApi.getParcels()
      .then((data) => {
        setParcels(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch parcels for map:", err);
        setError("Failed to load map data. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="gov-card overflow-hidden">
      <div className="p-3 border-b border-gov-border">
        <p className="text-sm font-semibold text-gov-navy">District Parcel Map</p>
        <p className="text-xs text-gov-muted">Green = Active · Amber = In Transfer · Red = Flagged</p>
      </div>
      
      {loading ? (
        <div className="min-h-[500px] bg-gov-grey animate-pulse flex items-center justify-center text-gov-muted">
          Loading parcels...
        </div>
      ) : error ? (
        <div className="min-h-[500px] flex flex-col items-center justify-center text-red-600 bg-red-50 p-4 text-center">
          <p className="font-medium">{error}</p>
        </div>
      ) : parcels.length === 0 ? (
        <div className="min-h-[500px] flex items-center justify-center text-gov-muted bg-gov-grey/10">
          <p>No parcels found in this district.</p>
        </div>
      ) : (
        <MapInner parcels={parcels} />
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <div className={`gov-card overflow-hidden transition-all bg-white ${isFullscreen ? 'fixed inset-0 z-[100] m-0 rounded-none h-screen w-screen' : 'relative'}`}>
      <div className="p-3 border-b border-gov-border flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold text-gov-navy">District Parcel Map</p>
          <p className="text-xs text-gov-muted">Green = Active · Amber = In Transfer · Red = Flagged</p>
        </div>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)} 
          className="p-2 hover:bg-gov-grey rounded-md text-gov-navy transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
      
      {loading ? (
        <div className="min-h-[500px] h-[calc(100vh-60px)] bg-gov-grey animate-pulse flex items-center justify-center text-gov-muted">
          Loading parcels...
        </div>
      ) : error ? (
        <div className="min-h-[500px] h-[calc(100vh-60px)] flex flex-col items-center justify-center text-red-600 bg-red-50 p-4 text-center">
          <p className="font-medium">{error}</p>
        </div>
      ) : parcels.length === 0 ? (
        <div className="min-h-[500px] h-[calc(100vh-60px)] flex items-center justify-center text-gov-muted bg-gov-grey/10">
          <p>No parcels found in this district.</p>
        </div>
      ) : (
        <div className={isFullscreen ? "h-[calc(100vh-68px)]" : "h-[500px]"}>
          <MapInner parcels={parcels} />
        </div>
      )}
    </div>
  );
}

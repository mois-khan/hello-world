"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet marker icon issue in Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapProps {
  lat: number;
  lng: number;
  zoom?: number;
  readOnly?: boolean;
  onChange?: (lat: number, lng: number) => void;
}

function MapEvents({ onChange, readOnly }: { onChange?: (lat: number, lng: number) => void; readOnly?: boolean }) {
  useMapEvents({
    click(e) {
      if (!readOnly && onChange) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function Map({ lat, lng, zoom = 13, readOnly = false, onChange }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-card" />;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={!readOnly}
      className="h-full w-full rounded-card z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} />
      {!readOnly && <MapEvents onChange={onChange} readOnly={readOnly} />}
    </MapContainer>
  );
}

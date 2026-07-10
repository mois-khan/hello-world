"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Popup, useMap, Polygon } from "react-leaflet";
import L from "leaflet";
import type { Parcel } from "@/lib/types";
import "leaflet/dist/leaflet.css";

import LayerMenu from "./map/LayerMenu";
import { BASEMAPS } from "./map/constants";
import { LocationIcon } from "./map/MapIcons";
import SearchBar from "./map/SearchBar";

function MapLocationControl() {
  const map = useMap();
  
  return (
    <div style={{ position: 'absolute', bottom: 70, left: 10, zIndex: 1100 }}>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 14, { duration: 1.5 });
              }
            );
          }
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'rgba(17, 32, 24, 0.8)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          border: '1px solid rgba(62, 207, 142, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
          e.currentTarget.style.borderColor = 'hsl(43, 80%, 88%)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
          e.currentTarget.style.borderColor = 'rgba(62, 207, 142, 0.5)';
        }}
        title="Find my location"
      >
        <LocationIcon />
      </button>
    </div>
  );
}

function MapBoundsUpdater({ parcels }: { parcels: Parcel[] }) {
  const map = useMap();
  useEffect(() => {
    if (parcels.length > 0) {
      const bounds = L.latLngBounds(parcels.map(p => {
        const [lat, lng] = p.geo.split(",").map(Number);
        return [lat, lng];
      }));
      // Pad bounds slightly so markers aren't on the edge
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [parcels, map]);
  return null;
}

export default function FraudMapInner({ parcels }: { parcels: Parcel[] }) {
  const [currentBaseMap, setCurrentBaseMap] = useState("standard");
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const layerMenuRef = useRef<HTMLDivElement>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [minAreaFilter, setMinAreaFilter] = useState<number | ''>('');
  const [ownerNameFilter, setOwnerNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!showLayerMenu) return;
    function handleClick(e: MouseEvent) {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLayerMenu]);

  const activeBaseMap = BASEMAPS.find(b => b.key === currentBaseMap) || BASEMAPS[0];

  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || p.district.toLowerCase().includes(q) || p.surveyNumber.toLowerCase().includes(q);
      const matchesArea = minAreaFilter === '' || p.area >= minAreaFilter;
      const matchesOwner = !ownerNameFilter || p.owner.toLowerCase().includes(ownerNameFilter.toLowerCase());
      const matchesStatus = !statusFilter || p.status === statusFilter;

      return matchesSearch && matchesArea && matchesOwner && matchesStatus;
    });
  }, [parcels, searchQuery, minAreaFilter, ownerNameFilter, statusFilter]);

  const center: [number, number] = filteredParcels.length
    ? (() => {
        const [lat, lng] = filteredParcels[0].geo.split(",").map(Number);
        return [lat || 17.75, lng || 78.05] as [number, number];
      })()
    : [17.75, 78.05];

  return (
    <div style={{ position: "relative", height: "100%", minHeight: "500px", width: "100%" }}>
      {/* Search Bar & Filters overlay */}
      <div style={{ position: "absolute", top: 10, left: 10, right: 10, zIndex: 1000 }}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          minAreaFilter={minAreaFilter}
          onMinAreaFilterChange={setMinAreaFilter}
          ownerNameFilter={ownerNameFilter}
          onOwnerNameFilterChange={setOwnerNameFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%", zIndex: 0, minHeight: "500px" }}>
        <TileLayer
          key={activeBaseMap.key}
          attribution={activeBaseMap.attribution}
          url={activeBaseMap.url}
          maxZoom={activeBaseMap.maxZoom}
        />
        {filteredParcels.map((p) => {
          const [lat, lng] = p.geo.split(",").map(Number);
          const color = p.status === "InTransfer" ? "#FF9933" : "#138808";
          
          // Calculate an artificial boundary based on area. 1 degree lat = ~364,000 ft.
          const side = Math.sqrt(p.area);
          const dLat = Math.max(side / 364000, 0.0005) / 2; // minimum 0.0005 degrees to remain visible
          const dLng = Math.max(side / (364000 * Math.cos(lat * Math.PI / 180)), 0.0005) / 2;

          const positions: [number, number][] = [
            [lat - dLat, lng - dLng],
            [lat + dLat, lng - dLng],
            [lat + dLat, lng + dLng],
            [lat - dLat, lng + dLng],
          ];

          return (
            <Polygon
              key={p.id}
              positions={positions}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
            >
              <Popup>
                <div style={{
                  fontFamily: '"Playfair Display", serif',
                  color: '#fff',
                  background: 'rgba(17, 32, 24, 0.95)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(62, 207, 142, 0.3)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                  width: '240px',
                  margin: '-15px'
                }}>
                  <h3 style={{
                    color: 'hsl(43, 80%, 88%)',
                    marginTop: 0,
                    marginBottom: '15px',
                    fontSize: '16px',
                    borderBottom: '1px solid rgba(62, 207, 142, 0.3)',
                    paddingBottom: '8px'
                  }}>
                    Property Details
                  </h3>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ color: '#3ecf8e', fontWeight: 'bold' }}>ID:</span> <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>#{p.id}</span>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ color: '#3ecf8e', fontWeight: 'bold' }}>Owner:</span> <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{p.owner.substring(0,6)}...{p.owner.substring(p.owner.length-4)}</span>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ color: '#3ecf8e', fontWeight: 'bold' }}>District:</span> <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{p.district}</span>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ color: '#3ecf8e', fontWeight: 'bold' }}>Survey No:</span> <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{p.surveyNumber}</span>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ color: '#3ecf8e', fontWeight: 'bold' }}>Area:</span> <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{p.area} sq ft</span>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ color: '#3ecf8e', fontWeight: 'bold' }}>Status:</span> <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{p.status}</span>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '10px', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                    Blockchain Land Registry
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
        <MapBoundsUpdater parcels={filteredParcels} />
        <MapLocationControl />
      </MapContainer>

      <LayerMenu 
        currentBaseMap={currentBaseMap}
        onBaseMapChange={setCurrentBaseMap}
        showLayerMenu={showLayerMenu}
        onToggleLayerMenu={() => setShowLayerMenu(!showLayerMenu)}
        layerMenuRef={layerMenuRef}
      />
    </div>
  );
}

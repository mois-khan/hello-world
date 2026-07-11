"use client";

import dynamic from "next/dynamic";

const MapDynamic = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-card" />,
});

export default MapDynamic;

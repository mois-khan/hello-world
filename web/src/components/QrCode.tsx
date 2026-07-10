"use client";

import { useEffect, useRef, useState } from "react";

export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: { dark: "#0A2E5C", light: "#FFFFFF" },
        });
      } catch {
        setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <div className="p-4 bg-gov-grey rounded-card text-xs text-gov-muted break-all max-w-[200px]">
        {value}
      </div>
    );
  }

  return <canvas ref={canvasRef} className="rounded-card border border-gov-border" />;
}

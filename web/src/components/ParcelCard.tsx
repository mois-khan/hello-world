import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Parcel, ParcelStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { shortenAddress, getWalletName } from "@/lib/wallet";
import { MapPin, Ruler, User } from "lucide-react";
import { QrCode } from "@/components/QrCode";

function statusForParcel(status: ParcelStatus): "verified" | "pending" {
  return status === "InTransfer" ? "pending" : "verified";
}

export function ParcelCard({ parcel, className }: { parcel: Parcel; className?: string }) {
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/verify/${parcel.id}` : `/verify/${parcel.id}`;

  return (
    <div className={cn("gov-card p-5 transition-shadow duration-200 hover:shadow-md", className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-mono text-sm font-bold text-gov-blue">Parcel #{parcel.id}</p>
          <p className="text-sm mt-1 text-gov-muted">Survey No. {parcel.surveyNumber}</p>
        </div>
        <StatusBadge status={statusForParcel(parcel.status)} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gov-text">
          <MapPin className="w-4 h-4 text-gov-blue shrink-0" />
          <span>{parcel.district}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gov-text">
          <Ruler className="w-4 h-4 text-gov-blue shrink-0" />
          <span>{parcel.area.toLocaleString()} sq.ft</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gov-text">
          <User className="w-4 h-4 text-gov-blue shrink-0" />
          <span>{getWalletName(parcel.owner)}</span>
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-gov-border mt-2">
        <div className="flex gap-2 flex-wrap">
          <StatusBadge status="onchain" />
          <Link href={`/verify/${parcel.id}`} className="text-xs text-gov-blue hover:underline">
            Verify Details →
          </Link>
        </div>
        
        {parcel.status === "Active" && (
          <div className="text-center shrink-0">
            <QrCode value={verifyUrl} size={64} />
            <p className="text-[10px] text-gov-muted mt-1 uppercase tracking-wider">Scannable Deed</p>
          </div>
        )}
      </div>
    </div>
  );
}

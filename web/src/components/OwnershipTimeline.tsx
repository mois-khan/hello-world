"use client";

import type { TimelineEvent } from "@/lib/types";
import { shortenAddress, getWalletName } from "@/lib/wallet";
import { Check, Link2 } from "lucide-react";

export function OwnershipTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gov-muted">No on-chain history recorded yet.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={`${e.txHash}-${i}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gov-blue text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            {i < events.length - 1 && <div className="w-0.5 h-10 bg-gov-border" />}
          </div>
          <div className="pb-6">
            <p className="font-semibold text-sm text-gov-navy">{e.type}</p>
            <p className="text-xs text-gov-muted mt-0.5">
              {e.from && `From ${getWalletName(e.from)} → `}
              To {e.to.startsWith("0x") ? getWalletName(e.to) : e.to}
            </p>
            <p className="text-xs text-gov-muted flex items-center gap-1 mt-1">
              <Link2 className="w-3 h-3" />
              {e.txHash.slice(0, 18)}…
            </p>
            <p className="text-xs text-gov-muted">
              {new Date(e.at * 1000).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

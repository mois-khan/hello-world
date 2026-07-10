import { cn } from "@/lib/utils";
import { ShieldCheck, Clock, ShieldX, Scale, Link2 } from "lucide-react";

const CONFIG = {
  verified: { icon: ShieldCheck, label: "Verified", className: "bg-green-50 text-gov-green border-gov-green/30" },
  pending: { icon: Clock, label: "Pending", className: "bg-amber-50 text-amber-800 border-amber-300" },
  blocked: { icon: ShieldX, label: "Blocked", className: "bg-red-50 text-red-800 border-red-300" },
  disputed: { icon: Scale, label: "Disputed", className: "bg-purple-50 text-purple-800 border-purple-300" },
  onchain: { icon: Link2, label: "On-Chain", className: "bg-gov-blue-light text-gov-blue border-gov-blue/30" },
};

type Status = keyof typeof CONFIG;

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { icon: Icon, label, className: styles } = CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-semibold border", styles, className)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

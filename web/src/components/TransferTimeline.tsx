"use client";

import { Check, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "initiated", label: "Seller initiated" },
  { id: "heir", label: "Heir consent (VanshPariksha)" },
  { id: "buyer", label: "Buyer accepted" },
  { id: "fraud", label: "BhumiShield scan" },
  { id: "sro", label: "SRO review" },
  { id: "chain", label: "On-chain record" },
  { id: "trustseal", label: "TrustSeal issued" },
  { id: "mutation", label: "Mutation sync" },
];

export function TransferTimeline({ currentStep = 4 }: { currentStep?: number }) {
  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const current = i === currentStep;
        const pending = i > currentStep;

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                  done && "bg-gov-green border-gov-green text-white",
                  current && "bg-gov-blue border-gov-blue text-white",
                  pending && "bg-white border-gov-border text-gov-muted"
                )}
              >
                {done ? (
                  <Check className="w-4 h-4" />
                ) : current ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-0.5 h-8", done ? "bg-gov-green" : "bg-gov-border")} />
              )}
            </div>
            <div className="pb-6">
              <p className={cn("font-medium text-sm", pending && "text-gov-muted")}>{step.label}</p>
              {current && (
                <p className="text-sm text-gov-blue font-medium mt-0.5">In progress</p>
              )}
              {done && (
                <p className="text-sm text-gov-muted mt-0.5">Completed</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

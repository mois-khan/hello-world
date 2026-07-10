"use client";

import { cn } from "@/lib/utils";

export function FraudGauge({ score, className }: { score: number; className?: string }) {
  const level = score < 40 ? "low" : score < 70 ? "medium" : "high";
  const colors = {
    low: "stroke-gov-green",
    medium: "stroke-gov-saffron",
    high: "stroke-red-600",
  };
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative w-28 h-28", className)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className={colors[level]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gov-navy">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-gov-muted">{level} risk</span>
      </div>
    </div>
  );
}

"use client";

import { useRef, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const SEGMENTS = [4, 4, 4, 2];

interface ULPINInputProps {
  value: string[];
  onChange: (segments: string[]) => void;
  onComplete?: (ulpin: string) => void;
  error?: boolean;
  size?: "default" | "large";
}

export function ULPINInput({ value, onChange, onComplete, error, size = "default" }: ULPINInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, SEGMENTS[index]);
    const next = [...value];
    next[index] = cleaned;
    onChange(next);

    if (cleaned.length === SEGMENTS[index] && index < 3) {
      refs.current[index + 1]?.focus();
    }

    const full = next.join("");
    if (full.length === 14) onComplete?.(full);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/-/g, "").toUpperCase().slice(0, 14);
    const segments = [
      pasted.slice(0, 4),
      pasted.slice(4, 8),
      pasted.slice(8, 12),
      pasted.slice(12, 14),
    ];
    onChange(segments);
    if (pasted.length === 14) onComplete?.(pasted);
  };

  const sizeClass =
    size === "large"
      ? "w-20 md:w-24 h-14 text-lg md:text-xl"
      : "w-16 md:w-20 h-12 text-base";

  return (
    <div className="flex gap-2 md:gap-3 flex-wrap justify-center" onPaste={handlePaste}>
      {SEGMENTS.map((len, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          maxLength={len}
          placeholder={"—".repeat(len)}
          aria-label={`ULPIN segment ${i + 1}`}
          className={cn(
            sizeClass,
            "text-center font-mono font-semibold tracking-widest rounded-btn border bg-white transition-all duration-200 focus:outline-none focus:ring-2",
            error
              ? "border-red-500 focus:ring-red-200"
              : "border-gov-border focus:border-gov-blue focus:ring-gov-blue/20"
          )}
        />
      ))}
    </div>
  );
}

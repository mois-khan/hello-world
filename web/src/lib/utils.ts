import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatULPIN(ulpin: string): string {
  const clean = ulpin.replace(/-/g, "").toUpperCase();
  if (clean.length !== 14) return ulpin;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

export function normalizeULPIN(input: string): string {
  return input.replace(/-/g, "").toUpperCase().slice(0, 14);
}

export function isValidULPIN(ulpin: string): boolean {
  return /^[A-Z0-9]{14}$/.test(normalizeULPIN(ulpin));
}

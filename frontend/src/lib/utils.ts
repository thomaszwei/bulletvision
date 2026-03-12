import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatPercent(val: number): string {
  return `${Math.round(val * 100)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function confidenceLabel(conf: number): string {
  if (conf >= 0.85) return "High";
  if (conf >= 0.65) return "Medium";
  return "Low";
}

export function confidenceColor(conf: number): string {
  if (conf >= 0.85) return "text-confirm";
  if (conf >= 0.65) return "text-warn";
  return "text-accent";
}

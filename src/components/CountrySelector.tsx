"use client";
import { useCountry } from "./CountryContext";
import { CORRIDORS } from "@/data/corridors";
import { ChevronDown } from "lucide-react";

interface CountrySelectorProps {
  className?: string;
  compact?: boolean;
}

export default function CountrySelector({ className = "", compact = false }: CountrySelectorProps) {
  const { corridor, setCorridor } = useCountry();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span className="text-lg mr-1.5">{corridor.flag}</span>
      <select
        aria-label="Select your country"
        value={corridor.slug}
        onChange={(e) => setCorridor(e.target.value)}
        className={`appearance-none bg-transparent font-semibold text-slate-900 cursor-pointer focus:outline-none pr-5 ${compact ? "text-xs" : "text-sm"}`}
      >
        {CORRIDORS.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.flag} {compact ? c.currencyCode : `${c.country} (${c.currencyCode})`}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
    </div>
  );
}

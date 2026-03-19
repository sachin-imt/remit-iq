"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CORRIDORS, Corridor } from "@/data/corridors";

interface CountryContextType {
  corridor: Corridor;
  setCorridor: (slug: string) => void;
  currencyCode: string;
  currencySymbol: string;
  country: string;
  flag: string;
  pairLabel: string; // e.g. "USD/INR"
}

const DEFAULT_SLUG = "australia";
const STORAGE_KEY = "remitiq_source_country";

/**
 * Read saved corridor from localStorage SYNCHRONOUSLY so the initial render
 * already has the correct currency. This prevents a flash of AUD data when
 * the user has previously selected a different currency (e.g. USD).
 *
 * Without this, the flow was:
 *  1. useState(AUD) → useEffect fires fetch for AUD
 *  2. useEffect reads localStorage → finds USD → setState(USD) → fires fetch for USD
 *  3. Race condition: AUD response arrives after USD → overwrites correct data
 */
function getInitialCorridor(): Corridor {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = CORRIDORS.find((c) => c.slug === saved);
        if (found) return found;
      }
    } catch {
      // localStorage unavailable (SSR, private browsing) — use default
    }
  }
  return CORRIDORS.find((c) => c.slug === DEFAULT_SLUG)!;
}

const CountryContext = createContext<CountryContextType | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [corridor, setCorridorState] = useState<Corridor>(getInitialCorridor);

  // Auto-detect country for first-time visitors (no localStorage entry yet)
  useEffect(() => {
    // If localStorage already had a saved corridor, skip geo-detection
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    const detectCountry = async () => {
      try {
        const response = await fetch("/api/geo");
        const data = await response.json();

        if (data.countryCode) {
          const found = CORRIDORS.find((c) => c.isoCode === data.countryCode);
          if (found) {
            setCorridorState(found);
            localStorage.setItem(STORAGE_KEY, found.slug);
          }
        }
      } catch (error) {
        console.error("Geo-detection error:", error);
      }
    };

    detectCountry();
  }, []);

  const setCorridor = (slug: string) => {
    const found = CORRIDORS.find((c) => c.slug === slug);
    if (found) {
      setCorridorState(found);
      try { localStorage.setItem(STORAGE_KEY, slug); } catch { /* ignore */ }
    }
  };

  return (
    <CountryContext.Provider
      value={{
        corridor,
        setCorridor,
        currencyCode: corridor.currencyCode,
        currencySymbol: corridor.currencySymbol,
        country: corridor.country,
        flag: corridor.flag,
        pairLabel: `${corridor.currencyCode}/INR`,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}

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

function getDefaultCorridor(): Corridor {
  return CORRIDORS.find((c) => c.slug === DEFAULT_SLUG)!;
}

const CountryContext = createContext<CountryContextType | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [corridor, setCorridorState] = useState<Corridor>(getDefaultCorridor);

  // Restore from localStorage on mount or auto-detect
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const found = CORRIDORS.find((c) => c.slug === saved);
          if (found) {
            setCorridorState(found);
            return;
          }
        }

        // Auto-detect if no saved setting
        const response = await fetch("/api/geo");
        const data = await response.json();
        
        if (data.countryCode) {
          const found = CORRIDORS.find((c) => c.isoCode === data.countryCode);
          if (found) {
            setCorridorState(found);
            // We save it once detected to avoid re-fetching every time
            localStorage.setItem(STORAGE_KEY, found.slug);
          }
        }
      } catch (error) {
        console.error("Geo-detection or localStorage error:", error);
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

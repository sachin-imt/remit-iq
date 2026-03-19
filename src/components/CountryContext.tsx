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

const DEFAULT_CORRIDOR = CORRIDORS.find((c) => c.slug === DEFAULT_SLUG)!;

const CountryContext = createContext<CountryContextType | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  /**
   * Always start with the default corridor so the server-rendered HTML and
   * the client's first render are identical — preventing the React hydration
   * mismatch error ("Text content does not match server-rendered HTML").
   *
   * localStorage is a browser-only API; reading it synchronously in useState()
   * causes the server to render 🇦🇺 while the client renders 🇺🇸, which React
   * treats as a fatal hydration error.
   *
   * Instead we read localStorage in useEffect (runs only after hydration) and
   * immediately update the state. The AbortController cleanup in every page's
   * fetch useEffect cancels any in-flight AUD request, so there is no race
   * condition between the default-currency fetch and the restored-currency fetch.
   */
  const [corridor, setCorridorState] = useState<Corridor>(DEFAULT_CORRIDOR);

  useEffect(() => {
    // Step 1: restore saved preference from localStorage (runs after hydration)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = CORRIDORS.find((c) => c.slug === saved);
        if (found) {
          setCorridorState(found);
          return; // saved preference found — skip geo-detection
        }
      }
    } catch {
      // localStorage unavailable (private browsing) — fall through to geo
    }

    // Step 2: first-time visitor — auto-detect country via IP geo
    const detectCountry = async () => {
      try {
        const response = await fetch("/api/geo");
        const data = await response.json();

        if (data.countryCode) {
          const found = CORRIDORS.find((c) => c.isoCode === data.countryCode);
          if (found) {
            setCorridorState(found);
            try { localStorage.setItem(STORAGE_KEY, found.slug); } catch { /* ignore */ }
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

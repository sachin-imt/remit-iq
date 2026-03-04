"use client";

import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "remitiq_cookie_consent";

function PageViewTracker() {
    const pathname = usePathname();
    const lastPath = useRef("");

    useEffect(() => {
        if (pathname && pathname !== lastPath.current) {
            lastPath.current = pathname;
            // Fire and forget — don't block the UI
            fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "page_view", page: pathname }),
            }).catch(() => { /* silently fail */ });
        }
    }, [pathname]);

    return null;
}

export default function AnalyticsWrapper() {
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        setHasConsent(localStorage.getItem(CONSENT_KEY) === "accepted");

        function onStorage(e: StorageEvent) {
            if (e.key === CONSENT_KEY) {
                setHasConsent(e.newValue === "accepted");
            }
        }

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    return (
        <>
            {/* Always track page views in our own database */}
            <PageViewTracker />
            {/* Vercel Analytics only with consent */}
            {hasConsent && <Analytics />}
        </>
    );
}

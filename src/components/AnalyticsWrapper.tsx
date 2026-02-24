"use client";

import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

const CONSENT_KEY = "remitiq_cookie_consent";

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

    if (!hasConsent) return null;

    return <Analytics />;
}

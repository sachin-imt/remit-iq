"use client";

import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "remitiq_cookie_consent";
const REFERRER_SENT_KEY = "remitiq_referrer_sent";

function PageViewTracker() {
    const pathname = usePathname();
    const lastPath = useRef("");

    useEffect(() => {
        if (pathname && pathname !== lastPath.current) {
            lastPath.current = pathname;

            const referrer = document.referrer || "";
            const alreadySentReferrer = sessionStorage.getItem(REFERRER_SENT_KEY) === "1";
            const isInternal = localStorage.getItem("remitiq_internal_user") === "true";

            if (isInternal) {
                // Pre-emptively skip tracking for internal/admin users
                return;
            }

            fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "page_view",
                    page: pathname,
                    // Send referrer only on first page of the session
                    referrer: alreadySentReferrer ? undefined : referrer,
                }),
            }).catch(() => { /* silently fail */ });

            if (!alreadySentReferrer) {
                sessionStorage.setItem(REFERRER_SENT_KEY, "1");
            }
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

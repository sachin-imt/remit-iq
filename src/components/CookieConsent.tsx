"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "remitiq_cookie_consent";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) {
            setVisible(true);
        }
    }, []);

    function handleAccept() {
        localStorage.setItem(CONSENT_KEY, "accepted");
        window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY, newValue: "accepted" }));
        setVisible(false);
    }

    function handleReject() {
        localStorage.setItem(CONSENT_KEY, "rejected");
        window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY, newValue: "rejected" }));
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[9999] border-t px-4 py-4"
            style={{ backgroundColor: "#111D32", borderColor: "#1E3A5F" }}
        >
            <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm" style={{ color: "#C8D8E8" }}>
                    We use analytics cookies to understand how you use RemitIQ and improve your experience.{" "}
                    <a href="/privacy" className="underline" style={{ color: "#F0B429" }}>
                        Privacy Policy
                    </a>
                </p>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={handleReject}
                        className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:text-white"
                        style={{ borderColor: "#1E3A5F", color: "#7A9CC4" }}
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-yellow-400"
                        style={{ backgroundColor: "#F0B429", color: "#0A1628" }}
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}

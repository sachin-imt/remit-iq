"use client";

import { useState } from "react";

type Step = "email" | "code" | "done";

export default function DataManagementForm() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<Step>("email");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [exportData, setExportData] = useState<object | null>(null);

    async function handleRequestCode() {
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/data/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.status === 429) {
                setError("Too many requests. Please try again in an hour.");
                return;
            }

            const data = await res.json();
            if (data.success) {
                setMessage("Verification code sent to your email. Check your inbox.");
                setStep("code");
            } else {
                setError(data.error || "Failed to send verification code.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleExport() {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/data/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();
            if (data.success) {
                setExportData(data.data);
                setMessage("Your data has been exported successfully.");
                setStep("done");
            } else {
                setError(data.error || "Invalid or expired verification code.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/data/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();
            if (data.success) {
                setMessage(`All your data has been deleted (${data.deleted} record${data.deleted !== 1 ? "s" : ""} removed).`);
                setStep("done");
                setExportData(null);
            } else {
                setError(data.error || "Invalid or expired verification code.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        setEmail("");
        setCode("");
        setStep("email");
        setMessage("");
        setError("");
        setExportData(null);
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    {error}
                </div>
            )}

            {message && (
                <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "rgba(74, 222, 128, 0.1)", color: "#4ADE80", border: "1px solid rgba(74, 222, 128, 0.2)" }}>
                    {message}
                </div>
            )}

            {step === "email" && (
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: "#7A9CC4" }}>
                        Enter the email address you used to create rate alerts. We will send a verification code to confirm your identity.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
                            style={{ backgroundColor: "#0D1B2E", border: "1px solid #1E3A5F", color: "#C8D8E8" }}
                        />
                        <button
                            onClick={handleRequestCode}
                            disabled={loading}
                            className="px-6 py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-yellow-400 disabled:opacity-50"
                            style={{ backgroundColor: "#F0B429", color: "#0A1628" }}
                        >
                            {loading ? "Sending..." : "Send Verification Code"}
                        </button>
                    </div>
                </div>
            )}

            {step === "code" && (
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: "#7A9CC4" }}>
                        Enter the 6-digit code we sent to <strong style={{ color: "#C8D8E8" }}>{email}</strong>. The code expires in 10 minutes.
                    </p>
                    <input
                        type="text"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="w-40 px-4 py-3 rounded-lg text-sm text-center tracking-widest font-mono outline-none"
                        style={{ backgroundColor: "#0D1B2E", border: "1px solid #1E3A5F", color: "#C8D8E8", fontSize: "18px" }}
                    />
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={handleExport}
                            disabled={loading || code.length !== 6}
                            className="px-6 py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-yellow-400 disabled:opacity-50"
                            style={{ backgroundColor: "#F0B429", color: "#0A1628" }}
                        >
                            {loading ? "Processing..." : "Export My Data"}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || code.length !== 6}
                            className="px-6 py-3 rounded-lg text-sm font-semibold border transition-colors hover:bg-red-500/10 disabled:opacity-50"
                            style={{ borderColor: "#ef4444", color: "#f87171" }}
                        >
                            {loading ? "Processing..." : "Delete My Data"}
                        </button>
                    </div>
                    <button onClick={handleReset} className="text-xs underline" style={{ color: "#7A9CC4" }}>
                        Use a different email
                    </button>
                </div>
            )}

            {step === "done" && (
                <div className="space-y-4">
                    {exportData && (
                        <div className="rounded-lg p-4 overflow-auto max-h-64" style={{ backgroundColor: "#0D1B2E", border: "1px solid #1E3A5F" }}>
                            <pre className="text-xs" style={{ color: "#C8D8E8" }}>
                                {JSON.stringify(exportData, null, 2)}
                            </pre>
                        </div>
                    )}
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-lg text-sm font-medium border transition-colors hover:text-white"
                        style={{ borderColor: "#1E3A5F", color: "#7A9CC4" }}
                    >
                        Start Over
                    </button>
                </div>
            )}
        </div>
    );
}

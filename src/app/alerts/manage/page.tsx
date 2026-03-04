"use client";

import { useState } from "react";
import { ShieldCheck, Mail, KeyRound, Trash2, ArrowRight, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ManageDataPage() {
    const [step, setStep] = useState<"request" | "verify" | "dashboard" | "success">("request");

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [alerts, setAlerts] = useState<any[]>([]);
    const [token, setToken] = useState("");

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/alerts/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send code");
            setStep("verify");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/alerts/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "list", email, code })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Invalid code");

            setAlerts(data.alerts || []);
            setToken(data.token);
            setStep("dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will instantly delete all your rate alerts and permanently remove your email from our database. This action cannot be undone.")) return;

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/alerts/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete_all", token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete data");

            setStep("success");
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 max-w-2xl">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-slate-100 p-3 rounded-xl">
                        <ShieldCheck className="w-8 h-8 text-[#4ADE80]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manage Your Data</h1>
                        <p className="text-slate-500 text-sm mt-1">GDPR & Privacy Center</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                )}

                {step === "request" && (
                    <form onSubmit={handleRequestCode} className="space-y-6">
                        <p className="text-slate-700 text-sm leading-relaxed">
                            Enter your email address below. We'll send you a secure 6-digit verification code to access your RemitIQ data dashboard.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A6A8A]" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl py-3 pl-12 pr-4 text-slate-900 outline-none transition-colors"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#F0B429] hover:bg-[#e0a623] text-slate-900 font-bold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                Send Verification Code
                            </button>
                        </div>
                    </form>
                )}

                {step === "verify" && (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <p className="text-slate-700 text-sm leading-relaxed">
                            We sent a 6-digit code to <strong className="text-slate-900">{email}</strong>. Entering this code verifies you own this email address.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A6A8A]" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl py-3 pl-12 pr-4 text-slate-900 outline-none transition-colors text-lg tracking-widest font-mono"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full bg-[#4ADE80] hover:bg-[#22c55e] text-slate-900 font-bold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                Verify & Access Data
                            </button>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep("request")}
                                    className="text-sm text-slate-500 hover:text-slate-900"
                                >
                                    &larr; Use a different email
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {step === "dashboard" && (
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <h3 className="text-slate-900 font-semibold mb-2">Active Email Alerts</h3>
                            <p className="text-slate-500 text-xs mb-4">The following alerts are currently tied to {email}.</p>

                            {alerts.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                                    <p className="text-slate-500 text-sm">You have no active alerts on RemitIQ.</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {alerts.map((alert, i) => (
                                        <li key={i} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                            <div>
                                                <span className="text-sm font-medium text-slate-900 block">Target: ₹{alert.target_rate}</span>
                                                <span className="text-xs text-slate-500">Created {new Date(alert.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="bg-slate-50 px-3 py-1 rounded text-xs text-[#F0B429] border border-slate-200">
                                                {alert.alert_type === 'both' ? 'All' : alert.alert_type}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                            <div className="flex items-start gap-3 mb-6">
                                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-slate-900 text-sm font-semibold">Danger Zone</h4>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                                        Clicking the button below will permanently delete all records related to this email address from our database, including the alerts above. You will stop receiving emails immediately.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                Permanently Delete My Data
                            </button>
                        </div>
                    </div>
                )}

                {step === "success" && (
                    <div className="text-center py-8 space-y-4">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-500/20 text-green-400 p-4 rounded-full">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Data Deleted</h2>
                        <p className="text-slate-700 text-sm leading-relaxed max-w-sm mx-auto">
                            Your email address and all associated active alerts have been permanently purged from our system in compliance with privacy regulations.
                        </p>
                        <div className="pt-6">
                            <Link href="/" className="text-[#F0B429] font-medium hover:underline">
                                Return to Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

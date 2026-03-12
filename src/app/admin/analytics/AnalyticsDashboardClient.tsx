"use client";

import { useState, useEffect, useCallback } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
    Users, Bell, Eye, Database, Activity, TrendingUp,
    CheckCircle2, AlertTriangle, RefreshCw, Clock, Zap, Globe, Link2,
} from "lucide-react";
import AnalyticsChatPanel from "./AnalyticsChatPanel";

type Period = "1d" | "7d" | "14d" | "mtd" | "qtd" | "ytd";

const PERIODS: { key: Period; label: string }[] = [
    { key: "1d",  label: "1D" },
    { key: "7d",  label: "7D" },
    { key: "14d", label: "14D" },
    { key: "mtd", label: "MTD" },
    { key: "qtd", label: "QTD" },
    { key: "ytd", label: "YTD" },
];

interface AnalyticsData {
    kpis: {
        totalAlerts: number;
        activeAlerts: number;
        uniqueUsers: number;
        totalPageViews: number;
        todayPageViews: number;
        weekPageViews: number;
        totalRateRecords: number;
        totalEvents: number;
    };
    alertsByDay: Array<{ date: string; signups: number; unique_users: number }>;
    pageViewsByDay: Array<{ date: string; views: number }>;
    topPages: Array<{ page_path: string; total_views: number }>;
    topReferrers: Array<{ referrer_domain: string; total_hits: number; landing_pages: string[] }>;
    recentEvents: Array<{ event_type: string; page_path: string | null; metadata: string | null; created_at: string }>;
    alertTypeDistribution: Array<{ alert_type: string; count: number }>;
    systemHealth: {
        latestRateDate: string | null;
        intelligenceFresh: boolean;
        totalProviders: number;
    };
    period: string;
}

const CHART_COLORS = ["#F0B429", "#4ADE80", "#818CF8", "#FF6B35", "#00B9FF", "#F87171"];

const EVENT_LABELS: Record<string, string> = {
    page_view: "Page View",
    alert_created: "Alert Created",
    chat_opened: "Chat Opened",
    affiliate_clicked: "Affiliate Click",
};

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString("en-AU", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

// ─── KPI Card ──────────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, subtitle, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
}) {
    return (
        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 hover:border-[#2E5A8F] transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <TrendingUp className="w-4 h-4 text-[#4A6A8A] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</p>
            <p className="text-sm text-[#7A9CC4]">{label}</p>
            {subtitle && <p className="text-xs text-[#4A6A8A] mt-1">{subtitle}</p>}
        </div>
    );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl px-4 py-3 shadow-xl">
            <p className="text-xs text-[#7A9CC4] mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-sm font-semibold text-white">
                    {p.name}: <span className="text-[#F0B429]">{p.value}</span>
                </p>
            ))}
        </div>
    );
}

function HealthBadge({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${ok ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            {ok ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span className={`text-sm ${ok ? "text-green-300" : "text-red-300"}`}>{label}</span>
        </div>
    );
}

function EmptyState({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[220px] text-[#4A6A8A]">
            <Icon className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{label}</p>
            {sub && <p className="text-xs mt-1">{sub}</p>}
        </div>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function AnalyticsDashboardClient({ data: initialData, adminKey }: {
    data: AnalyticsData;
    adminKey: string;
}) {
    const [data, setData] = useState<AnalyticsData>(initialData);
    const [period, setPeriod] = useState<Period>((initialData.period as Period) || "7d");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Flag this user as internal if they can see the dashboard
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("remitiq_internal_user", "true");
            } catch (e) { /* ignore */ }
        }
    }, []);

    const fetchData = useCallback(async (p: Period) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics?key=${adminKey}&period=${p}`);
            if (res.ok) {
                const fresh = await res.json();
                setData(fresh);
            }
        } catch { /* silently fail */ } finally {
            setLoading(false);
        }
    }, [adminKey]);

    const handlePeriodChange = (p: Period) => {
        setPeriod(p);
        fetchData(p);
    };

    const { kpis, alertsByDay, pageViewsByDay, topPages, topReferrers, recentEvents, alertTypeDistribution, systemHealth } = data;

    const alertChartData = alertsByDay.map(d => ({
        date: formatDate(d.date),
        Signups: d.signups,
        "Unique Users": d.unique_users,
    }));

    const pvChartData = pageViewsByDay.map(d => ({
        date: formatDate(d.date),
        Views: d.views,
    }));

    const pieData = alertTypeDistribution.map(d => ({
        name: d.alert_type === "both" ? "All Alerts" : d.alert_type === "rate" ? "Rate Only" : "Platform Only",
        value: d.count,
    }));

    return (
        <div className="min-h-screen bg-[#0A1628]">
            {/* Header */}
            <div className="border-b border-[#1E3A5F] bg-[#0D1B2E]/80 backdrop-blur-md sticky top-[57px] z-40">
                <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-[#F0B429] to-[#FF6B35] p-2.5 rounded-xl">
                            <Activity className="w-5 h-5 text-[#0A1628]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Analytics Dashboard</h1>
                            <p className="text-xs text-[#7A9CC4]">RemitIQ Admin — Live Data</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Period selector */}
                        <div className="flex items-center bg-[#111D32] border border-[#1E3A5F] rounded-xl p-1 gap-0.5">
                            {PERIODS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => handlePeriodChange(key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === key
                                        ? "bg-[#F0B429] text-[#0A1628]"
                                        : "text-[#7A9CC4] hover:text-white"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => fetchData(period)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#2E5A8F] border border-[#2E5A8F] text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className={`mx-auto max-w-7xl px-4 py-8 space-y-8 transition-opacity duration-300 ${loading ? "opacity-60" : "opacity-100"}`}>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard icon={Users} label="Unique Users" value={formatNumber(kpis.uniqueUsers)} subtitle="Alert subscribers" color="#F0B429" />
                    <KPICard icon={Bell} label="Active Alerts" value={formatNumber(kpis.activeAlerts)} subtitle={`${kpis.totalAlerts} total`} color="#4ADE80" />
                    <KPICard icon={Eye} label="Page Views (All)" value={formatNumber(kpis.totalPageViews)} subtitle={`${kpis.todayPageViews} today · ${kpis.weekPageViews} this week`} color="#818CF8" />
                    <KPICard icon={Database} label="Rate Records" value={formatNumber(kpis.totalRateRecords)} subtitle={`${kpis.totalEvents} events tracked`} color="#00B9FF" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Alert Signups */}
                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-[#F0B429]" />
                            <h2 className="text-lg font-semibold text-white">Alert Signups</h2>
                            <span className="text-xs text-[#7A9CC4] ml-auto">{PERIODS.find(p => p.key === period)?.label}</span>
                        </div>
                        {alertChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={alertChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradientSignups" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F0B429" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#F0B429" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                                    <XAxis dataKey="date" tick={{ fill: "#7A9CC4", fontSize: 11 }} axisLine={{ stroke: "#1E3A5F" }} />
                                    <YAxis tick={{ fill: "#7A9CC4", fontSize: 11 }} axisLine={{ stroke: "#1E3A5F" }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="Signups" stroke="#F0B429" fill="url(#gradientSignups)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="Unique Users" stroke="#4ADE80" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <EmptyState icon={Bell} label="No alert signups in this period" sub="Data will appear as users subscribe" />}
                    </div>

                    {/* Page Views */}
                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Eye className="w-5 h-5 text-[#818CF8]" />
                            <h2 className="text-lg font-semibold text-white">Page Views</h2>
                            <span className="text-xs text-[#7A9CC4] ml-auto">{PERIODS.find(p => p.key === period)?.label} · excl. admin</span>
                        </div>
                        {pvChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={pvChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                                    <XAxis dataKey="date" tick={{ fill: "#7A9CC4", fontSize: 11 }} axisLine={{ stroke: "#1E3A5F" }} />
                                    <YAxis tick={{ fill: "#7A9CC4", fontSize: 11 }} axisLine={{ stroke: "#1E3A5F" }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Views" fill="#818CF8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState icon={Eye} label="No page view data in this period" sub="Tracking begins when visitors arrive" />}
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Top Pages */}
                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Globe className="w-5 h-5 text-[#00B9FF]" />
                            <h2 className="text-lg font-semibold text-white">Top Pages</h2>
                        </div>
                        {topPages.length > 0 ? (
                            <div className="space-y-3">
                                {topPages.map((page, i) => {
                                    const max = topPages[0]?.total_views || 1;
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm text-[#C8D8E8] truncate max-w-[180px]">{page.page_path}</span>
                                                <span className="text-xs text-[#F0B429] font-semibold ml-2">{formatNumber(page.total_views)}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#0A1628] rounded-full">
                                                <div className="h-1.5 bg-gradient-to-r from-[#00B9FF] to-[#818CF8] rounded-full" style={{ width: `${(page.total_views / max) * 100}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <EmptyState icon={Globe} label="No page data in this period" />}
                    </div>

                    {/* Referrer Sources */}
                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Link2 className="w-5 h-5 text-[#FF6B35]" />
                            <h2 className="text-lg font-semibold text-white">Traffic Sources</h2>
                        </div>
                        {topReferrers && topReferrers.length > 0 ? (
                            <div className="space-y-3">
                                {topReferrers.map((ref, i) => {
                                    const max = topReferrers[0]?.total_hits || 1;
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm text-[#C8D8E8] truncate max-w-[160px]">{ref.referrer_domain}</span>
                                                <span className="text-xs text-[#FF6B35] font-semibold ml-2">{formatNumber(ref.total_hits)}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#0A1628] rounded-full">
                                                <div className="h-1.5 bg-gradient-to-r from-[#FF6B35] to-[#F0B429] rounded-full" style={{ width: `${(ref.total_hits / max) * 100}%` }} />
                                            </div>
                                            {ref.landing_pages?.length > 0 && (
                                                <p className="text-xs text-[#4A6A8A] mt-0.5 truncate">→ {ref.landing_pages.slice(0, 2).join(", ")}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <EmptyState icon={Link2} label="No external referrers yet" sub="Will populate as users arrive from Google, social, etc." />}
                    </div>

                    {/* Alert Type + System Health stacked */}
                    <div className="flex flex-col gap-6">
                        {/* Alert Types */}
                        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5 text-[#F0B429]" />
                                <h2 className="text-base font-semibold text-white">Alert Types</h2>
                            </div>
                            {pieData.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={140}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                                                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap gap-2 mt-1 justify-center">
                                        {pieData.map((d, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-xs text-[#C8D8E8]">
                                                <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                {d.name} ({d.value})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : <p className="text-sm text-[#4A6A8A] text-center py-4">No alert data</p>}
                        </div>

                        {/* System Health */}
                        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-[#4ADE80]" />
                                <h2 className="text-base font-semibold text-white">System Health</h2>
                            </div>
                            <div className="space-y-2">
                                <HealthBadge ok={!!systemHealth.latestRateDate} label={systemHealth.latestRateDate ? `Rates: ${systemHealth.latestRateDate}` : "No rate data"} />
                                <HealthBadge ok={systemHealth.intelligenceFresh} label={systemHealth.intelligenceFresh ? "Cache fresh" : "Cache stale"} />
                                <HealthBadge ok={systemHealth.totalProviders > 0} label={`${systemHealth.totalProviders} providers`} />
                                <div className="flex items-center gap-1.5 text-[#4A6A8A] pt-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs">{new Date().toLocaleString("en-AU")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Events Table */}
                <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Activity className="w-5 h-5 text-[#FF6B35]" />
                        <h2 className="text-lg font-semibold text-white">Recent Events</h2>
                        <span className="text-xs text-[#7A9CC4] ml-auto">Last 50 · excl. admin visits</span>
                    </div>
                    {recentEvents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#1E3A5F]">
                                        <th className="text-left py-3 px-3 text-[#7A9CC4] font-medium text-xs uppercase tracking-wider">Event</th>
                                        <th className="text-left py-3 px-3 text-[#7A9CC4] font-medium text-xs uppercase tracking-wider">Page</th>
                                        <th className="text-left py-3 px-3 text-[#7A9CC4] font-medium text-xs uppercase tracking-wider">Details</th>
                                        <th className="text-right py-3 px-3 text-[#7A9CC4] font-medium text-xs uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEvents.slice(0, 20).map((ev, i) => (
                                        <tr key={i} className="border-b border-[#1E3A5F]/50 hover:bg-[#0D1B2E] transition-colors">
                                            <td className="py-3 px-3">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        background: ev.event_type === "page_view" ? "#818CF815" : ev.event_type === "alert_created" ? "#4ADE8015" : "#F0B42915",
                                                        color: ev.event_type === "page_view" ? "#818CF8" : ev.event_type === "alert_created" ? "#4ADE80" : "#F0B429",
                                                    }}
                                                >
                                                    {EVENT_LABELS[ev.event_type] || ev.event_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-[#C8D8E8] truncate max-w-[200px]">{ev.page_path || "—"}</td>
                                            <td className="py-3 px-3 text-[#7A9CC4] text-xs truncate max-w-[200px]">{ev.metadata || "—"}</td>
                                            <td className="py-3 px-3 text-right text-[#7A9CC4] text-xs whitespace-nowrap">{formatDateTime(ev.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState icon={Activity} label="No events tracked yet" sub="Events will appear as users interact with the site" />
                    )}
                </div>
            </div>

            {/* AI Chat Panel */}
            <AnalyticsChatPanel adminKey={adminKey} />
        </div>
    );
}

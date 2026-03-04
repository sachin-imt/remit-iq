"use client";

import { useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
    Users, Bell, Eye, Database, Activity, TrendingUp,
    CheckCircle2, AlertTriangle, RefreshCw, Clock, Zap, Globe,
} from "lucide-react";

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
    recentEvents: Array<{ event_type: string; page_path: string | null; metadata: string | null; created_at: string }>;
    alertTypeDistribution: Array<{ alert_type: string; count: number }>;
    systemHealth: {
        latestRateDate: string | null;
        intelligenceFresh: boolean;
        totalProviders: number;
    };
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
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-[#2E5A8F] transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br`} style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <TrendingUp className="w-4 h-4 text-[#4A6A8A] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
            {subtitle && <p className="text-xs text-[#4A6A8A] mt-1">{subtitle}</p>}
        </div>
    );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xl">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-sm font-semibold text-slate-900">
                    {p.name}: <span className="text-[#F0B429]">{p.value}</span>
                </p>
            ))}
        </div>
    );
}

// ─── System Health Indicator ───────────────────────────────────────────────

function HealthBadge({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${ok ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            {ok ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm ${ok ? "text-green-300" : "text-red-300"}`}>{label}</span>
        </div>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function AnalyticsDashboardClient({ data, adminKey }: { data: AnalyticsData; adminKey: string }) {
    const [refreshing, setRefreshing] = useState(false);
    const { kpis, alertsByDay, pageViewsByDay, topPages, recentEvents, alertTypeDistribution, systemHealth } = data;

    const handleRefresh = () => {
        setRefreshing(true);
        window.location.reload();
    };

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
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-[57px] z-40">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-[#F0B429] to-[#FF6B35] p-2.5 rounded-xl">
                            <Activity className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
                            <p className="text-xs text-slate-500">RemitIQ Admin — Live Data</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-[#2E5A8F] border border-[#2E5A8F] text-slate-900 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard icon={Users} label="Unique Users" value={formatNumber(kpis.uniqueUsers)} subtitle="Alert subscribers" color="#F0B429" />
                    <KPICard icon={Bell} label="Active Alerts" value={formatNumber(kpis.activeAlerts)} subtitle={`${kpis.totalAlerts} total`} color="#4ADE80" />
                    <KPICard icon={Eye} label="Page Views" value={formatNumber(kpis.totalPageViews)} subtitle={`${kpis.todayPageViews} today · ${kpis.weekPageViews} this week`} color="#818CF8" />
                    <KPICard icon={Database} label="Rate Records" value={formatNumber(kpis.totalRateRecords)} subtitle={`${kpis.totalEvents} events tracked`} color="#00B9FF" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Alert Signups Chart */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-[#F0B429]" />
                            <h2 className="text-lg font-semibold text-slate-900">Alert Signups</h2>
                            <span className="text-xs text-slate-500 ml-auto">Last 30 days</span>
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
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[260px] text-[#4A6A8A]">
                                <Bell className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm">No alert signups yet</p>
                                <p className="text-xs mt-1">Data will appear as users subscribe</p>
                            </div>
                        )}
                    </div>

                    {/* Page Views Chart */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Eye className="w-5 h-5 text-[#818CF8]" />
                            <h2 className="text-lg font-semibold text-slate-900">Page Views</h2>
                            <span className="text-xs text-slate-500 ml-auto">Last 30 days</span>
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
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[260px] text-[#4A6A8A]">
                                <Eye className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm">No page view data yet</p>
                                <p className="text-xs mt-1">Tracking begins when visitors arrive</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row — Top Pages, Alert Distribution, Events */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Top Pages */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Globe className="w-5 h-5 text-[#00B9FF]" />
                            <h2 className="text-lg font-semibold text-slate-900">Top Pages</h2>
                        </div>
                        {topPages.length > 0 ? (
                            <div className="space-y-3">
                                {topPages.map((page, i) => {
                                    const maxViews = topPages[0]?.total_views || 1;
                                    const pct = (page.total_views / maxViews) * 100;
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm text-slate-700 truncate max-w-[200px]">{page.page_path}</span>
                                                <span className="text-xs text-[#F0B429] font-semibold ml-2">{formatNumber(page.total_views)}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-50 rounded-full">
                                                <div className="h-1.5 bg-gradient-to-r from-[#00B9FF] to-[#818CF8] rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-[#4A6A8A]">
                                <Globe className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-sm">No page data yet</p>
                            </div>
                        )}
                    </div>

                    {/* Alert Type Distribution */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Zap className="w-5 h-5 text-[#F0B429]" />
                            <h2 className="text-lg font-semibold text-slate-900">Alert Types</h2>
                        </div>
                        {pieData.length > 0 ? (
                            <div className="flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                                    {pieData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            {d.name} ({d.value})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-[#4A6A8A]">
                                <Zap className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-sm">No alert data</p>
                            </div>
                        )}
                    </div>

                    {/* System Health */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Activity className="w-5 h-5 text-[#4ADE80]" />
                            <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
                        </div>
                        <div className="space-y-3">
                            <HealthBadge
                                ok={!!systemHealth.latestRateDate}
                                label={systemHealth.latestRateDate ? `Rates up to ${systemHealth.latestRateDate}` : "No rate data"}
                            />
                            <HealthBadge
                                ok={systemHealth.intelligenceFresh}
                                label={systemHealth.intelligenceFresh ? "Intelligence cache fresh" : "Intelligence stale (> 24h)"}
                            />
                            <HealthBadge
                                ok={systemHealth.totalProviders > 0}
                                label={`${systemHealth.totalProviders} providers configured`}
                            />
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs">Dashboard rendered at {new Date().toLocaleString("en-AU")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Events Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Activity className="w-5 h-5 text-[#FF6B35]" />
                        <h2 className="text-lg font-semibold text-slate-900">Recent Events</h2>
                        <span className="text-xs text-slate-500 ml-auto">Last 50</span>
                    </div>
                    {recentEvents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Event</th>
                                        <th className="text-left py-3 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Page</th>
                                        <th className="text-left py-3 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Details</th>
                                        <th className="text-right py-3 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEvents.slice(0, 20).map((ev, i) => (
                                        <tr key={i} className="border-b border-slate-200/50 hover:bg-white transition-colors">
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
                                            <td className="py-3 px-3 text-slate-700 truncate max-w-[200px]">{ev.page_path || "—"}</td>
                                            <td className="py-3 px-3 text-slate-500 text-xs truncate max-w-[200px]">{ev.metadata || "—"}</td>
                                            <td className="py-3 px-3 text-right text-slate-500 text-xs whitespace-nowrap">{formatDateTime(ev.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#4A6A8A]">
                            <Activity className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">No events tracked yet</p>
                            <p className="text-xs mt-1">Events will appear as users interact with the site</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export interface AnalyticsSummaryData {
  kpis: {
    uniqueUsers: number;
    totalAlerts: number;
    activeAlerts: number;
    todayPageViews: number;
    weekPageViews: number;
    totalEvents: number;
  };
  alertsByDay: Array<{ date: string; signups: number; unique_users: number }>;
  pageViewsByDay: Array<{ date: string; views: number }>;
  topPages: Array<{ page_path: string; total_views: number }>;
  recentEvents: Array<{ created_at: string; event_type: string; page_path: string | null }>;
  alertTypeDistribution: Array<{ alert_type: string; count: number }>;
}

export function buildAnalyticsSystemPrompt(data: AnalyticsSummaryData): string {
  const { kpis, alertsByDay, pageViewsByDay, topPages, recentEvents, alertTypeDistribution } = data;

  const alertTimeline = alertsByDay.slice(-14)
    .map(d => `${d.date.slice(5)}:${d.signups}(${d.unique_users})`)
    .join(",") || "none";

  const pvTimeline = pageViewsByDay.slice(-14)
    .map(d => `${d.date.slice(5)}:${d.views}`)
    .join(",") || "none";

  const topPagesList = topPages.slice(0, 5)
    .map((p, i) => `${i + 1}.${p.page_path}(${p.total_views})`)
    .join("; ");

  const recentEventsList = recentEvents.slice(0, 8)
    .map(e => `[${e.created_at.slice(11, 16)}] ${e.event_type} on ${e.page_path || ""}`)
    .join("\n");

  const alertDistArr = alertTypeDistribution.map(d => `${d.alert_type}:${d.count}`).join(", ");

  return `You are RemitIQ's Analytics AI. Answer questions about user growth, traffic, and system health.
Today: ${new Date().toISOString().slice(0, 10)}

METRICS: Users:${kpis.uniqueUsers}, Alerts:${kpis.totalAlerts}, Active:${kpis.activeAlerts}, PV_Today:${kpis.todayPageViews}, PV_Week:${kpis.weekPageViews}, Events:${kpis.totalEvents}
SIGNUPS(MM-DD:Count(Unique)): ${alertTimeline}
VIEWS(MM-DD:Count): ${pvTimeline}
TOP_PAGES: ${topPagesList}
ALERTS: ${alertDistArr}
EVENTS:
${recentEventsList}

CONTEXT:
- App is early-stage; most signups are automated Playwright tests (automated-test@remitiq.co).
- Organic traffic is pre-launch.
- Providers: Wise, Remitly, TorFX, OFX, Instarem, Western Union.
- Goal: Australians sending to India.

Reply CONCISELY (<150 words). Use bullets for lists. Be honest if data is missing. No financial advice.`;
}

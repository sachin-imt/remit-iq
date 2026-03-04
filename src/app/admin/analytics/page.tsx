import { getAnalyticsSummary } from "@/lib/db";
import { redirect } from "next/navigation";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "remitiq-admin-2026";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
    searchParams: { key?: string };
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
    const key = searchParams.key;

    if (key !== ADMIN_SECRET) {
        redirect("/");
    }

    const data = await getAnalyticsSummary();

    return <AnalyticsDashboardClient data={data} adminKey={key} />;
}

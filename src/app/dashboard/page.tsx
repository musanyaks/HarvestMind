import { DashboardCharts } from "@/components/dashboard-charts";
import { BarChart3, Sprout } from "lucide-react";

export const metadata = {
  title: "Dashboard | HarvestMind",
  description: "Power BI-style analytics for Kenyan crop yield predictions.",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <BarChart3 className="h-3.5 w-3.5" />
          Kenya analytics
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Farm intelligence dashboard</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Analytics for Kenyan crop forecasts. Filter by crop, region, season, and date range; explore yield, harvest, rainfall relationships, and export the underlying data.
        </p>
      </div>

      <DashboardCharts />
    </div>
  );
}

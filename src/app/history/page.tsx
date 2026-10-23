import { HistoryTable } from "@/components/history-table";
import { History } from "lucide-react";

export const metadata = {
  title: "Prediction History | HarvestMind",
  description: "Review, compare, and manage past crop yield forecasts.",
};

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <History className="h-3.5 w-3.5" />
          Saved forecasts
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Prediction history</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          All forecasts are persisted with full inputs and recommendations. Delete records you no longer need.
        </p>
      </div>

      <HistoryTable />
    </div>
  );
}

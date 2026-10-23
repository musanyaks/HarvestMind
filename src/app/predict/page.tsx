import { Sprout } from "lucide-react";
import { PredictionForm } from "@/components/prediction-form";

export const metadata = {
  title: "Predict Yield | HarvestMind",
  description: "Run an explainable crop yield forecast for Kenyan farms from soil, weather, and farm management inputs.",
};

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sprout className="h-3.5 w-3.5" />
          Yield forecaster
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Predict crop yield</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Enter Kenyan field details below. HarvestMind runs a multi-factor agronomic model calibrated for
          Kenya&apos;s agro-ecological zones and returns a yield forecast, confidence interval,
          feature-importance breakdown, and prioritized recommendations.
        </p>
      </div>

      <PredictionForm />
    </div>
  );
}

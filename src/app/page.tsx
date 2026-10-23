import Link from "next/link";
import {
  BarChart3,
  BrainCircuit,
  CloudSun,
  Database,
  Leaf,
  ShieldCheck,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

  const kenyanCrops = [
    "Maize", "Beans", "Sorghum", "Millet", "Rice", "Wheat", "Irish Potato", "Sweet Potato",
    "Cassava", "Tea", "Coffee", "Green Grams", "Cowpeas", "Groundnuts", "Soybean", "Banana",
    "Tomato", "Onion", "Cabbage", "Kale"
  ];

  const features = [
  {
    icon: BrainCircuit,
    title: "Explainable model",
    description:
      "Every prediction is decomposed into feature contributions so farmers understand why a number was produced.",
  },
  {
    icon: CloudSun,
    title: "Weather-aware",
    description:
      "Pull seasonal climate normals from Open-Meteo or override with local observations.",
  },
  {
    icon: Database,
    title: "Persistent history",
    description:
      "Predictions are saved to PostgreSQL with full inputs and recommendations for year-over-year comparison.",
  },
  {
    icon: ShieldCheck,
    title: "Low-bandwidth first",
    description:
      "Server-rendered pages, minimal client JS, and compressed payloads for unreliable connectivity.",
  },
];

const workflow = [
  { step: "01", title: "Input field data", description: "Crop, season, area, soil test, irrigation method." },
  { step: "02", title: "Add climate", description: "Fetch seasonal weather or type local rainfall and temperature." },
  { step: "03", title: "Get forecast", description: "Yield estimate with confidence band and driver breakdown." },
  { step: "04", title: "Act", description: "Prioritized recommendations for soil, water, and crop management." },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-40 h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Leaf className="h-4 w-4" />
            2025 release
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Kenya crop yield intelligence
            <br />
            <span className="gradient-text">built for smallholder farms</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            <strong className="text-foreground">The problem:</strong> Kenyan smallholder farmers make
            planting decisions with almost no forward-looking data for maize, beans, tea, coffee, and other key crops.
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            <strong className="text-foreground">The approach:</strong> a regression pipeline over
            Long Rains / Short Rains weather, soil chemistry, and seasonal features, with feature-importance reports so every prediction
            can be explained rather than trusted blindly.
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            <strong className="text-foreground">The result:</strong> a lightweight model calibrated for Kenyan agro-ecological zones that runs
            on modest hardware and an interface designed for low-bandwidth use.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/predict">
              <Button size="lg">
                <Sprout className="mr-2 h-5 w-5" />
                Start forecasting
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                <BarChart3 className="mr-2 h-5 w-5" />
                View dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Capabilities</h2>
            <p className="mt-3 text-muted-foreground">
              Designed around real-world farm decision-making.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Crops covered</h2>
            <p className="mt-3 text-muted-foreground">
              Calibrated profiles for Kenya&apos;s most important food and cash crops.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {kenyanCrops.map((crop) => (
              <span
                key={crop}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                {crop}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              From field data to actionable forecast in four steps.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-border bg-card p-6"
              >
                <span className="absolute right-4 top-4 text-4xl font-bold text-border">
                  {item.step}
                </span>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/20 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <TrendingUp className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-2xl font-bold sm:text-3xl">Ready to improve planting decisions?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Run your first forecast, compare scenarios, and build a history of predictions for your farm.
          </p>
          <Link href="/predict" className="mt-8 inline-block">
            <Button size="lg">
              <Sprout className="mr-2 h-5 w-5" />
              Predict yield now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

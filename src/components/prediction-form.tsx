"use client";

import { useState } from "react";
import { CloudRain, Loader2, MapPin, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CROP_OPTIONS,
  IRRIGATION_OPTIONS,
  KENYA_CENTER,
  REGION_OPTIONS,
  SEASON_OPTIONS,
} from "@/lib/agronomy/crops";
import { PredictionResult, PredictionInput } from "@/lib/agronomy/model";
import { Recommendation } from "@/lib/agronomy/recommendations";
import { PredictionResultCard } from "@/components/prediction-result-card";

interface PredictionResponse {
  id: number;
  input: PredictionInput;
  result: PredictionResult;
  recommendations: Recommendation[];
  createdAt: string;
}

export function PredictionForm() {
  const [form, setForm] = useState<PredictionInput>({
    crop: "maize",
    region: "Rift Valley",
    season: "long_rains",
    areaHectares: 1,
    soilPh: 6.2,
    nitrogen: 80,
    phosphorus: 35,
    potassium: 50,
    soilMoisture: 55,
    avgTemperature: 22,
    humidity: 65,
    rainfallMm: 750,
    irrigation: "rainfed",
  });

  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const update = <K extends keyof PredictionInput>(key: K, value: PredictionInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weather?latitude=${KENYA_CENTER.latitude}&longitude=${KENYA_CENTER.longitude}&season=${form.season}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch weather");
      setForm((prev) => ({
        ...prev,
        avgTemperature: data.avgTemperature,
        humidity: data.humidity,
        rainfallMm: data.rainfallMm,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Weather fetch failed");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="crop">
              <Sprout className="mr-1 inline h-4 w-4" />
              Crop
            </Label>
            <Select
              id="crop"
              value={form.crop}
              onChange={(e) => update("crop", e.target.value)}
            >
              {CROP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="season">Growing season</Label>
            <Select
              id="season"
              value={form.season}
              onChange={(e) => update("season", e.target.value)}
            >
              {SEASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">
              <MapPin className="mr-1 inline h-4 w-4" />
              Region
            </Label>
            <Select
              id="region"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              required
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaHectares">Area (hectares)</Label>
            <Input
              id="areaHectares"
              type="number"
              step="0.1"
              min="0.1"
              value={form.areaHectares}
              onChange={(e) => update("areaHectares", parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="irrigation">Irrigation method</Label>
            <Select
              id="irrigation"
              value={form.irrigation}
              onChange={(e) => update("irrigation", e.target.value)}
            >
              {IRRIGATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Climate inputs</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchWeather}
              isLoading={weatherLoading}
            >
              <CloudRain className="mr-1 h-4 w-4" />
              Fill from Open-Meteo
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="avgTemperature">Avg. temperature (°C)</Label>
              <Input
                id="avgTemperature"
                type="number"
                step="0.1"
                value={form.avgTemperature}
                onChange={(e) => update("avgTemperature", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.humidity}
                onChange={(e) => update("humidity", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rainfallMm">Seasonal rainfall (mm)</Label>
              <Input
                id="rainfallMm"
                type="number"
                step="1"
                min="0"
                value={form.rainfallMm}
                onChange={(e) => update("rainfallMm", parseFloat(e.target.value))}
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-5">
          <h3 className="mb-4 font-semibold">Soil test results</h3>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="soilPh">Soil pH</Label>
              <Input
                id="soilPh"
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={form.soilPh}
                onChange={(e) => update("soilPh", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nitrogen">Nitrogen (kg/ha)</Label>
              <Input
                id="nitrogen"
                type="number"
                step="1"
                min="0"
                value={form.nitrogen}
                onChange={(e) => update("nitrogen", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phosphorus">Phosphorus (kg/ha)</Label>
              <Input
                id="phosphorus"
                type="number"
                step="1"
                min="0"
                value={form.phosphorus}
                onChange={(e) => update("phosphorus", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (kg/ha)</Label>
              <Input
                id="potassium"
                type="number"
                step="1"
                min="0"
                value={form.potassium}
                onChange={(e) => update("potassium", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="soilMoisture">Soil moisture (%)</Label>
              <Input
                id="soilMoisture"
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.soilMoisture}
                onChange={(e) => update("soilMoisture", parseFloat(e.target.value))}
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full sm:w-auto" isLoading={loading}>
          {loading ? "Running model..." : "Predict yield"}
        </Button>
      </form>

      <div className="lg:sticky lg:top-24 lg:self-start">
        {result ? (
          <PredictionResultCard response={result} />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sprout className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Ready to forecast</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill in the form and click Predict yield to see results, explanations, and recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Droplets, Sun, Thermometer, TrendingUp, Waves } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PredictionResult, PredictionInput } from "@/lib/agronomy/model";
import { Recommendation } from "@/lib/agronomy/recommendations";

interface PredictionResponse {
  id: number;
  input: PredictionInput;
  result: PredictionResult;
  recommendations: Recommendation[];
  createdAt: string;
}

interface Props {
  response: PredictionResponse;
}

const categoryIcons: Record<string, React.ReactNode> = {
  soil: <Droplets className="h-4 w-4" />,
  water: <Waves className="h-4 w-4" />,
  climate: <Sun className="h-4 w-4" />,
  management: <TrendingUp className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  soil: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  water: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  climate: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  management: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

export function PredictionResultCard({ response }: Props) {
  const { result, recommendations, input } = response;

  const chartData = useMemo(
    () =>
      result.featureImportance.map((item) => ({
        name: item.feature,
        value: item.contribution,
        direction: item.direction,
      })),
    [result.featureImportance]
  );

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-card to-secondary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            Forecast result
          </CardTitle>
          <CardDescription>
            {result.crop} · {input.areaHectares} ha · {input.season.replace("_", " ")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Predicted yield</p>
            <p className="text-4xl font-bold tracking-tight text-primary">
              {result.predictedYieldTonsPerHa}
              <span className="ml-2 text-base font-medium text-muted-foreground">t/ha</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Total harvest</p>
              <p className="text-lg font-semibold">{result.totalHarvestTons} t</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-lg font-semibold">
                {result.confidenceLower}–{result.confidenceUpper}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md bg-secondary p-2">
              <p className="text-muted-foreground">Soil</p>
              <p className="font-semibold text-foreground">{result.soilQualityIndex}</p>
            </div>
            <div className="rounded-md bg-secondary p-2">
              <p className="text-muted-foreground">Climate</p>
              <p className="font-semibold text-foreground">{result.climateIndex}</p>
            </div>
            <div className="rounded-md bg-secondary p-2">
              <p className="text-muted-foreground">Irrigation</p>
              <p className="font-semibold text-foreground">{result.irrigationFactor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature importance</CardTitle>
          <CardDescription>What drives this prediction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f230d" horizontal={false} />
                <XAxis type="number" domain={[0, "dataMax + 5"]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={75}
                  tick={{ fill: "#fdba74", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(34, 197, 94, 0.05)" }}
                  contentStyle={{
                    backgroundColor: "#11180f",
                    border: "1px solid #3f230d",
                    borderRadius: "0.5rem",
                    color: "#f0fdf4",
                  }}
                  formatter={(value) => [`${value}%`, "Importance"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.direction === "positive" ? "#f97316" : "#f87171"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agronomic recommendations</CardTitle>
          <CardDescription>Prioritized actions for this field</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex gap-3 rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div className="mt-0.5 text-muted-foreground">{categoryIcons[rec.category]}</div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium">{rec.title}</span>
                  <Badge
                    variant={rec.priority === "high" ? "destructive" : "default"}
                    className={categoryColors[rec.category]}
                  >
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

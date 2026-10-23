"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Calendar,
  Download,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Sprout,
  Sun,
  TrendingUp,
  Waves,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CROP_OPTIONS, REGION_OPTIONS, SEASON_OPTIONS } from "@/lib/agronomy/crops";
import { KenyaMap } from "@/components/maps/kenya-map";

interface Totals {
  totalPredictions: number;
  avgYield: number;
  maxYield: number;
  totalHarvest: number;
  totalArea: number;
  uniqueCrops: number;
}

interface BreakdownRow {
  crop: string;
  count: number;
  avgYield: number;
  totalHarvest: number;
  totalArea: number;
}

interface RegionRow {
  region: string;
  count: number;
  avgYield: number;
  totalHarvest: number;
}

interface SeasonRow {
  season: string;
  count: number;
  avgYield: number;
}

interface MonthlyRow {
  month: string;
  count: number;
  avgYield: number;
  totalHarvest: number;
}

interface RecentRow {
  crop: string;
  region: string;
  season: string;
  areaHectares: number;
  predictedYieldTonsPerHa: number;
  totalHarvestTons: number;
  rainfallMm: number;
  avgTemperature: number;
  createdAt: string;
}

interface StatsResponse {
  totals: Totals;
  cropBreakdown: BreakdownRow[];
  regionBreakdown: RegionRow[];
  seasonBreakdown: SeasonRow[];
  monthlyTrend: MonthlyRow[];
  recent: RecentRow[];
}

const COLORS = ["#f97316", "#fb923c", "#ea580c", "#fdba74", "#c2410c", "#fed7aa", "#9a3412", "#ffedd5"];

const seasonLabel: Record<string, string> = {
  long_rains: "Long Rains",
  short_rains: "Short Rains",
  off_season: "Off-Season",
  perennial: "Perennial",
};

function capitalizeSeason(season: string) {
  return seasonLabel[season] || season.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardCharts() {
  const [filters, setFilters] = useState({
    crop: "",
    region: "",
    season: "",
    startDate: format(subMonths(new Date(), 6), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.crop) params.set("crop", filters.crop);
    if (filters.region) params.set("region", filters.region);
    if (filters.season) params.set("season", filters.season);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    return params.toString();
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?${buildQuery()}`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters.crop, filters.region, filters.season, filters.startDate, filters.endDate]);

  const harvestByCrop = useMemo(
    () =>
      (stats?.cropBreakdown || []).map((row) => ({
        name: row.crop.charAt(0).toUpperCase() + row.crop.slice(1),
        value: Number(row.totalHarvest.toFixed(2)),
      })),
    [stats]
  );

  const yieldByRegion = useMemo(
    () =>
      (stats?.regionBreakdown || []).map((row) => ({
        region: row.region,
        yield: row.avgYield,
      })),
    [stats]
  );

  const rainfallVsYield = useMemo(
    () =>
      (stats?.recent || []).map((row) => ({
        x: row.rainfallMm,
        y: row.predictedYieldTonsPerHa,
        crop: row.crop,
      })),
    [stats]
  );

  const exportCSV = () => {
    if (!stats?.recent.length) return;
    const headers = [
      "Date",
      "Crop",
      "Region",
      "Season",
      "Area (ha)",
      "Yield (t/ha)",
      "Harvest (t)",
      "Rainfall (mm)",
      "Temperature (°C)",
    ];
    const rows = stats.recent.map((row) => [
      new Date(row.createdAt).toLocaleDateString(),
      row.crop,
      row.region,
      capitalizeSeason(row.season),
      row.areaHectares,
      row.predictedYieldTonsPerHa,
      row.totalHarvestTons,
      row.rainfallMm,
      row.avgTemperature,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harvestmind-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || stats.totals.totalPredictions === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No prediction data available for the selected filters.</p>
          <a
            href="/predict"
            className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Run a prediction
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <Card className="border-primary/10 bg-secondary/30">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <FilterSelect
              label="Crop"
              value={filters.crop}
              onChange={(v) => setFilters((f) => ({ ...f, crop: v }))}
              options={[{ value: "", label: "All crops" }, ...CROP_OPTIONS]}
            />
            <FilterSelect
              label="Region"
              value={filters.region}
              onChange={(v) => setFilters((f) => ({ ...f, region: v }))}
              options={[{ value: "", label: "All regions" }, ...REGION_OPTIONS]}
            />
            <FilterSelect
              label="Season"
              value={filters.season}
              onChange={(v) => setFilters((f) => ({ ...f, season: v }))}
              options={[
                { value: "", label: "All seasons" },
                ...SEASON_OPTIONS,
              ]}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Start date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">End date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchStats} isLoading={loading}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-1 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Sprout}
          label="Total predictions"
          value={stats.totals.totalPredictions}
          subtitle={`${stats.totals.uniqueCrops} unique crops`}
        />
        <KpiCard
          icon={TrendingUp}
          label="Average yield"
          value={`${stats.totals.avgYield} t/ha`}
          subtitle={`Max ${stats.totals.maxYield} t/ha`}
        />
        <KpiCard
          icon={Waves}
          label="Total harvest"
          value={`${stats.totals.totalHarvest.toLocaleString()} t`}
          subtitle={`Across ${stats.totals.totalArea.toLocaleString()} ha`}
        />
        <KpiCard
          icon={Calendar}
          label="Period"
          value={`${format(new Date(filters.startDate), "MMM d")} - ${format(
            new Date(filters.endDate),
            "MMM d"
          )}`}
          subtitle={`${stats.totals.totalPredictions} forecasts`}
        />
      </div>

      {/* Kenya map */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Kenya regional map
            </CardTitle>
            <CardDescription>
              Click a region to filter analytics. Color intensity shows average yield.
            </CardDescription>
          </div>
          {filters.region && (
            <Badge
              variant="default"
              className="w-fit cursor-pointer bg-primary/15 text-primary hover:bg-primary/25"
              onClick={() => setFilters((f) => ({ ...f, region: "" }))}
            >
              {filters.region} ×
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <KenyaMap
              data={stats.regionBreakdown}
              selectedRegion={filters.region}
              onRegionClick={(region) =>
                setFilters((f) => ({ ...f, region: f.region === region ? "" : region }))
              }
              metric="avgYield"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average yield by crop</CardTitle>
            <CardDescription>Performance comparison across forecasted crops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.cropBreakdown} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f230d" vertical={false} />
                  <XAxis
                    dataKey="crop"
                    tick={{ fill: "#fdba74", fontSize: 12 }}
                    tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#fdba74", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "t/ha", angle: -90, position: "insideLeft", fill: "#fdba74" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="avgYield" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Harvest share</CardTitle>
            <CardDescription>Contribution by crop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={harvestByCrop}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {harvestByCrop.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Yield by region</CardTitle>
            <CardDescription>Geographic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldByRegion} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f230d" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#fdba74", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="region"
                    tick={{ fill: "#fdba74", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="yield" fill="#fb923c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yield by season</CardTitle>
            <CardDescription>Seasonal comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.seasonBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f230d" vertical={false} />
                  <XAxis
                    dataKey="season"
                    tick={{ fill: "#fdba74", fontSize: 11 }}
                    tickFormatter={(v) => capitalizeSeason(v)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#fdba74", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="avgYield" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rainfall vs. yield</CardTitle>
            <CardDescription>Climate-yield relationship</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 8, right: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f230d" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Rainfall"
                    unit="mm"
                    tick={{ fill: "#fdba74", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Yield"
                    unit="t/ha"
                    tick={{ fill: "#fdba74", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-card p-2 text-xs shadow-lg">
                            <p className="font-medium capitalize">{p.crop}</p>
                            <p className="text-muted-foreground">Rainfall: {p.x} mm</p>
                            <p className="text-muted-foreground">Yield: {p.y} t/ha</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={rainfallVsYield} fill="#f97316" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast trend over time</CardTitle>
          <CardDescription>Monthly average yield and forecast count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrend} margin={{ left: 8, right: 20 }}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f230d" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#fdba74", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#fdba74", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Yield (t/ha)", angle: -90, position: "insideLeft", fill: "#fdba74" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#fdba74", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  label={{ value: "Forecasts", angle: 90, position: "insideRight", fill: "#fdba74" }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgYield"
                  name="Avg yield (t/ha)"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorYield)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  name="Forecasts"
                  stroke="#fb923c"
                  strokeWidth={2}
                  dot={{ fill: "#fb923c", strokeWidth: 0, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent forecasts</CardTitle>
          <CardDescription>Latest predictions matching your filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Crop</th>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium">Season</th>
                  <th className="px-4 py-3 font-medium text-right">Area (ha)</th>
                  <th className="px-4 py-3 font-medium text-right">Yield (t/ha)</th>
                  <th className="px-4 py-3 font-medium text-right">Harvest (t)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recent.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">{row.crop}</td>
                    <td className="px-4 py-3">{row.region}</td>
                    <td className="px-4 py-3">{capitalizeSeason(row.season)}</td>
                    <td className="px-4 py-3 text-right">{row.areaHectares}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {row.predictedYieldTonsPerHa}
                    </td>
                    <td className="px-4 py-3 text-right">{row.totalHarvestTons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
      <CardContent className="py-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </div>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-40">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-lg">
        <p className="mb-1 font-medium">{typeof label === "string" ? label.replace(/_/g, " ") : label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-muted-foreground">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

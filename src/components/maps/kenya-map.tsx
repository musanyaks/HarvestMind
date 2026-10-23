"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { COUNTY_TO_REGION } from "@/lib/kenya-county-regions";

export interface RegionData {
  region: string;
  count: number;
  avgYield: number;
  totalHarvest: number;
}

interface KenyaMapProps {
  data: RegionData[];
  selectedRegion?: string;
  onRegionClick?: (region: string) => void;
  metric?: "avgYield" | "totalHarvest" | "count";
  className?: string;
}

interface GeoFeature {
  type: "Feature";
  properties: {
    COUNTY: string;
    Shape_Area?: number;
    Shape_Leng?: number;
    AREA_KM2?: number;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJson {
  type: "FeatureCollection";
  features: GeoFeature[];
}

const VIEWBOX = { width: 800, height: 700 };
const BOUNDS = {
  minLon: 33.9,
  maxLon: 41.9,
  minLat: -4.7,
  maxLat: 5.5,
};

const scale = Math.min(
  VIEWBOX.width / (BOUNDS.maxLon - BOUNDS.minLon),
  VIEWBOX.height / (BOUNDS.maxLat - BOUNDS.minLat)
);

function interpolateColor(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  const start = { h: 24, s: 85, l: 25 };
  const end = { h: 24, s: 95, l: 62 };
  const h = Math.round(start.h + (end.h - start.h) * t);
  const s = Math.round(start.s + (end.s - start.s) * t);
  const l = Math.round(start.l + (end.l - start.l) * t);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function project(lon: number, lat: number): [number, number] {
  const x = (lon - BOUNDS.minLon) * scale;
  const y = (BOUNDS.maxLat - lat) * scale;
  return [x, y];
}

function polygonToPath(coordinates: number[][]): string {
  if (!coordinates.length) return "";
  const points = coordinates.map(([lon, lat]) => {
    const [x, y] = project(lon, lat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${points.join(" L ")} Z`;
}

function featureToPaths(feature: GeoFeature): string[] {
  if (feature.geometry.type === "Polygon") {
    return (feature.geometry.coordinates as number[][][]).map(polygonToPath);
  }
  const paths: string[] = [];
  for (const polygon of feature.geometry.coordinates as number[][][][]) {
    paths.push(...polygon.map(polygonToPath));
  }
  return paths;
}

const METRIC_LABELS: Record<string, string> = {
  avgYield: "Avg yield (t/ha)",
  totalHarvest: "Total harvest (t)",
  count: "Forecasts",
};

function formatMetric(value: number, metric: string) {
  if (metric === "count") return value.toString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function KenyaMap({
  data,
  selectedRegion,
  onRegionClick,
  metric = "avgYield",
  className,
}: KenyaMapProps) {
  const [geoJson, setGeoJson] = useState<GeoJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/kenya-counties.geojson")
      .then((res) => res.json())
      .then((data: GeoJson) => {
        setGeoJson(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dataMap = useMemo(() => {
    const map: Record<string, RegionData> = {};
    for (const row of data) {
      map[row.region] = row;
    }
    return map;
  }, [data]);

  const maxValue = useMemo(() => {
    if (!data.length) return 1;
    return Math.max(...data.map((d) => d[metric]));
  }, [data, metric]);

  const getColor = (regionId: string | undefined) => {
    if (!regionId) return "#3d4f3d";
    const row = dataMap[regionId];
    if (!row) return "#3d4f3d";
    const intensity = row[metric] / maxValue;
    return interpolateColor(intensity);
  };

  const hoveredRegion = hoveredCounty ? COUNTY_TO_REGION[hoveredCounty] : null;
  const hoveredData = hoveredRegion ? dataMap[hoveredRegion] : null;

  if (loading) {
    return (
      <div className={cn("flex h-full items-center justify-center text-muted-foreground", className)}>
        Loading Kenya map...
      </div>
    );
  }

  if (!geoJson) {
    return (
      <div className={cn("flex h-full items-center justify-center text-muted-foreground", className)}>
        Could not load map data.
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className="h-full w-full"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))" }}
      >
        <defs>
          <pattern id="kenya-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(249,115,22,0.12)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect
          width={VIEWBOX.width}
          height={VIEWBOX.height}
          fill="#1a0f08"
          stroke="rgba(249,115,22,0.2)"
          strokeWidth="1"
          rx="12"
        />
        <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#kenya-grid)" rx="12" />

        <g>
          {geoJson.features.map((feature) => {
            const county = feature.properties.COUNTY;
            const region = COUNTY_TO_REGION[county];
            const isSelected = selectedRegion === region;
            const isHovered = hoveredCounty === county;
            const paths = featureToPaths(feature);

            return (
              <g
                key={county}
                className="cursor-pointer transition-opacity duration-150 hover:opacity-90"
                onMouseEnter={() => setHoveredCounty(county)}
                onMouseLeave={() => setHoveredCounty(null)}
                onClick={() => region && onRegionClick?.(region)}
              >
                {paths.map((d, index) => (
                  <path
                    key={`${county}-${index}`}
                    d={d}
                    fill={getColor(region)}
                    stroke={isSelected ? "#fff7ed" : isHovered ? "#fdba74" : "#2a160b"}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 0.8}
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {hoveredData && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-border bg-card/95 p-3 text-xs shadow-lg backdrop-blur-sm">
          <p className="font-semibold">{hoveredData.region}</p>
          <p className="text-muted-foreground">County: {hoveredCounty}</p>
          <p className="text-muted-foreground">
            {METRIC_LABELS[metric]}: {formatMetric(hoveredData[metric], metric)}
          </p>
          <p className="text-muted-foreground">Forecasts: {hoveredData.count}</p>
          <p className="text-muted-foreground">Total harvest: {hoveredData.totalHarvest.toLocaleString()} t</p>
        </div>
      )}

      {!data.length && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 text-sm text-muted-foreground backdrop-blur-sm">
          No regional data to display
        </div>
      )}

      <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-card/90 p-2 text-xs shadow-lg backdrop-blur-sm">
        <p className="mb-1 font-medium">{METRIC_LABELS[metric]}</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Low</span>
          <div
            className="h-3 w-24 rounded"
            style={{
              background:
                "linear-gradient(to right, hsl(24, 85%, 25%), hsl(24, 95%, 62%))",
            }}
          />
          <span className="text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}

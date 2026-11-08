# HarvestMind

An advanced, explainable crop yield intelligence platform built for Kenyan smallholder farmers. HarvestMind combines agronomic modeling, real-time weather data, persistent analytics, and an interactive Kenya map to turn soil tests and climate observations into actionable yield forecasts.

![Dashboard](public/dashboard-preview.png)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Agronomic model](#agronomic-model)
- [Kenya-specific design](#kenya-specific-design)
- [![HarvestMind Dashboard](public/dashboard-preview.png)](https://harvestmind-five.vercel.app/dashboard)
**Live demo:** https://harvestmind-five.vercel.app
- [Development](#development)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Smallholder farmers in Kenya make planting decisions with limited forward-looking data. HarvestMind addresses this by providing a lightweight, low-bandwidth web application that predicts crop yield from:

- Soil chemistry (pH, N, P, K)
- Soil moisture
- Seasonal climate (temperature, humidity, rainfall)
- Irrigation method
- Crop type and growing season
- Farm area

Every prediction is explainable. The model returns a feature-importance breakdown and prioritized agronomic recommendations so users understand **why** a forecast was produced rather than trusting it blindly.

---

## Features

### Core prediction engine
- Multi-factor agronomic regression model calibrated for Kenyan crops and agro-ecological zones.
- Confidence intervals for every yield estimate.
- Feature-importance reports using marginal perturbation analysis.
- Fertilizer, irrigation, and management recommendations generated from input gaps.

### Data & integrations
- **Open-Meteo Historical Weather API** integration to auto-fill seasonal climate normals for Kenya.
- **PostgreSQL** persistence of all predictions, inputs, and recommendations.
- **Batch prediction** endpoint for running multiple scenarios at once.

### Analytics dashboard
- Interactive **Kenya county map** with choropleth coloring by region.
- Filterable analytics by crop, region, season, and date range.
- KPI cards, bar charts, pie chart, scatter plot, and time-series area chart.
- CSV export of underlying forecast data.

### User experience
- Low-bandwidth-first design with server-side rendering and minimal client JavaScript.
- Responsive UI optimized for desktop, tablet, and mobile.
- Accessible forms and charts.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [PostgreSQL](https://www.postgresql.org/) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Validation | [Zod](https://zod.dev/) |
| Weather | [Open-Meteo Historical Weather API](https://open-meteo.com/) |

---

## Architecture

```text
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # REST API endpoints
│   ├── dashboard/          # Analytics dashboard page
│   ├── history/            # Prediction history page
│   ├── predict/            # Yield prediction form page
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout with navigation
│   └── globals.css         # Theme CSS variables
├── components/             # React components
│   ├── maps/               # KenyaMap component
│   ├── ui/                 # Reusable UI primitives
│   ├── dashboard-charts.tsx
│   ├── history-table.tsx
│   ├── navigation.tsx
│   ├── prediction-form.tsx
│   └── prediction-result-card.tsx
├── db/                     # Database schema and client
│   ├── index.ts
│   └── schema.ts
├── lib/                    # Business logic
│   ├── agronomy/           # Crop profiles, model, recommendations
│   ├── kenya-county-regions.ts
│   ├── utils.ts
│   ├── validation.ts
│   └── weather.ts
└── public/data/            # Static Kenya GeoJSON
    └── kenya-counties.geojson
```

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or compatible package manager

### 1. Clone and install

```bash
git clone <repository-url>
cd harvestmind
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

### 3. Prepare the database

Create the database if it does not exist, then push the Drizzle schema:

```bash
npx drizzle-kit push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |

No external API keys are required. Weather data comes from the free Open-Meteo API.

---

## Database schema

The `predictions` table stores every forecast with full inputs and outputs.

```sql
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  crop VARCHAR(64) NOT NULL,
  region VARCHAR(128) NOT NULL,
  season VARCHAR(32) NOT NULL,
  area_hectares REAL NOT NULL,
  soil_ph REAL NOT NULL,
  nitrogen REAL NOT NULL,
  phosphorus REAL NOT NULL,
  potassium REAL NOT NULL,
  soil_moisture REAL NOT NULL,
  avg_temperature REAL NOT NULL,
  humidity REAL NOT NULL,
  rainfall_mm REAL NOT NULL,
  irrigation VARCHAR(32) NOT NULL,
  predicted_yield_tons_per_ha REAL NOT NULL,
  total_harvest_tons REAL NOT NULL,
  confidence_lower REAL NOT NULL,
  confidence_upper REAL NOT NULL,
  feature_importance JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  weather_source VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## API reference

All API routes are implemented under `src/app/api/`.

### `POST /api/predict`

Run a single yield prediction and persist the result.

**Request body:**

```json
{
  "crop": "maize",
  "region": "Rift Valley",
  "season": "long_rains",
  "areaHectares": 2.5,
  "soilPh": 6.2,
  "nitrogen": 80,
  "phosphorus": 35,
  "potassium": 50,
  "soilMoisture": 55,
  "avgTemperature": 22,
  "humidity": 65,
  "rainfallMm": 750,
  "irrigation": "rainfed"
}
```

**Response:** prediction result with feature importance and recommendations.

### `POST /api/batch-predict`

Run up to 50 predictions in one request.

**Request body:** `{ "entries": [predictionInput, ...] }`

### `GET /api/weather`

Fetch historical seasonal weather for a location.

**Query parameters:**

- `latitude` (number)
- `longitude` (number)
- `season` (string)
- `year` (optional number)

### `GET /api/predictions`

List saved predictions with pagination.

**Query parameters:**

- `crop` (optional)
- `limit` (default 50, max 200)
- `offset` (default 0)

### `DELETE /api/predictions/[id]`

Delete a prediction by ID.

### `GET /api/stats`

Aggregate analytics for the dashboard.

**Query parameters:**

- `crop` (optional)
- `region` (optional)
- `season` (optional)
- `startDate` (optional, YYYY-MM-DD)
- `endDate` (optional, YYYY-MM-DD)

**Response:** totals, crop breakdown, region breakdown, season breakdown, monthly trend, and recent forecasts.

---

## Agronomic model

The yield model lives in `src/lib/agronomy/model.ts`. It combines four sub-models:

1. **Soil quality index** — evaluates pH, N, P, K, and moisture against crop-specific optimal ranges.
2. **Climate index** — evaluates temperature, rainfall, and humidity, penalizing heat and drought stress.
3. **Season factor** — crop-specific weight for Long Rains, Short Rains, Off-Season, or Perennial.
4. **Irrigation factor** — adjustment based on irrigation method and rainfall adequacy.

```text
predictedYield = baseYield × soilIndex × climateIndex × seasonFactor × irrigationFactor
```

### Feature importance

For each prediction, the model perturbs one input at a time and measures the change in predicted yield. The absolute changes are normalized to percentages and sorted, producing a transparent driver breakdown.

### Recommendations

Recommendations are generated in `src/lib/agronomy/recommendations.ts` by comparing inputs against crop targets and adding Kenya-specific rules:

- pH correction advice
- N/P/K deficit or excess warnings
- Moisture and irrigation guidance
- Heat, humidity, and disease pressure alerts
- Dry-region water-harvesting suggestions
- Highland tea/coffee best practices
- Short-rains early-maturing maize advice

---

## Kenya-specific design

### Crops covered

Maize, beans, sorghum, millet, rice, wheat, Irish potato, sweet potato, cassava, tea, coffee, green grams, cowpeas, groundnuts, soybean, banana, tomato, onion, cabbage, kale.

### Kenyan seasons

- **Long Rains** (March–May)
- **Short Rains** (October–December)
- **Off-Season / Irrigated**
- **Perennial** (for tea, coffee, banana)

### Kenyan regions

Central Kenya, Rift Valley, Western, Nyanza, Eastern, Coastal, North Eastern, Nairobi Region.

### Kenya map

The dashboard renders an exact county-level map of Kenya from `public/data/kenya-counties.geojson`. Counties are grouped into the eight regions above and colored by the selected metric. Clicking a county filters the dashboard by its region.

---

## Dashboard & analytics

The dashboard provides Power-BI-like analytics:

- **Filter bar:** crop, region, season, date range
- **KPI cards:** total predictions, average yield, total harvest, period
- **Interactive Kenya county map**
- **Average yield by crop** bar chart
- **Harvest share** donut chart
- **Yield by region** horizontal bar chart
- **Yield by season** column chart
- **Rainfall vs. yield** scatter plot
- **Forecast trend over time** area + line chart
- **Recent forecasts** data table
- **CSV export**

---

## Development

### Available scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run typecheck  # Run TypeScript checks
npm run lint       # Run ESLint
```

### Adding a new crop

1. Open `src/lib/agronomy/crops.ts`.
2. Add a new entry to `CROP_PROFILES` with:
   - `name`
   - `baseYieldTonsPerHa`
   - `optimalPh`
   - `optimalNpk`
   - `optimalMoisture`, `optimalTemp`, `optimalRainfall`
   - `seasonWeights` for all four seasons
   - `waterSensitivity`, `heatSensitivity`, `maturityDays`
3. Run `npm run build` to verify.

### Adding a new region

1. Add the region to `REGION_OPTIONS` in `src/lib/agronomy/crops.ts`.
2. Update `COUNTY_TO_REGION` in `src/lib/kenya-county-regions.ts` to map counties to the new region.

---

## Deployment

### Build the application

```bash
npm run build
```

### Start the production server

```bash
npm run start
```

Ensure the `DATABASE_URL` environment variable points to a running PostgreSQL instance and the schema has been pushed with `npx drizzle-kit push`.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgements

- Weather data provided by [Open-Meteo](https://open-meteo.com/).
- Kenya county boundaries sourced from public-domain simplified GeoJSON datasets.

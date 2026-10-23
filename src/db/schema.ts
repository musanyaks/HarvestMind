import {
  pgTable,
  serial,
  varchar,
  real,
  timestamp,
  integer,
  jsonb,
  text,
} from "drizzle-orm/pg-core";

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  crop: varchar("crop", { length: 64 }).notNull(),
  region: varchar("region", { length: 128 }).notNull(),
  season: varchar("season", { length: 32 }).notNull(),
  areaHectares: real("area_hectares").notNull(),
  soilPh: real("soil_ph").notNull(),
  nitrogen: real("nitrogen").notNull(),
  phosphorus: real("phosphorus").notNull(),
  potassium: real("potassium").notNull(),
  soilMoisture: real("soil_moisture").notNull(),
  avgTemperature: real("avg_temperature").notNull(),
  humidity: real("humidity").notNull(),
  rainfallMm: real("rainfall_mm").notNull(),
  irrigation: varchar("irrigation", { length: 32 }).notNull(),
  predictedYieldTonsPerHa: real("predicted_yield_tons_per_ha").notNull(),
  totalHarvestTons: real("total_harvest_tons").notNull(),
  confidenceLower: real("confidence_lower").notNull(),
  confidenceUpper: real("confidence_upper").notNull(),
  featureImportance: jsonb("feature_importance").notNull().default("[]"),
  recommendations: jsonb("recommendations").notNull().default("[]"),
  weatherSource: varchar("weather_source", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

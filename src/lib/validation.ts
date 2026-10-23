import { z } from "zod";

export const predictionInputSchema = z.object({
  crop: z.string().min(1, "Crop is required"),
  region: z.string().min(1, "Region is required").max(128, "Region name too long"),
  season: z.string().min(1, "Season is required"),
  areaHectares: z.coerce.number().positive("Area must be greater than 0").max(10000, "Area too large"),
  soilPh: z.coerce.number().min(0, "pH cannot be below 0").max(14, "pH cannot exceed 14"),
  nitrogen: z.coerce.number().min(0, "Nitrogen cannot be negative").max(1000, "Nitrogen too high"),
  phosphorus: z.coerce.number().min(0, "Phosphorus cannot be negative").max(1000, "Phosphorus too high"),
  potassium: z.coerce.number().min(0, "Potassium cannot be negative").max(1000, "Potassium too high"),
  soilMoisture: z.coerce.number().min(0, "Moisture cannot be below 0%").max(100, "Moisture cannot exceed 100%"),
  avgTemperature: z.coerce.number().min(-10, "Temperature too low").max(55, "Temperature too high"),
  humidity: z.coerce.number().min(0, "Humidity cannot be below 0%").max(100, "Humidity cannot exceed 100%"),
  rainfallMm: z.coerce.number().min(0, "Rainfall cannot be negative").max(10000, "Rainfall too high"),
  irrigation: z.string().min(1, "Irrigation method is required"),
});

export const weatherRequestSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  season: z.string().min(1),
  year: z.coerce.number().optional(),
});

export const batchPredictionSchema = z.object({
  entries: z.array(predictionInputSchema).min(1).max(50, "Maximum 50 entries per batch"),
});

export type PredictionInputDTO = z.infer<typeof predictionInputSchema>;
export type WeatherRequestDTO = z.infer<typeof weatherRequestSchema>;
export type BatchPredictionDTO = z.infer<typeof batchPredictionSchema>;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { predictYield, PredictionInput } from "@/lib/agronomy/model";
import { generateRecommendations } from "@/lib/agronomy/recommendations";
import { batchPredictionSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = batchPredictionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const results = parseResult.data.entries.map((input) => {
      const result = predictYield(input as PredictionInput);
      const recommendations = generateRecommendations(input, result);
      return { input, result, recommendations };
    });

    await db.insert(predictions).values(
      results.map(({ input, result, recommendations }) => ({
        crop: input.crop,
        region: input.region,
        season: input.season,
        areaHectares: input.areaHectares,
        soilPh: input.soilPh,
        nitrogen: input.nitrogen,
        phosphorus: input.phosphorus,
        potassium: input.potassium,
        soilMoisture: input.soilMoisture,
        avgTemperature: input.avgTemperature,
        humidity: input.humidity,
        rainfallMm: input.rainfallMm,
        irrigation: input.irrigation,
        predictedYieldTonsPerHa: result.predictedYieldTonsPerHa,
        totalHarvestTons: result.totalHarvestTons,
        confidenceLower: result.confidenceLower,
        confidenceUpper: result.confidenceUpper,
        featureImportance: result.featureImportance,
        recommendations,
      }))
    );

    return NextResponse.json({ count: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Batch prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

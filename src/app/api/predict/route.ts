import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { predictYield, PredictionInput } from "@/lib/agronomy/model";
import { generateRecommendations } from "@/lib/agronomy/recommendations";
import { predictionInputSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = predictionInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const input = parseResult.data as PredictionInput;
    const result = predictYield(input);
    const recommendations = generateRecommendations(input, result);

    const [record] = await db
      .insert(predictions)
      .values({
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
      })
      .returning();

    return NextResponse.json({
      id: record.id,
      input,
      result,
      recommendations,
      createdAt: record.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

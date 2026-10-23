import { db } from "@/db";
import { predictions } from "@/db/schema";
import {
  and,
  eq,
  gte,
  lte,
  sql,
} from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const crop = searchParams.get("crop");
    const region = searchParams.get("region");
    const season = searchParams.get("season");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters = [];
    if (crop) filters.push(eq(predictions.crop, crop));
    if (region) filters.push(eq(predictions.region, region));
    if (season) filters.push(eq(predictions.season, season));
    if (startDate) filters.push(gte(sql`date(${predictions.createdAt})`, startDate));
    if (endDate) filters.push(lte(sql`date(${predictions.createdAt})`, endDate));
    const where = filters.length ? and(...filters) : undefined;

    const [totals] = await db
      .select({
        totalPredictions: sql<number>`count(*)::int`,
        avgYield: sql<number>`avg(${predictions.predictedYieldTonsPerHa})`,
        maxYield: sql<number>`max(${predictions.predictedYieldTonsPerHa})`,
        totalHarvest: sql<number>`sum(${predictions.totalHarvestTons})`,
        totalArea: sql<number>`sum(${predictions.areaHectares})`,
        uniqueCrops: sql<number>`count(distinct ${predictions.crop})::int`,
      })
      .from(predictions)
      .where(where);

    const cropBreakdown = await db
      .select({
        crop: predictions.crop,
        count: sql<number>`count(*)::int`,
        avgYield: sql<number>`avg(${predictions.predictedYieldTonsPerHa})`,
        totalHarvest: sql<number>`sum(${predictions.totalHarvestTons})`,
        totalArea: sql<number>`sum(${predictions.areaHectares})`,
      })
      .from(predictions)
      .where(where)
      .groupBy(predictions.crop)
      .orderBy(sql`avg(${predictions.predictedYieldTonsPerHa}) desc`);

    const regionBreakdown = await db
      .select({
        region: predictions.region,
        count: sql<number>`count(*)::int`,
        avgYield: sql<number>`avg(${predictions.predictedYieldTonsPerHa})`,
        totalHarvest: sql<number>`sum(${predictions.totalHarvestTons})`,
      })
      .from(predictions)
      .where(where)
      .groupBy(predictions.region)
      .orderBy(sql`avg(${predictions.predictedYieldTonsPerHa}) desc`);

    const seasonBreakdown = await db
      .select({
        season: predictions.season,
        count: sql<number>`count(*)::int`,
        avgYield: sql<number>`avg(${predictions.predictedYieldTonsPerHa})`,
      })
      .from(predictions)
      .where(where)
      .groupBy(predictions.season)
      .orderBy(sql`avg(${predictions.predictedYieldTonsPerHa}) desc`);

    const monthlyTrend = await db
      .select({
        month: sql<string>`to_char(${predictions.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
        avgYield: sql<number>`avg(${predictions.predictedYieldTonsPerHa})`,
        totalHarvest: sql<number>`sum(${predictions.totalHarvestTons})`,
      })
      .from(predictions)
      .where(where)
      .groupBy(sql`to_char(${predictions.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${predictions.createdAt}, 'YYYY-MM')`);

    const recent = await db
      .select({
        crop: predictions.crop,
        region: predictions.region,
        season: predictions.season,
        areaHectares: predictions.areaHectares,
        predictedYieldTonsPerHa: predictions.predictedYieldTonsPerHa,
        totalHarvestTons: predictions.totalHarvestTons,
        rainfallMm: predictions.rainfallMm,
        avgTemperature: predictions.avgTemperature,
        createdAt: predictions.createdAt,
      })
      .from(predictions)
      .where(where)
      .orderBy(sql`${predictions.createdAt} desc`)
      .limit(100);

    return NextResponse.json({
      totals: {
        totalPredictions: totals.totalPredictions,
        avgYield: Number(Number(totals.avgYield).toFixed(2)),
        maxYield: Number(Number(totals.maxYield).toFixed(2)),
        totalHarvest: Number(Number(totals.totalHarvest).toFixed(2)),
        totalArea: Number(Number(totals.totalArea).toFixed(2)),
        uniqueCrops: totals.uniqueCrops,
      },
      cropBreakdown: cropBreakdown.map((row) => ({
        crop: row.crop,
        count: row.count,
        avgYield: Number(row.avgYield.toFixed(2)),
        totalHarvest: Number(row.totalHarvest.toFixed(2)),
        totalArea: Number(row.totalArea.toFixed(2)),
      })),
      regionBreakdown: regionBreakdown.map((row) => ({
        region: row.region,
        count: row.count,
        avgYield: Number(row.avgYield.toFixed(2)),
        totalHarvest: Number(row.totalHarvest.toFixed(2)),
      })),
      seasonBreakdown: seasonBreakdown.map((row) => ({
        season: row.season,
        count: row.count,
        avgYield: Number(row.avgYield.toFixed(2)),
      })),
      monthlyTrend: monthlyTrend.map((row) => ({
        month: row.month,
        count: row.count,
        avgYield: Number(row.avgYield.toFixed(2)),
        totalHarvest: Number(row.totalHarvest.toFixed(2)),
      })),
      recent: recent.map((row) => ({
        crop: row.crop,
        region: row.region,
        season: row.season,
        areaHectares: Number(row.areaHectares),
        predictedYieldTonsPerHa: Number(row.predictedYieldTonsPerHa),
        totalHarvestTons: Number(row.totalHarvestTons),
        rainfallMm: Number(row.rainfallMm),
        avgTemperature: Number(row.avgTemperature),
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

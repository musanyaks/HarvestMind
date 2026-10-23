import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherForSeason } from "@/lib/weather";
import { weatherRequestSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseResult = weatherRequestSchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid weather request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { latitude, longitude, season, year } = parseResult.data;
    const weather = await fetchWeatherForSeason(latitude, longitude, season, year);

    return NextResponse.json(weather);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weather fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

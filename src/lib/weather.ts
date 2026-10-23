export interface WeatherSummary {
  avgTemperature: number;
  humidity: number;
  rainfallMm: number;
  source: string;
  latitude: number;
  longitude: number;
  days: number;
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_mean: (number | null)[];
  relative_humidity_2m_mean: (number | null)[];
  precipitation_sum: (number | null)[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily: OpenMeteoDaily;
}

export async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<WeatherSummary> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("daily", "temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const data: OpenMeteoResponse = await response.json();

  const temps = data.daily.temperature_2m_mean.filter((v): v is number => v !== null);
  const humidities = data.daily.relative_humidity_2m_mean.filter((v): v is number => v !== null);
  const rains = data.daily.precipitation_sum.filter((v): v is number => v !== null);

  if (temps.length === 0 || rains.length === 0) {
    throw new Error("Insufficient weather data for the requested period.");
  }

  const avgTemperature = temps.reduce((a, b) => a + b, 0) / temps.length;
  const avgHumidity = humidities.length ? humidities.reduce((a, b) => a + b, 0) / humidities.length : 60;
  const totalRainfall = rains.reduce((a, b) => a + b, 0);

  return {
    avgTemperature: Number(avgTemperature.toFixed(1)),
    humidity: Math.round(avgHumidity),
    rainfallMm: Math.round(totalRainfall),
    source: "Open-Meteo Historical Archive",
    latitude: data.latitude,
    longitude: data.longitude,
    days: rains.length,
  };
}

export async function fetchWeatherForSeason(
  latitude: number,
  longitude: number,
  season: string,
  year?: number
): Promise<WeatherSummary> {
  const targetYear = year ?? new Date().getFullYear() - 1;

  const seasonWindows: Record<string, { start: string; end: string }> = {
    long_rains: { start: `${targetYear}-03-01`, end: `${targetYear}-05-31` },
    short_rains: { start: `${targetYear}-10-01`, end: `${targetYear}-12-31` },
    off_season: { start: `${targetYear}-06-01`, end: `${targetYear}-09-30` },
    perennial: { start: `${targetYear - 1}-01-01`, end: `${targetYear}-12-31` },
  };

  const window = seasonWindows[season] ?? seasonWindows.long_rains;
  return fetchHistoricalWeather(latitude, longitude, window.start, window.end);
}

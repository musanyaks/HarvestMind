import { CROP_PROFILES } from "./crops";
import { PredictionInput, PredictionResult } from "./model";

export interface Recommendation {
  category: "soil" | "water" | "climate" | "management";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

const dryRegions = ["Eastern", "Coastal", "North Eastern"];
const highlandRegions = ["Central Kenya", "Rift Valley"];

export function generateRecommendations(
  input: PredictionInput,
  result: PredictionResult
): Recommendation[] {
  const profile = CROP_PROFILES[input.crop.toLowerCase()];
  if (!profile) return [];

  const recommendations: Recommendation[] = [];

  if (input.soilPh < profile.optimalPh.min) {
    recommendations.push({
      category: "soil",
      priority: "high",
      title: "Raise soil pH",
      description: `Soil pH (${input.soilPh}) is below the optimal range (${profile.optimalPh.min}-${profile.optimalPh.max}). Consider liming to improve nutrient availability.`,
    });
  } else if (input.soilPh > profile.optimalPh.max) {
    recommendations.push({
      category: "soil",
      priority: "high",
      title: "Lower soil pH",
      description: `Soil pH (${input.soilPh}) is above the optimal range. Elemental sulfur or organic amendments can help acidify the root zone.`,
    });
  }

  const nGap = profile.optimalNpk.n - input.nitrogen;
  const pGap = profile.optimalNpk.p - input.phosphorus;
  const kGap = profile.optimalNpk.k - input.potassium;

  if (nGap > 20) {
    recommendations.push({
      category: "soil",
      priority: nGap > 50 ? "high" : "medium",
      title: "Increase nitrogen application",
      description: `Nitrogen is ${Math.round(nGap)} kg/ha below the crop target. Split application between basal and top-dressing to reduce leaching.`,
    });
  } else if (input.nitrogen > profile.optimalNpk.n * 1.4) {
    recommendations.push({
      category: "soil",
      priority: "medium",
      title: "Reduce nitrogen risk",
      description: `Excess nitrogen can cause lodging and environmental loss. Consider a soil test before the next top-dress.`,
    });
  }

  if (pGap > 10) {
    recommendations.push({
      category: "soil",
      priority: "medium",
      title: "Address phosphorus deficit",
      description: `Phosphorus is ${Math.round(pGap)} kg/ha below target. Apply phosphate fertilizer at planting for strong root establishment.`,
    });
  }

  if (kGap > 15) {
    recommendations.push({
      category: "soil",
      priority: "medium",
      title: "Boost potassium levels",
      description: `Potassium is ${Math.round(kGap)} kg/ha below target. Potassium supports water regulation and disease resistance.`,
    });
  }

  if (input.soilMoisture < profile.optimalMoisture - 15) {
    recommendations.push({
      category: "water",
      priority: "high",
      title: "Increase soil moisture",
      description: `Soil moisture (${input.soilMoisture}%) is well below optimal. Irrigate or apply mulch to reduce evaporation.`,
    });
  } else if (input.soilMoisture > profile.optimalMoisture + 15) {
    recommendations.push({
      category: "water",
      priority: "medium",
      title: "Improve drainage",
      description: `Soil moisture (${input.soilMoisture}%) is above optimal and may cause root stress. Check drainage and reduce irrigation.`,
    });
  }

  if (input.irrigation === "rainfed" && input.rainfallMm < profile.optimalRainfall * 0.6) {
    recommendations.push({
      category: "water",
      priority: "high",
      title: "Plan supplemental irrigation",
      description: `Rainfall is only ${input.rainfallMm} mm versus the crop need of ~${profile.optimalRainfall} mm. Consider low-cost drip or pitcher irrigation.`,
    });
  }

  if (input.avgTemperature > profile.optimalTemp + 5) {
    recommendations.push({
      category: "climate",
      priority: "high",
      title: "Mitigate heat stress",
      description: `Temperature (${input.avgTemperature}°C) exceeds the crop optimum. Provide shade nets for vegetables or adjust sowing dates next season.`,
    });
  }

  if (input.humidity > 85 && input.avgTemperature > 20) {
    recommendations.push({
      category: "climate",
      priority: "medium",
      title: "Watch for fungal pressure",
      description: "High humidity and warm temperatures favor fungal diseases. Ensure canopy ventilation and scout fields regularly.",
    });
  }

  if (result.seasonFactor < 0.8) {
    recommendations.push({
      category: "management",
      priority: "medium",
      title: "Reconsider season choice",
      description: `The selected season is sub-optimal for ${profile.name}. If possible, shift to a more suitable growing window next cycle.`,
    });
  }

  if (input.areaHectares > 5 && input.irrigation === "rainfed") {
    recommendations.push({
      category: "management",
      priority: "medium",
      title: "Diversify risk across the farm",
      description: "For larger rain-fed holdings, split plantings across varieties and dates to buffer against weather shocks.",
    });
  }

  if (dryRegions.includes(input.region) && input.irrigation === "rainfed" && input.rainfallMm < profile.optimalRainfall * 0.5) {
    recommendations.push({
      category: "water",
      priority: "high",
      title: "Prioritize water harvesting",
      description: `${input.region} is a dry agro-ecological zone. Consider zai pits, mulching, and farm ponds to capture limited rainfall for ${profile.name}.`,
    });
  }

  if (highlandRegions.includes(input.region) && (input.crop === "tea" || input.crop === "coffee")) {
    recommendations.push({
      category: "management",
      priority: "medium",
      title: "Leverage highland conditions",
      description: `${input.region} offers favorable altitude and temperatures for ${profile.name}. Maintain canopy management and shade where recommended by KTDA or cooperative extension guidelines.`,
    });
  }

  if (input.season === "short_rains" && input.crop === "maize") {
    recommendations.push({
      category: "management",
      priority: "medium",
      title: "Use early-maturing maize varieties",
      description: "For Short Rains maize, choose drought-tolerant, early-maturing certified seed to escape terminal drought.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: "management",
      priority: "low",
      title: "Conditions look balanced",
      description: "Current inputs are close to optimal. Maintain regular scouting and adjust inputs based on mid-season observations.",
    });
  }

  return recommendations.slice(0, 6);
}

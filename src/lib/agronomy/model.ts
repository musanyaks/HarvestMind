import { CROP_PROFILES, CropProfile } from "./crops";

export interface PredictionInput {
  crop: string;
  region: string;
  season: string;
  areaHectares: number;
  soilPh: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  soilMoisture: number;
  avgTemperature: number;
  humidity: number;
  rainfallMm: number;
  irrigation: string;
}

export interface FeatureImportance {
  feature: string;
  contribution: number;
  direction: "positive" | "negative";
}

export interface PredictionResult {
  crop: string;
  predictedYieldTonsPerHa: number;
  totalHarvestTons: number;
  confidenceLower: number;
  confidenceUpper: number;
  featureImportance: FeatureImportance[];
  soilQualityIndex: number;
  climateIndex: number;
  seasonFactor: number;
  irrigationFactor: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function gaussianPenalty(value: number, target: number, tolerance: number): number {
  const distance = Math.abs(value - target) / tolerance;
  return Math.exp(-0.5 * distance * distance);
}

function soilQualityIndex(profile: CropProfile, input: PredictionInput): number {
  const phCenter = (profile.optimalPh.min + profile.optimalPh.max) / 2;
  const phTolerance = (profile.optimalPh.max - profile.optimalPh.min) / 2 + 0.5;
  const phScore = gaussianPenalty(input.soilPh, phCenter, phTolerance);

  const nScore = Math.min(1, input.nitrogen / profile.optimalNpk.n);
  const pScore = Math.min(1, input.phosphorus / profile.optimalNpk.p);
  const kScore = Math.min(1, input.potassium / profile.optimalNpk.k);

  const moistureScore = gaussianPenalty(
    input.soilMoisture,
    profile.optimalMoisture,
    25
  );

  const balancedNpk = (nScore + pScore + kScore) / 3;
  const excessPenalty = Math.max(0, (input.nitrogen - profile.optimalNpk.n * 1.5) / 200);

  return clamp(0.3 + phScore * 0.25 + balancedNpk * 0.35 + moistureScore * 0.25 - excessPenalty * 0.15, 0.1, 1.15);
}

function climateIndex(profile: CropProfile, input: PredictionInput): number {
  const tempScore = gaussianPenalty(input.avgTemperature, profile.optimalTemp, 8);

  const rainfallDeviation = Math.abs(input.rainfallMm - profile.optimalRainfall) / profile.optimalRainfall;
  const rainfallScore = Math.exp(-1.5 * rainfallDeviation);

  const humidityScore = gaussianPenalty(input.humidity, 65, 30);

  const heatStress = input.avgTemperature > profile.optimalTemp + 5
    ? (input.avgTemperature - (profile.optimalTemp + 5)) / 10
    : 0;

  const droughtStress = input.rainfallMm < profile.optimalRainfall * 0.5
    ? 1 - input.rainfallMm / (profile.optimalRainfall * 0.5)
    : 0;

  return clamp(
    tempScore * 0.4 + rainfallScore * 0.35 + humidityScore * 0.15 - heatStress * profile.heatSensitivity * 0.25 - droughtStress * profile.waterSensitivity * 0.25,
    0.1,
    1.1
  );
}

function seasonFactor(profile: CropProfile, season: string): number {
  return profile.seasonWeights[season] ?? 0.85;
}

function irrigationFactor(irrigation: string, rainfallMm: number, optimalRainfall: number): number {
  const rainRatio = rainfallMm / optimalRainfall;
  switch (irrigation) {
    case "drip":
      return 1.15;
    case "sprinkler":
      return 1.08;
    case "surface":
      return 1.05;
    case "rainfed":
    default:
      return clamp(0.7 + rainRatio * 0.35, 0.55, 1.0);
  }
}

function computeCoreResult(input: PredictionInput): PredictionResult {
  const profile = CROP_PROFILES[input.crop.toLowerCase()];
  if (!profile) {
    throw new Error(`Unsupported crop: ${input.crop}`);
  }

  const soil = soilQualityIndex(profile, input);
  const climate = climateIndex(profile, input);
  const season = seasonFactor(profile, input.season);
  const irrigation = irrigationFactor(input.irrigation, input.rainfallMm, profile.optimalRainfall);

  const rawYield = profile.baseYieldTonsPerHa * soil * climate * season * irrigation;

  const noiseFactor = 0.08;
  const confidenceWidth = rawYield * noiseFactor;
  const predictedYieldTonsPerHa = clamp(rawYield, profile.baseYieldTonsPerHa * 0.1, profile.baseYieldTonsPerHa * 1.35);

  const totalHarvestTons = predictedYieldTonsPerHa * input.areaHectares;
  const confidenceLower = clamp(predictedYieldTonsPerHa - confidenceWidth, 0.05, predictedYieldTonsPerHa * 0.99);
  const confidenceUpper = predictedYieldTonsPerHa + confidenceWidth;

  return {
    crop: profile.name,
    predictedYieldTonsPerHa: Number(predictedYieldTonsPerHa.toFixed(2)),
    totalHarvestTons: Number(totalHarvestTons.toFixed(2)),
    confidenceLower: Number(confidenceLower.toFixed(2)),
    confidenceUpper: Number(confidenceUpper.toFixed(2)),
    featureImportance: [],
    soilQualityIndex: Number(soil.toFixed(3)),
    climateIndex: Number(climate.toFixed(3)),
    seasonFactor: Number(season.toFixed(3)),
    irrigationFactor: Number(irrigation.toFixed(3)),
  };
}

function calculateFeatureImportance(
  profile: CropProfile,
  input: PredictionInput,
  baseResult: PredictionResult
): FeatureImportance[] {
  const contributions: FeatureImportance[] = [];

  const probes: { feature: keyof PredictionInput; delta: number; label: string }[] = [
    { feature: "soilPh", delta: 0.3, label: "Soil pH" },
    { feature: "nitrogen", delta: 20, label: "Nitrogen (N)" },
    { feature: "phosphorus", delta: 10, label: "Phosphorus (P)" },
    { feature: "potassium", delta: 15, label: "Potassium (K)" },
    { feature: "soilMoisture", delta: 10, label: "Soil moisture" },
    { feature: "avgTemperature", delta: 2, label: "Temperature" },
    { feature: "humidity", delta: 10, label: "Humidity" },
    { feature: "rainfallMm", delta: 100, label: "Rainfall" },
  ];

  for (const probe of probes) {
    const perturbed = { ...input, [probe.feature]: (input[probe.feature] as number) + probe.delta };
    const perturbedResult = computeCoreResult(perturbed);
    const change = perturbedResult.predictedYieldTonsPerHa - baseResult.predictedYieldTonsPerHa;
    contributions.push({
      feature: probe.label,
      contribution: Math.abs(change),
      direction: change >= 0 ? "positive" : "negative",
    });
  }

  const seasonProbed = { ...input, season: input.season === "long_rains" ? "short_rains" : "long_rains" };
  const seasonChange = computeCoreResult(seasonProbed).predictedYieldTonsPerHa - baseResult.predictedYieldTonsPerHa;
  contributions.push({
    feature: "Season",
    contribution: Math.abs(seasonChange),
    direction: seasonChange >= 0 ? "positive" : "negative",
  });

  const irrigationProbed = { ...input, irrigation: input.irrigation === "drip" ? "rainfed" : "drip" };
  const irrigationChange = computeCoreResult(irrigationProbed).predictedYieldTonsPerHa - baseResult.predictedYieldTonsPerHa;
  contributions.push({
    feature: "Irrigation method",
    contribution: Math.abs(irrigationChange),
    direction: irrigationChange >= 0 ? "positive" : "negative",
  });

  const total = contributions.reduce((sum, c) => sum + c.contribution, 0) || 1;
  return contributions
    .map((c) => ({ ...c, contribution: Number(((c.contribution / total) * 100).toFixed(1)) }))
    .sort((a, b) => b.contribution - a.contribution);
}

export function predictYield(input: PredictionInput): PredictionResult {
  const profile = CROP_PROFILES[input.crop.toLowerCase()];
  if (!profile) {
    throw new Error(`Unsupported crop: ${input.crop}`);
  }

  const baseResult = computeCoreResult(input);
  baseResult.featureImportance = calculateFeatureImportance(profile, input, baseResult);
  return baseResult;
}

export function validateInput(input: PredictionInput): string[] {
  const errors: string[] = [];
  if (!CROP_PROFILES[input.crop.toLowerCase()]) errors.push(`Unsupported crop: ${input.crop}`);
  if (input.areaHectares <= 0 || input.areaHectares > 10000) errors.push("Area must be between 0 and 10,000 hectares.");
  if (input.soilPh < 0 || input.soilPh > 14) errors.push("Soil pH must be between 0 and 14.");
  if (input.nitrogen < 0 || input.nitrogen > 1000) errors.push("Nitrogen must be between 0 and 1000 kg/ha.");
  if (input.phosphorus < 0 || input.phosphorus > 1000) errors.push("Phosphorus must be between 0 and 1000 kg/ha.");
  if (input.potassium < 0 || input.potassium > 1000) errors.push("Potassium must be between 0 and 1000 kg/ha.");
  if (input.soilMoisture < 0 || input.soilMoisture > 100) errors.push("Soil moisture must be between 0% and 100%.");
  if (input.avgTemperature < -10 || input.avgTemperature > 55) errors.push("Temperature must be between -10°C and 55°C.");
  if (input.humidity < 0 || input.humidity > 100) errors.push("Humidity must be between 0% and 100%.");
  if (input.rainfallMm < 0 || input.rainfallMm > 10000) errors.push("Rainfall must be between 0 and 10,000 mm.");
  return errors;
}

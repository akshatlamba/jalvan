import type { EngineeringResult, SoilType } from "./types";

export const INFILTRATION: Record<SoilType, number> = {
  sandy: 0.7,
  loam: 0.45,
  clay: 0.2,
};

export const DEFAULT_RUNOFF_COEFFICIENT = 0.8;
export const DEFAULT_LPCD = 55;

export function calculateRainwater(
  roofAreaM2: number,
  rainfallMm: number,
  runoffCoefficient = DEFAULT_RUNOFF_COEFFICIENT,
): number {
  return roofAreaM2 * rainfallMm * runoffCoefficient;
}

export function calculateWaterDemand(population: number, lpcd = DEFAULT_LPCD): number {
  return population * lpcd * 365;
}

export function calculateStorageGap(annualHarvestLitres: number, annualDemandLitres: number): number {
  return Math.max(0, annualDemandLitres - annualHarvestLitres);
}

export function calculateRecharge(harvestLitres: number, soil: SoilType = "loam"): number {
  return harvestLitres * INFILTRATION[soil];
}

export function analyzeWater(args: {
  population: number;
  roofAreaM2: number;
  rainfallMm: number;
  runoffCoefficient?: number;
  soil?: SoilType;
}): EngineeringResult {
  const runoffCoefficient = args.runoffCoefficient ?? DEFAULT_RUNOFF_COEFFICIENT;
  const annualHarvestLitres = calculateRainwater(args.roofAreaM2, args.rainfallMm, runoffCoefficient);
  const annualDemandLitres = calculateWaterDemand(args.population);
  return {
    roofAreaM2: args.roofAreaM2,
    rainfallMm: args.rainfallMm,
    runoffCoefficient,
    annualHarvestLitres,
    annualDemandLitres,
    storageGapLitres: calculateStorageGap(annualHarvestLitres, annualDemandLitres),
    rechargeLitres: calculateRecharge(annualHarvestLitres, args.soil ?? "loam"),
  };
}

export function formatLitres(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} ML`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} kL`;
  return `${Math.round(value)} L`;
}

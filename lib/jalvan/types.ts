export type Climate = "arid" | "semi-arid" | "sub-humid" | "humid" | "hill";
export type WaterPurpose = "irrigation" | "drinking" | "recharge";
export type WaterProblem = "scarcity" | "drought" | "flood" | "contamination" | "groundwater" | "cyclone";
export type WaterScale = "household" | "community";
export type SoilType = "sandy" | "loam" | "clay";
export type CrisisMode = "NORMAL" | "DROUGHT" | "FLOOD" | "CONTAMINATION" | "CYCLONE" | "GROUNDWATER STRESS";

export interface RegionProfile {
  state: string;
  climate: Climate;
  rainfallMm: number;
}

export interface WaterSystem {
  name: string;
  states: string[];
  climates: Climate[];
  purposes: WaterPurpose[];
  scales: WaterScale[];
  description: string;
  benefit: string;
}

export interface Scheme {
  name: string;
  tags: string[];
  description: string;
}

export interface UnderstandingResult {
  problems: WaterProblem[];
  purposes: WaterPurpose[];
  language: string;
  source: "rules";
}

export interface SystemMatch {
  system: WaterSystem;
  score: number;
  confidence: number;
}

export interface EngineeringResult {
  roofAreaM2: number;
  rainfallMm: number;
  runoffCoefficient: number;
  annualHarvestLitres: number;
  annualDemandLitres: number;
  storageGapLitres: number;
  rechargeLitres: number;
}

export interface CrisisAdvice {
  mode: CrisisMode;
  title: string;
  actions: string[];
}

export interface SchemeMatch {
  scheme: Scheme;
  score: number;
}

export interface JalvanInput {
  text: string;
  state?: string;
  userType?: "farmer" | "household" | "community" | "student" | "official";
  population?: number;
  roofAreaM2?: number;
  rainfallMm?: number;
  runoffCoefficient?: number;
  soil?: SoilType;
  scale?: WaterScale;
}

export interface JalvanResult {
  understanding: UnderstandingResult;
  systems: SystemMatch[];
  engineering: EngineeringResult;
  crisis: CrisisAdvice;
  schemes: SchemeMatch[];
  impact: string;
  saathi: {
    language: string;
    state: string;
    userType: string;
    problem: string;
    assessment: string;
    confidence: number;
  };
}

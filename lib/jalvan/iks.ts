import { REGIONS, WATER_SYSTEMS } from "./data";
import type { SystemMatch, WaterPurpose, WaterScale } from "./types";

export function confidence(score: number): number {
  return Math.min(99, Math.max(55, 55 + score * 3));
}

export function matchSystems(
  state: string,
  purposes: WaterPurpose[],
  scale: WaterScale,
  top = 3,
): SystemMatch[] {
  const region = REGIONS.find((r) => r.state.toLowerCase() === state.toLowerCase());
  return WATER_SYSTEMS.map((system) => {
    let score = 0;
    if (system.states.some((s) => s.toLowerCase() === state.toLowerCase())) score += 4;
    if (region && system.climates.includes(region.climate)) score += 3;
    score += purposes.filter((p) => system.purposes.includes(p)).length * 2;
    if (system.scales.includes(scale)) score += 1;
    return { system, score, confidence: confidence(score) };
  }).filter((m) => m.score > 0).sort((a, b) => b.score - a.score).slice(0, top);
}

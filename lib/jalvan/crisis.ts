import type { CrisisAdvice, CrisisMode, WaterProblem } from "./types";

const ADVICE: Record<CrisisMode, CrisisAdvice> = {
  NORMAL: { mode: "NORMAL", title: "Normal water planning", actions: ["Monitor storage and seasonal rainfall.", "Prioritize recharge and local water harvesting."] },
  DROUGHT: { mode: "DROUGHT", title: "Drought response", actions: ["Prioritize drinking water.", "Reduce non-essential demand.", "Protect groundwater and stored water."] },
  FLOOD: { mode: "FLOOD", title: "Flood response", actions: ["Protect drinking-water sources from contamination.", "Route excess runoff safely.", "Inspect tanks and drainage after flooding."] },
  CONTAMINATION: { mode: "CONTAMINATION", title: "Contamination response", actions: ["Avoid unsafe water for drinking.", "Test the source.", "Use a verified safe-water source until cleared."] },
  CYCLONE: { mode: "CYCLONE", title: "Cyclone response", actions: ["Secure water storage.", "Protect wells and tanks from debris and contamination.", "Store emergency drinking water."] },
  "GROUNDWATER STRESS": { mode: "GROUNDWATER STRESS", title: "Groundwater stress response", actions: ["Reduce extraction.", "Increase recharge where technically suitable.", "Monitor groundwater levels."] },
};

export function detectMode(problems: WaterProblem[]): CrisisMode {
  if (problems.includes("contamination")) return "CONTAMINATION";
  if (problems.includes("cyclone")) return "CYCLONE";
  if (problems.includes("flood")) return "FLOOD";
  if (problems.includes("drought")) return "DROUGHT";
  if (problems.includes("groundwater")) return "GROUNDWATER STRESS";
  return "NORMAL";
}

export function getModeAdvice(mode: CrisisMode): CrisisAdvice {
  return ADVICE[mode];
}

import type { UnderstandingResult, WaterProblem, WaterPurpose } from "./types";

const PROBLEM_KEYWORDS: Record<WaterProblem, string[]> = {
  scarcity: ["water shortage", "water scarce", "not enough water", "scarcity", "paani nahi", "pani nahi", "water problem"],
  drought: ["drought", "sukha", "sookha", "dry"],
  flood: ["flood", "flooding", "baadh", "waterlogging"],
  contamination: ["dirty water", "contaminated", "pollution", "polluted", "unsafe water", "ganda pani"],
  groundwater: ["groundwater", "borewell", "bore well", "water table", "aquifer", "bhujal"],
  cyclone: ["cyclone", "storm", "toofan", "tufan"],
};

const PURPOSE_KEYWORDS: Record<WaterPurpose, string[]> = {
  irrigation: ["irrigation", "crop", "farmer", "farm", "khet", "fasal", "farming"],
  drinking: ["drinking", "drink", "household", "peene", "pina", "paani peene"],
  recharge: ["recharge", "groundwater", "water table", "aquifer", "bhujal"],
};

function detectLanguage(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "Tamil";
  if (/[\u0C00-\u0C7F]/.test(text)) return "Telugu";
  return "English";
}

export function understand(text: string): UnderstandingResult {
  const normalized = text.toLowerCase();
  const problems = (Object.keys(PROBLEM_KEYWORDS) as WaterProblem[]).filter((problem) =>
    PROBLEM_KEYWORDS[problem].some((keyword) => normalized.includes(keyword)),
  );
  const purposes = (Object.keys(PURPOSE_KEYWORDS) as WaterPurpose[]).filter((purpose) =>
    PURPOSE_KEYWORDS[purpose].some((keyword) => normalized.includes(keyword)),
  );

  return {
    problems: problems.length ? problems : ["scarcity"],
    purposes: purposes.length ? purposes : ["drinking"],
    language: detectLanguage(text),
    source: "rules",
  };
}

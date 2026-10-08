import { REGIONS } from "./data";
import { getModeAdvice, detectMode } from "./crisis";
import { analyzeWater, formatLitres } from "./engineering";
import { matchSystems } from "./iks";
import { matchSchemes } from "./schemes";
import { understand } from "./understanding";
import type { JalvanInput, JalvanResult, WaterPurpose } from "./types";

export function buildSaathiRequest(input: JalvanInput, result: JalvanResult) {
  return {
    language: result.understanding.language,
    state: input.state ?? "Rajasthan",
    userType: input.userType ?? "farmer",
    problem: result.understanding.problems.join(", "),
    assessment: result.impact,
    confidence: result.systems[0]?.confidence ?? 55,
  };
}

export function runJalvan(input: JalvanInput): JalvanResult {
  const state = input.state ?? "Rajasthan";
  const userType = input.userType ?? "farmer";

  const region =
    REGIONS.find(
      (r) => r.state.toLowerCase() === state.toLowerCase(),
    ) ?? REGIONS[0];

  const understanding = understand(input.text);

  const purposes: WaterPurpose[] =
    understanding.purposes.length > 0
      ? understanding.purposes
      : userType === "farmer"
        ? ["irrigation"]
        : ["drinking"];

  const scale =
    input.scale ??
    (userType === "household" ? "household" : "community");

  const systems = matchSystems(state, purposes, scale);

  const engineering = analyzeWater({
    population: input.population ?? 5,
    roofAreaM2: input.roofAreaM2 ?? 100,
    rainfallMm: input.rainfallMm ?? region.rainfallMm,
    runoffCoefficient: input.runoffCoefficient,
    soil: input.soil ?? "loam",
  });

  const crisis = getModeAdvice(
    detectMode(understanding.problems),
  );

  const tags = [
    ...purposes,
    ...understanding.problems,
    "community",
    "recharge",
  ];

  const schemes = matchSchemes(state, tags);

  const topSystem = systems[0];

  const impact = topSystem
    ? `${topSystem.system.name} is a strong local match. Estimated roof runoff is ${formatLitres(
        engineering.annualHarvestLitres,
      )} per year, with about ${formatLitres(
        engineering.rechargeLitres,
      )} potentially supporting recharge under the selected soil assumption.`
    : `Estimated roof runoff is ${formatLitres(
        engineering.annualHarvestLitres,
      )} per year.`;

  const result: JalvanResult = {
    understanding,
    systems,
    engineering,
    crisis,
    schemes,
    impact,
    saathi: {
      language: understanding.language,
      state,
      userType,
      problem: understanding.problems.join(", "),
      assessment: impact,
      confidence: topSystem?.confidence ?? 55,
    },
  };

  return result;
}
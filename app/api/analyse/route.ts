import { NextResponse } from "next/server";
import { runJalvan } from "@/lib/jalvan";

type GeminiClassification = {
  problems?: string[];
  purposes?: string[];
  confidence?: number;
  reasons?: string[];
};

const ALLOWED_PROBLEMS = [
  "scarcity",
  "drought",
  "flood",
  "contamination",
  "groundwater",
  "cyclone",
] as const;

const ALLOWED_PURPOSES = [
  "irrigation",
  "drinking",
  "recharge",
] as const;

function extractJson(text: string): GeminiClassification {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Gemini returned an invalid classification.");
  }

  return JSON.parse(match[0]) as GeminiClassification;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing on the server." },
        { status: 500 },
      );
    }

    const body = await request.json();

    const text =
      typeof body?.text === "string" ? body.text.trim() : "";

    const state =
      typeof body?.state === "string" && body.state.trim()
        ? body.state.trim()
        : "Rajasthan";

    const population =
      Number.isFinite(Number(body?.population))
        ? Number(body.population)
        : 1200;

    const roofAreaM2 =
      Number.isFinite(Number(body?.roofAreaM2))
        ? Number(body.roofAreaM2)
        : 100;

    const rainfallMm =
      Number.isFinite(Number(body?.rainfallMm))
        ? Number(body.rainfallMm)
        : 700;

    if (!text) {
      return NextResponse.json(
        { error: "No situation text was provided." },
        { status: 400 },
      );
    }

    const prompt = `
You are the situation-understanding layer of JALVĀN, an indigenous water intelligence system.

Your job is ONLY to classify the user's water situation. Do not invent a solution.
The downstream JALVĀN knowledge engine will choose indigenous systems, engineering interventions and government pathways.

Return JSON only with this exact shape:
{
  "problems": ["..."],
  "purposes": ["..."],
  "confidence": 0,
  "reasons": ["...", "...", "..."]
}

Allowed problems:
${ALLOWED_PROBLEMS.join(", ")}

Allowed purposes:
${ALLOWED_PURPOSES.join(", ")}

Rules:
- Select every clearly supported problem, ordered by importance.
- Select every clearly supported purpose, ordered by importance.
- If wells, borewells, groundwater level or drying wells are mentioned, include "groundwater" when supported.
- If lack of rain, prolonged dry conditions or crop/water stress from failed rainfall is mentioned, include "drought".
- If the user asks about drinking water, include "drinking".
- If farming/crops/irrigation are mentioned, include "irrigation".
- If groundwater recharge/water table improvement is explicitly intended, include "recharge".
- confidence is an integer from 0 to 100.
- reasons must contain 2 to 4 short evidence-based reasons grounded in the user's words.
- Never use labels outside the allowed lists.

User situation:
${text}
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const message =
        geminiData?.error?.message ||
        "Gemini situation understanding failed.";

      return NextResponse.json(
        { error: message },
        { status: 502 },
      );
    }

    const raw =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof raw !== "string" || !raw.trim()) {
      return NextResponse.json(
        { error: "Gemini returned no situation classification." },
        { status: 502 },
      );
    }

    const ai = extractJson(raw);

    const problems = Array.isArray(ai.problems)
      ? ai.problems.filter((x): x is (typeof ALLOWED_PROBLEMS)[number] =>
          (ALLOWED_PROBLEMS as readonly string[]).includes(x),
        )
      : [];

    const purposes = Array.isArray(ai.purposes)
      ? ai.purposes.filter((x): x is (typeof ALLOWED_PURPOSES)[number] =>
          (ALLOWED_PURPOSES as readonly string[]).includes(x),
        )
      : [];

    // Feed Gemini's structured understanding into the curated JALVĀN engine.
    // This keeps the knowledge/recommendation layer deterministic while
    // allowing Gemini to understand natural language beyond simple keywords.
    const enrichedText = [
      text,
      problems.length ? `JALVĀN_AI_PROBLEMS: ${problems.join(" ")}` : "",
      purposes.length ? `JALVĀN_AI_PURPOSES: ${purposes.join(" ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const core = runJalvan({
      text: enrichedText,
      state,
      userType: "community",
      population,
      roofAreaM2,
      rainfallMm,
      scale: "community",
    });

    // Prefer Gemini's classification for the displayed primary problem,
    // while all interventions remain selected by the curated JALVĀN engine.
    const primaryProblem = problems[0] ?? core.understanding.problems[0] ?? "scarcity";
    const topSystem = core.systems[0];
    const topScheme = core.schemes[0];

    const categoryMap: Record<string, string> = {
      scarcity: "Water Security",
      drought: "Drought Resilience",
      flood: "Water Resilience",
      contamination: "Water Quality",
      groundwater: "Groundwater",
      cyclone: "Climate Resilience",
    };

    const problemMap: Record<string, string> = {
      scarcity: "Water Scarcity",
      drought: "Drought Stress",
      flood: "Flooding & Waterlogging",
      contamination: "Unsafe or Contaminated Water",
      groundwater: "Groundwater Stress",
      cyclone: "Cyclone Water Risk",
    };

    const intent = purposes.length
      ? `${purposes.join(" + ")} water need`
      : core.understanding.purposes.length
        ? `${core.understanding.purposes.join(" + ")} water need`
        : "Community water problem";

    const engineering = core.engineering;

    const engineeringText =
      `${engineering.annualHarvestLitres.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })} L/year harvest · ` +
      `${engineering.rechargeLitres.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })} L recharge potential`;

    const confidence =
      Number.isFinite(Number(ai.confidence))
        ? Math.max(0, Math.min(100, Math.round(Number(ai.confidence))))
        : topSystem?.confidence ?? 55;

    return NextResponse.json({
      analysis: {
        category: categoryMap[primaryProblem] ?? "Water Security",
        problem: problemMap[primaryProblem] ?? "Water Security Problem",
        confidence,
        intent,
        iks: topSystem
          ? `${topSystem.system.name} — ${topSystem.system.benefit}`
          : "Community water harvesting",
        engineering: engineeringText,
        yojana: topScheme?.scheme.name ?? "Local water programme",
      },
      understanding: {
        problems,
        purposes,
        confidence,
        reasons: Array.isArray(ai.reasons) ? ai.reasons.slice(0, 4) : [],
      },
      
      
    });
  } catch (error) {
    console.error("JALVĀN analysis error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected JALVĀN Core analysis error.",
      },
      { status: 500 },
    );
  }
}

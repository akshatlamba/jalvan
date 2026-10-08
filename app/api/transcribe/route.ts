import { NextResponse } from "next/server";
import { runJalvan } from "@/lib/jalvan";

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

type Problem = (typeof ALLOWED_PROBLEMS)[number];
type Purpose = (typeof ALLOWED_PURPOSES)[number];

type GeminiClassification = {
  problems?: string[];
  purposes?: string[];
  confidence?: number;
  reasons?: string[];
};

/* -------------------------------------------------------
   LOCAL JALVĀN UNDERSTANDING
   This is deliberately fast and does not depend on Gemini.
------------------------------------------------------- */

function localUnderstand(text: string): GeminiClassification {
  const normalized = text.toLowerCase();

  const problems: Problem[] = [];
  const purposes: Purpose[] = [];
  const reasons: string[] = [];

  const hasAny = (words: string[]) =>
    words.some((word) => normalized.includes(word));

  // Groundwater
  if (
    hasAny([
      "well",
      "wells",
      "borewell",
      "bore well",
      "borewells",
      "groundwater",
      "water table",
      "aquifer",
      "handpump",
      "hand pump",
    ])
  ) {
    problems.push("groundwater");
    reasons.push("The user mentions wells, groundwater or groundwater access.");
  }

  // Drought / prolonged dry conditions
  if (
    hasAny([
      "drought",
      "no rain",
      "no rainfall",
      "less rain",
      "low rainfall",
      "failed rain",
      "failed monsoon",
      "dry season",
      "dry summer",
      "summer",
      "dry",
      "rainfall has stopped",
      "rain has stopped",
    ])
  ) {
    problems.push("drought");
    reasons.push("The situation indicates prolonged dryness or insufficient rainfall.");
  }

  // General scarcity
  if (
    hasAny([
      "water shortage",
      "water scarcity",
      "no water",
      "not enough water",
      "water problem",
      "water crisis",
      "shortage",
      "scarcity",
      "water is low",
      "water level is low",
    ])
  ) {
    problems.push("scarcity");
    reasons.push("The user describes insufficient water availability.");
  }

  // Flood
  if (
    hasAny([
      "flood",
      "flooding",
      "waterlogging",
      "heavy rain",
      "overflow",
      "river overflow",
      "flash flood",
      "inundation",
    ])
  ) {
    problems.push("flood");
    reasons.push("The situation indicates flooding, overflow or waterlogging.");
  }

  // Contamination
  if (
    hasAny([
      "contaminated",
      "contamination",
      "dirty water",
      "unsafe water",
      "polluted",
      "pollution",
      "bad water",
      "salty water",
      "smell in water",
      "smelly water",
      "yellow water",
      "brown water",
      "arsenic",
      "fluoride",
      "sewage",
    ])
  ) {
    problems.push("contamination");
    reasons.push("The user indicates a water-quality or contamination concern.");
  }

  // Cyclone
  if (
    hasAny([
      "cyclone",
      "cyclonic",
      "storm surge",
      "coastal storm",
      "cyclone warning",
    ])
  ) {
    problems.push("cyclone");
    reasons.push("The situation indicates cyclone-related water risk.");
  }

  // Irrigation
  if (
    hasAny([
      "farm",
      "farmer",
      "farming",
      "crop",
      "crops",
      "field",
      "fields",
      "irrigation",
      "wheat",
      "rice",
      "paddy",
      "millet",
      "vegetable",
      "vegetables",
      "harvest",
      "khet",
      "fasal",
      "sinchai",
    ])
  ) {
    purposes.push("irrigation");
    reasons.push("The user connects the water need with farming or crops.");
  }

  // Drinking
  if (
    hasAny([
      "drink",
      "drinking",
      "drinking water",
      "drinking-water",
      "potable",
      "household water",
      "family water",
      "people need water",
      "village needs water",
      "peene",
      "paani peene",
    ])
  ) {
    purposes.push("drinking");
    reasons.push("The user indicates a drinking or household water need.");
  }

  // Recharge
  if (
    hasAny([
      "recharge",
      "groundwater recharge",
      "recharge groundwater",
      "raise water table",
      "increase water table",
      "water table",
      "aquifer recharge",
      "replenish groundwater",
    ])
  ) {
    purposes.push("recharge");
    reasons.push("The user indicates a groundwater-recharge objective.");
  }

  // If wells are drying, groundwater recharge is a sensible
  // secondary intent even when the user did not explicitly say
  // the word "recharge".
  if (
    problems.includes("groundwater") &&
    problems.includes("drought") &&
    !purposes.includes("recharge")
  ) {
    purposes.push("recharge");
  }

  // Fallbacks
  if (problems.length === 0) {
    problems.push("scarcity");
    reasons.push("The situation is being treated as a general water-security concern.");
  }

  if (purposes.length === 0) {
    purposes.push("drinking");
  }

  // Keep the most relevant problem ordering.
  const priority: Problem[] = [
    "contamination",
    "cyclone",
    "flood",
    "drought",
    "groundwater",
    "scarcity",
  ];

  problems.sort(
    (a, b) => priority.indexOf(a) - priority.indexOf(b),
  );

  const confidence =
    reasons.length >= 3
      ? 88
      : reasons.length === 2
        ? 82
        : reasons.length === 1
          ? 70
          : 55;

  return {
    problems,
    purposes,
    confidence,
    reasons: reasons.slice(0, 4),
  };
}

/* -------------------------------------------------------
   GEMINI JSON EXTRACTION
------------------------------------------------------- */

function extractJson(text: string): GeminiClassification | null {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    return JSON.parse(match[0]) as GeminiClassification;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------
   GEMINI FILE UPLOAD
------------------------------------------------------- */

async function uploadGeminiFile(
  apiKey: string,
  audioBytes: ArrayBuffer,
  mimeType: string,
) {
  const startResponse = await fetch(
    "https://generativelanguage.googleapis.com/upload/v1beta/files",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(
          audioBytes.byteLength,
        ),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: {
          display_name: `jalvan-${Date.now()}`,
        },
      }),
    },
  );

  if (!startResponse.ok) {
    const errorText = await startResponse.text();

    throw new Error(
      `Gemini file upload initialization failed: ${errorText}`,
    );
  }

  const uploadUrl =
    startResponse.headers.get("X-Goog-Upload-URL") ||
    startResponse.headers.get("x-goog-upload-url");

  if (!uploadUrl) {
    throw new Error("Gemini did not return an upload URL.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(audioBytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": mimeType,
    },
    body: audioBytes,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    throw new Error(
      `Gemini audio upload failed: ${errorText}`,
    );
  }

  return uploadResponse.json();
}

/* -------------------------------------------------------
   GEMINI TRANSCRIPTION
   This remains the reliable AI transcription layer.
------------------------------------------------------- */

async function transcribeWithGemini(
  apiKey: string,
  audioBytes: ArrayBuffer,
  mimeType: string,
  language: string,
) {
  const uploaded = await uploadGeminiFile(
    apiKey,
    audioBytes,
    mimeType,
  );

  const fileUri =
    uploaded?.file?.uri ||
    uploaded?.file?.name;

  if (!fileUri) {
    throw new Error(
      "Gemini file upload returned no file URI.",
    );
  }

  const languageCodes =
    language && language !== "auto"
      ? [language]
      : [];

  const interactionResponse = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.5-transcribe",
        input: [
          {
            type: "audio",
            uri: fileUri,
            mime_type: mimeType,
          },
        ],
        generation_config: {
          transcription_config: {
            language_codes: languageCodes,
            custom_vocabulary: [
              "JALVĀN",
              "Johad",
              "Tanka",
              "Kund",
              "Khadin",
              "Baoli",
              "Eri",
              "Ahar-Pyne",
              "Zabo",
              "Atal Bhujal Yojana",
              "Jal Jeevan Mission",
              "PMKSY",
            ],
            mode: "smart",
          },
        },
      }),
    },
  );

  const transcriptionData =
    await interactionResponse.json();

  if (!interactionResponse.ok) {
    throw new Error(
      transcriptionData?.error?.message ||
        "Gemini transcription failed.",
    );
  }

  let transcript =
    transcriptionData?.output_text || "";

  if (!transcript.trim()) {
    const steps = transcriptionData?.steps;

    if (Array.isArray(steps)) {
      const extractedText = steps
        .flatMap((step: any) =>
          Array.isArray(step?.content)
            ? step.content
            : [],
        )
        .filter(
          (content: any) =>
            content?.type === "text" &&
            typeof content?.text === "string",
        )
        .map((content: any) => content.text)
        .join(" ")
        .trim();

      if (extractedText) {
        transcript = extractedText;
      }
    }
  }

  if (!transcript.trim()) {
    throw new Error(
      "Gemini received the recording but returned an empty transcript. Please try speaking for 2–3 seconds.",
    );
  }

  return transcript.trim();
}

/* -------------------------------------------------------
   OPTIONAL GEMINI SITUATION ENHANCEMENT

   IMPORTANT:
   This function is NOT required for JALVĀN to work.

   If Gemini 3.8 is overloaded, times out or returns an
   error, local JALVĀN understanding remains the source
   of truth.
------------------------------------------------------- */

async function enhanceWithGemini(
  apiKey: string,
  text: string,
): Promise<GeminiClassification | null> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 1500);

  try {
    const prompt = `
You are an optional classification enhancer for JALVĀN.

Classify ONLY the user's water situation.

Return JSON only:
{
  "problems": [],
  "purposes": [],
  "confidence": 0,
  "reasons": []
}

Allowed problems:
scarcity, drought, flood, contamination, groundwater, cyclone

Allowed purposes:
irrigation, drinking, recharge

Rules:
- Use only labels from the allowed lists.
- Include groundwater when wells, borewells or groundwater are involved.
- Include drought when lack of rain or prolonged dryness is involved.
- Include irrigation when farming or crops are involved.
- Include drinking when drinking or household water is involved.
- Include recharge when groundwater recharge is clearly relevant.
- confidence must be 0-100.
- reasons must be short and grounded in the user's words.

User:
${text}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: prompt,
          generation_config: {
            thinking_level: "low",
          },
        }),
      },
    );

    if (!response.ok) {
      // 503/high demand is deliberately non-fatal.
      return null;
    }

    const data = await response.json();

    const raw =
      data?.output_text ||
      data?.steps
        ?.flatMap((step: any) =>
          Array.isArray(step?.content)
            ? step.content
            : [],
        )
        ?.filter(
          (content: any) =>
            content?.type === "text" &&
            typeof content?.text === "string",
        )
        ?.map((content: any) => content.text)
        ?.join(" ")
        ?.trim();

    if (!raw) {
      return null;
    }

    return extractJson(raw);
  } catch {
    // Timeout, 503, network failure, etc.
    // JALVĀN continues using local intelligence.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------------------------------------
   VALIDATION
------------------------------------------------------- */

function sanitizeClassification(
  ai: GeminiClassification,
  fallback: GeminiClassification,
): GeminiClassification {
  const problems = Array.isArray(ai?.problems)
    ? ai.problems.filter((value): value is Problem =>
        (ALLOWED_PROBLEMS as readonly string[]).includes(
          value,
        ),
      )
    : [];

  const purposes = Array.isArray(ai?.purposes)
    ? ai.purposes.filter((value): value is Purpose =>
        (ALLOWED_PURPOSES as readonly string[]).includes(
          value,
        ),
      )
    : [];

  const finalProblems =
    problems.length > 0
      ? problems
      : fallback.problems || ["scarcity"];

  const finalPurposes =
    purposes.length > 0
      ? purposes
      : fallback.purposes || ["drinking"];

  const rawConfidence = Number(ai?.confidence);

  const confidence = Number.isFinite(rawConfidence)
    ? Math.max(
        0,
        Math.min(100, Math.round(rawConfidence)),
      )
    : fallback.confidence ?? 70;

  const reasons =
    Array.isArray(ai?.reasons) &&
    ai.reasons.length > 0
      ? ai.reasons
          .filter(
            (reason): reason is string =>
              typeof reason === "string",
          )
          .slice(0, 4)
      : fallback.reasons || [];

  return {
    problems: finalProblems,
    purposes: finalPurposes,
    confidence,
    reasons,
  };
}

/* -------------------------------------------------------
   MAIN API
------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing on the server.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();

    const uploadedFile =
      (formData.get("file") ||
        formData.get("audio")) as File | null;

    const language =
      typeof formData.get("language") === "string"
        ? String(formData.get("language"))
        : "auto";

    const state =
      typeof formData.get("state") === "string" &&
      String(formData.get("state")).trim()
        ? String(formData.get("state")).trim()
        : "Rajasthan";

    const populationValue = Number(
      formData.get("population"),
    );

    const roofAreaValue = Number(
      formData.get("roofAreaM2"),
    );

    const rainfallValue = Number(
      formData.get("rainfallMm"),
    );

    const population =
      Number.isFinite(populationValue) &&
      populationValue > 0
        ? populationValue
        : 1200;

    const roofAreaM2 =
      Number.isFinite(roofAreaValue) &&
      roofAreaValue > 0
        ? roofAreaValue
        : 100;

    const rainfallMm =
      Number.isFinite(rainfallValue) &&
      rainfallValue > 0
        ? rainfallValue
        : 700;

    if (!uploadedFile) {
      return NextResponse.json(
        {
          error:
            "No audio file was provided.",
        },
        { status: 400 },
      );
    }

    if (uploadedFile.size === 0) {
      return NextResponse.json(
        {
          error:
            "The recording was empty. Please try again.",
        },
        { status: 422 },
      );
    }

    const rawMimeType =
      uploadedFile.type || "audio/webm";

    const finalMimeType =
      rawMimeType.includes("webm")
        ? "audio/webm"
        : rawMimeType.includes("mp4")
          ? "audio/mp4"
          : rawMimeType;

    const audioBytes =
      await uploadedFile.arrayBuffer();

    /* ---------------------------------------------------
       STEP 1 — TRANSCRIBE
    --------------------------------------------------- */

    const transcript =
      await transcribeWithGemini(
        apiKey,
        audioBytes,
        finalMimeType,
        language,
      );

    console.log(
      "JALVĀN FINAL TRANSCRIPT:",
      transcript,
    );

    /* ---------------------------------------------------
       STEP 2 — LOCAL UNDERSTANDING
       This happens immediately and cannot be blocked
       by Gemini 3.8 capacity.
    --------------------------------------------------- */

    const localAI =
      localUnderstand(transcript);

    console.log(
      "JALVĀN LOCAL UNDERSTANDING:",
      localAI,
    );

    /* ---------------------------------------------------
       STEP 3 — OPTIONAL GEMINI ENHANCEMENT

       We do NOT wait indefinitely.

       If Gemini 3.8 is available very quickly,
       we use it.

       If it is overloaded:
       local understanding wins.
    --------------------------------------------------- */

    let finalAI = localAI;
    let aiEnhancement = "local";

    const geminiAI =
      await enhanceWithGemini(
        apiKey,
        transcript,
      );

    if (geminiAI) {
      finalAI = sanitizeClassification(
        geminiAI,
        localAI,
      );

      aiEnhancement = "gemini-3.8-flash";
    }

    console.log(
      "JALVĀN UNDERSTANDING SOURCE:",
      aiEnhancement,
    );

    /* ---------------------------------------------------
       STEP 4 — ENRICH TEXT FOR JALVĀN CORE
    --------------------------------------------------- */

    const problems =
      Array.isArray(finalAI.problems)
        ? finalAI.problems
        : [];

    const purposes =
      Array.isArray(finalAI.purposes)
        ? finalAI.purposes
        : [];

    const enrichedText = [
      transcript,

      problems.length
        ? `JALVĀN_AI_PROBLEMS: ${problems.join(" ")}`
        : "",

      purposes.length
        ? `JALVĀN_AI_PURPOSES: ${purposes.join(" ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    /* ---------------------------------------------------
       STEP 5 — JALVĀN CORE
    --------------------------------------------------- */

    const core = runJalvan({
      text: enrichedText,
      state,
      userType: "community",
      population,
      roofAreaM2,
      rainfallMm,
      scale: "community",
    });

    /* ---------------------------------------------------
       STEP 6 — PREMIUM RESPONSE MODEL
    --------------------------------------------------- */

    const primaryProblem =
      problems[0] ??
      core.understanding.problems[0] ??
      "scarcity";

    const topSystem = core.systems?.[0];
    const topScheme = core.schemes?.[0];

    const categoryMap: Record<
      string,
      string
    > = {
      scarcity: "Water Security",
      drought: "Drought Resilience",
      flood: "Water Resilience",
      contamination: "Water Quality",
      groundwater: "Groundwater",
      cyclone: "Climate Resilience",
    };

    const problemMap: Record<
      string,
      string
    > = {
      scarcity: "Water Scarcity",
      drought: "Drought Stress",
      flood: "Flooding & Waterlogging",
      contamination:
        "Unsafe or Contaminated Water",
      groundwater: "Groundwater Stress",
      cyclone: "Cyclone Water Risk",
    };

    const intent =
      purposes.length
        ? `${purposes.join(" + ")} water need`
        : core.understanding.purposes.length
          ? `${core.understanding.purposes.join(
              " + ",
            )} water need`
          : "Community water problem";

    const engineering =
      core.engineering;

    const annualHarvest =
      Number(
        engineering.annualHarvestLitres,
      );

    const rechargeLitres =
      Number(
        engineering.rechargeLitres,
      );

    const engineeringText =
      `${Number.isFinite(annualHarvest) ? annualHarvest.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      }) : "—"} L/year harvest · ` +
      `${Number.isFinite(rechargeLitres) ? rechargeLitres.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      }) : "—"} L recharge potential`;

    const confidence =
      Number.isFinite(
        Number(finalAI.confidence),
      )
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(
                Number(finalAI.confidence),
              ),
            ),
          )
        : topSystem?.confidence ?? 70;

    /* ---------------------------------------------------
       FINAL RESPONSE
    --------------------------------------------------- */

    return NextResponse.json({
      text: transcript,

      analysis: {
        category:
          categoryMap[primaryProblem] ??
          "Water Security",

        problem:
          problemMap[primaryProblem] ??
          "Water Security Problem",

        confidence,

        intent,

        iks: topSystem
          ? `${topSystem.system.name} — ${topSystem.system.benefit}`
          : "Community water harvesting",

        engineering:
          engineeringText,

        yojana:
          topScheme?.scheme.name ??
          "Local water programme",
      },

      understanding: {
        problems,
        purposes,
        confidence,
        reasons:
          Array.isArray(finalAI.reasons)
            ? finalAI.reasons.slice(0, 4)
            : [],

        source: aiEnhancement,
      },

      // Useful for the premium frontend/debugging.
      // The UI does not have to display this.
      system: {
        transcription: "gemini-3.5-transcribe",
        understanding:
          aiEnhancement,
        fallback:
          aiEnhancement === "local",
      },
    });
  } catch (error) {
    console.error(
      "JALVĀN transcription/analysis route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while processing the recording.",
      },
      { status: 500 },
    );
  }
}
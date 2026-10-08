"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type WaterMapProps = {
  selectedState: string;
  onStateSelect: (state: string) => void;
};

const WaterMap = dynamic(
  () => import("./components/WaterMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[620px] items-center justify-center rounded-[32px] border border-white/10 bg-[#081513]">
        <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/50">
          Loading JALVĀN map...
        </div>
      </div>
    ),
  }
) as unknown as ComponentType<WaterMapProps>;

type Stage =
  | "idle"
  | "listening"
  | "transcribing"
  | "result"
  | "error";

type LanguageCode =
  | "auto"
  | "hi"
  | "en"
  | "ta"
  | "te"
  | "mr";

type Analysis = {
  category: string;
  problem: string;
  confidence: number;
  intent: string;
  iks: string;
  engineering: string;
  yojana: string;
};

type Understanding = {
  problems: string[];
  purposes: string[];
  confidence: number;
  reasons: string[];
  source?: string;
};

const languages: {
  code: LanguageCode;
  label: string;
}[] = [
  { code: "auto", label: "Auto" },
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
];

type DemoScenario = {
  id: "drought" | "flood" | "contamination";
  state: string;
  label: string;
  title: string;
  transcript: string;
  analysis: Analysis;
  understanding: Understanding;
};

const demoScenarios: DemoScenario[] = [
  {
    id: "drought",
    state: "Rajasthan",
    label: "Drought",
    title: "Dry wells · summer stress",
    transcript: "Our wells have dried up. There has been very little rain this summer and our crops are suffering.",
    analysis: {
      category: "Drought Resilience",
      problem: "Drought Stress",
      confidence: 94,
      intent: "irrigation + recharge water need",
      iks: "Kund — Captures scarce rainfall and improves local water security.",
      engineering: "56,000 L/year harvest · 25,200 L recharge potential",
      yojana: "Atal Bhujal Yojana",
    },
    understanding: {
      problems: ["drought", "groundwater"],
      purposes: ["irrigation", "recharge"],
      confidence: 94,
      reasons: [
        "Wells are reported dry, indicating groundwater stress.",
        "Very little summer rainfall indicates prolonged dryness.",
        "Crop impact points to an irrigation need.",
      ],
      source: "demo scenario",
    },
  },
  {
    id: "flood",
    state: "Assam",
    label: "Flood",
    title: "Overflow · rapid response",
    transcript: "Heavy rain has flooded our homes and the river is overflowing. We need a safe way to move people and protect our water supply.",
    analysis: {
      category: "Water Resilience",
      problem: "Flooding & Waterlogging",
      confidence: 96,
      intent: "drinking water need",
      iks: "Ahar-Pyne — Traditional water management that works with seasonal flows.",
      engineering: "Overflow mapping · safe drainage · post-event recharge assessment",
      yojana: "Jal Jeevan Mission",
    },
    understanding: {
      problems: ["flood"],
      purposes: ["drinking", "recharge"],
      confidence: 96,
      reasons: [
        "Homes are reported flooded, making immediate safety the priority.",
        "River overflow indicates a high-flow event.",
        "The drinking-water pathway needs protection during the event.",
      ],
      source: "demo scenario",
    },
  },
  {
    id: "contamination",
    state: "Uttar Pradesh",
    label: "Contamination",
    title: "Unsafe source · protect supply",
    transcript: "The handpump water has changed colour and smells bad. Families are worried about using it for drinking.",
    analysis: {
      category: "Water Quality",
      problem: "Unsafe or Contaminated Water",
      confidence: 95,
      intent: "drinking water need",
      iks: "Village pond and source-protection practices — protect clean water pathways and community access.",
      engineering: "Source isolation · water-quality testing · alternate safe supply",
      yojana: "Jal Jeevan Mission",
    },
    understanding: {
      problems: ["contamination"],
      purposes: ["drinking"],
      confidence: 95,
      reasons: [
        "Colour and odour changes indicate a possible water-quality issue.",
        "The source is being used for drinking, increasing the urgency.",
        "Local testing is required before declaring the source safe.",
      ],
      source: "demo scenario",
    },
  },
];

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [language, setLanguage] =
    useState<LanguageCode>("auto");

  const [transcript, setTranscript] =
    useState("");

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [understanding, setUnderstanding] =
    useState<Understanding | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [selectedMapState, setSelectedMapState] =
    useState("Rajasthan");

  const [population, setPopulation] =
    useState(1200);

  const [households, setHouseholds] =
    useState(240);

  const [roofArea, setRoofArea] =
    useState(100);

  const [rainfall, setRainfall] =
    useState(700);

  const [activeSolution, setActiveSolution] =
    useState<"iks" | "engineering" | "yojana">("iks");

  const [saathiOpen, setSaathiOpen] =
    useState(false);

  const [saathiPrepared, setSaathiPrepared] =
    useState(false);

  const [demoScenario, setDemoScenario] =
    useState<DemoScenario | null>(null);

  const [judgeMode, setJudgeMode] = useState(false);
  const [judgeStep, setJudgeStep] = useState(0);

  const recorderRef =
    useRef<MediaRecorder | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const chunksRef =
    useRef<Blob[]>([]);

  const supportedMimeType = useMemo(() => {
    if (typeof MediaRecorder === "undefined") {
      return "";
    }

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];

    return (
      candidates.find((type) =>
        MediaRecorder.isTypeSupported(type)
      ) || ""
    );
  }, []);

  const householdLitres = Math.max(
    0,
    rainfall
  ) * Math.max(
    0,
    roofArea
  ) * 0.8;

  const villageLitres =
    householdLitres * Math.max(0, households);

  const householdKilolitres =
    householdLitres / 1000;

  const villageKilolitres =
    villageLitres / 1000;

  const personDays =
    Math.round(villageLitres / 50);

  const representativeHarvest =
    householdKilolitres;

  const representativeRecharge =
    representativeHarvest * 0.45;

  const activeSolutionDetails =
    getSolutionDetails(
      activeSolution,
      analysis,
      selectedMapState
    );

  const crisis = analysis
    ? getCrisisMode(analysis.problem)
    : null;

  useEffect(() => {
    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setJudgeMode(false);
        setSaathiOpen(false);
      }

      if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea" && tag !== "select") {
          resetExperience();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  async function transcribeAudio(
    audioBlob: Blob
  ) {
    try {
      setStage("transcribing");
      setErrorMessage("");

      const extension =
        audioBlob.type.includes("mp4")
          ? "mp4"
          : "webm";

      const file = new File(
        [audioBlob],
        `jalvan-recording.${extension}`,
        {
          type:
            audioBlob.type ||
            "audio/webm",
        }
      );

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "language",
        language
      );

      const response = await fetch(
        "/api/transcribe",
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Transcription failed."
        );
      }

      const text =
        typeof data?.text === "string"
          ? data.text.trim()
          : "";

      if (!text) {
        throw new Error(
          "No speech was detected. Please speak clearly and try again."
        );
      }

      const result = data?.analysis as Analysis | undefined;

      if (!result) {
        throw new Error(
          "JALVĀN transcription succeeded, but the Core analysis was not returned."
        );
      }

      setDemoScenario(null);
      setTranscript(text);
      setAnalysis(result);
      setUnderstanding(
        data?.understanding ?? null
      );
      setActiveSolution("iks");
      setStage("result");
    } catch (error) {
      console.error(
        "JALVĀN transcription error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while processing your voice."
      );

      setStage("error");
    }
  }

  async function startRecording() {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Your browser does not support microphone recording."
        );
      }

      setErrorMessage("");
      setTranscript("");
      setAnalysis(null);

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }
        );

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder =
        supportedMimeType
          ? new MediaRecorder(
              stream,
              {
                mimeType:
                  supportedMimeType,
              }
            )
          : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(
          chunksRef.current,
          {
            type:
              recorder.mimeType ||
              supportedMimeType ||
              "audio/webm",
          }
        );

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current = null;
        recorderRef.current = null;

        if (audioBlob.size === 0) {
          setStage("error");
          setErrorMessage(
            "The recording was empty. Please try again."
          );
          return;
        }

        await transcribeAudio(
          audioBlob
        );
      };

      recorder.start();
      setStage("listening");
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Microphone access was not available."
      );

      setStage("error");
    }
  }

  function stopRecording() {
    const recorder =
      recorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }
  }

  function loadDemoScenario(scenario: DemoScenario) {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];

    setErrorMessage("");
    setDemoScenario(scenario);
    setSelectedMapState(scenario.state);
    setTranscript(scenario.transcript);
    setAnalysis(scenario.analysis);
    setUnderstanding(scenario.understanding);
    setActiveSolution("iks");
    setSaathiOpen(false);
    setSaathiPrepared(false);
    setStage("result");
  }

  function handleOrbClick() {
    if (stage === "idle") {
      startRecording();
      return;
    }

    if (stage === "listening") {
      stopRecording();
    }
  }

  const judgeSteps = [
    {
      label: "01 · Listen",
      title: "Start with the community voice.",
      text: "Use the real microphone flow to show that JALVĀN begins with a person's own description of the water problem.",
      action: "Use microphone",
    },
    {
      label: "02 · Understand",
      title: "Show the diagnosis and reasoning.",
      text: "Load the drought scenario to demonstrate classification, evidence, indigenous knowledge, engineering and a government pathway.",
      action: "Open drought case",
    },
    {
      label: "03 · Adapt",
      title: "Change the crisis. Watch JALVĀN adapt.",
      text: "Switch to flood response to show that JALVĀN is not a static recommendation page.",
      action: "Open flood case",
    },
    {
      label: "04 · Map",
      title: "Connect intelligence to place.",
      text: "Move into the Water Atlas and show how regional context changes the intervention framing.",
      action: "Open Water Atlas",
    },
    {
      label: "05 · Impact",
      title: "Finish with measurable potential.",
      text: "Use the impact engine to change assumptions and demonstrate how the estimated water potential responds.",
      action: "Open Impact Engine",
    },
  ];

  function runJudgeStep(step: number) {
    const clamped = Math.max(0, Math.min(judgeSteps.length - 1, step));
    setJudgeStep(clamped);

    if (clamped === 0) {
      setJudgeMode(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (clamped === 1) {
      loadDemoScenario(demoScenarios[0]);
      setJudgeMode(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (clamped === 2) {
      loadDemoScenario(demoScenarios[1]);
      setJudgeMode(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setJudgeMode(false);
    window.setTimeout(() => {
      document.getElementById(clamped === 3 ? "water-map" : "impact")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function openJudgeMode() {
    setJudgeStep(0);
    setJudgeMode(true);
  }

  function resetExperience() {
    recorderRef.current?.stop();

    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    recorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];

    setStage("idle");
    setTranscript("");
    setAnalysis(null);
    setUnderstanding(null);
    setErrorMessage("");
    setDemoScenario(null);
    setSaathiOpen(false);
    setSaathiPrepared(false);
  }

  const isListening =
    stage === "listening";

  const isProcessing =
    stage === "transcribing";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03100e] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="absolute bottom-[-300px] left-[-150px] h-[600px] w-[600px] rounded-full bg-emerald-400/10 blur-[150px]" />

        <div className="jalvan-grid absolute inset-0 opacity-40" />
      </div>

      {/* NAV */}
      <header className="relative z-20 border-b border-white/[0.07] bg-[#03100e]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div>
            <div className="text-xl font-semibold tracking-[0.18em] text-white">
              JALVĀN
            </div>

            <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-cyan-200/45">
              Indigenous Water Intelligence
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetExperience}
              className="hidden rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-white/40 transition hover:border-white/20 hover:text-white/80 md:block"
              title="Reset demo · keyboard shortcut R"
            >
              Reset demo
            </button>

            <button
              type="button"
              onClick={openJudgeMode}
              className="hidden rounded-full border border-cyan-200/15 bg-cyan-200/[0.035] px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-cyan-100/60 transition hover:border-cyan-200/30 hover:bg-cyan-200/[0.07] hover:text-cyan-50 md:block"
            >
              Judge walkthrough
            </button>

            <div className="flex items-center gap-3 rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,0.9)]" />

            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-200/70">
              Core online
            </span>
            </div>
          </div>
        </div>
      </header>

      {judgeMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#010807]/85 px-5 py-8 backdrop-blur-xl">
          <div className="w-full max-w-4xl overflow-hidden rounded-[36px] border border-cyan-200/15 bg-[#061512] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-7 py-5 md:px-9">
              <div>
                <div className="text-[9px] uppercase tracking-[0.3em] text-cyan-200/50">JALVĀN · Judge walkthrough</div>
                <div className="mt-2 text-sm text-white/45">A guided path through the product story.</div>
              </div>
              <button type="button" onClick={() => setJudgeMode(false)} className="rounded-full border border-white/10 px-3 py-2 text-white/40 transition hover:text-white">×</button>
            </div>

            <div className="grid gap-7 p-7 md:grid-cols-[0.8fr_1.2fr] md:p-9">
              <div>
                <div className="space-y-2">
                  {judgeSteps.map((step, index) => (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => setJudgeStep(index)}
                      className={[
                        "w-full rounded-2xl border p-4 text-left transition",
                        judgeStep === index
                          ? "border-cyan-200/20 bg-cyan-200/[0.06]"
                          : "border-white/8 bg-white/[0.015] hover:border-white/15",
                      ].join(" ")}
                    >
                      <div className="text-[8px] uppercase tracking-[0.2em] text-cyan-200/45">{step.label}</div>
                      <div className="mt-2 text-sm text-white/70">{step.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex min-h-[360px] flex-col justify-between rounded-[28px] border border-white/10 bg-black/10 p-7 md:p-9">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,0.8)]" />
                    <span className="text-[9px] uppercase tracking-[0.25em] text-emerald-200/55">{judgeSteps[judgeStep].label}</span>
                  </div>
                  <h3 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{judgeSteps[judgeStep].title}</h3>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/40">{judgeSteps[judgeStep].text}</p>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => runJudgeStep(judgeStep)}
                    className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.07] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-cyan-50 transition hover:bg-cyan-200/[0.12]"
                  >
                    {judgeSteps[judgeStep].action}
                  </button>
                  {judgeStep < judgeSteps.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setJudgeStep((value) => value + 1)}
                      className="rounded-2xl border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-white/45 transition hover:border-white/20 hover:text-white"
                    >
                      Next step →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-[780px] max-w-7xl flex-col items-center px-6 pb-20 pt-24 text-center lg:px-10">
        <div className="mb-5 rounded-full border border-cyan-200/10 bg-cyan-200/[0.035] px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-cyan-100/55">
          Voice-first water intelligence
        </div>

        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
          Tell us about
          <span className="block bg-gradient-to-r from-cyan-200 via-white to-emerald-200 bg-clip-text text-transparent">
            your water.
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-base leading-7 text-white/45 md:text-lg">
          Speak naturally in your own language.
          JALVĀN turns your situation into
          indigenous knowledge, engineering,
          schemes and actionable insight.
        </p>

        {/* VOICE ORB */}
        <div className="relative mt-16">
          {isListening && (
            <>
              <div className="jalvan-pulse absolute inset-[-30px] rounded-full border border-cyan-300/20" />
              <div className="jalvan-pulse-delay absolute inset-[-55px] rounded-full border border-cyan-300/10" />
            </>
          )}

          <button
            type="button"
            onClick={handleOrbClick}
            disabled={isProcessing}
            aria-label={
              isListening
                ? "Stop recording"
                : "Start recording"
            }
            className={[
              "relative flex h-44 w-44 items-center justify-center rounded-full border transition-all duration-500",
              isListening
                ? "scale-105 border-cyan-200/50 bg-cyan-300/[0.12] shadow-[0_0_90px_rgba(103,232,249,0.25)]"
                : "border-white/10 bg-white/[0.035] shadow-[0_0_80px_rgba(45,212,191,0.08)] hover:scale-[1.03] hover:border-cyan-200/30",
              isProcessing
                ? "cursor-wait"
                : "",
            ].join(" ")}
          >
            <div className="absolute inset-5 rounded-full border border-cyan-200/10" />

            {isProcessing ? (
              <div className="jalvan-spinner h-10 w-10 rounded-full border-2 border-cyan-200/20 border-t-cyan-200" />
            ) : isListening ? (
              <div className="h-8 w-8 rounded-md bg-cyan-100 shadow-[0_0_30px_rgba(207,250,254,0.7)]" />
            ) : (
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                className="text-cyan-100"
              >
                <rect
                  x="9"
                  y="2"
                  width="6"
                  height="13"
                  rx="3"
                />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v4" />
                <path d="M8 22h8" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-7 text-[10px] uppercase tracking-[0.3em] text-white/35">
          {stage === "idle" &&
            "Tap to speak"}

          {stage === "listening" &&
            "Listening — tap to stop"}

          {stage === "transcribing" &&
            "JALVĀN is understanding"}

          {stage === "result" &&
            "Voice input captured"}

          {stage === "error" &&
            "Voice processing failed"}
        </div>

        {/* WAVEFORM */}
        <div className="mt-12 flex h-16 items-center gap-1.5">
          {Array.from({
            length: 15,
          }).map((_, index) => (
            <span
              key={index}
              className="w-1.5 rounded-full bg-cyan-300/65"
              style={{
                height: `${
                  20 +
                  ((index * 17) % 38)
                }px`,
                animationName:
                  isListening
                    ? "jalvanWave"
                    : undefined,
                animationDuration:
                  isListening
                    ? "0.9s"
                    : undefined,
                animationTimingFunction:
                  isListening
                    ? "ease-in-out"
                    : undefined,
                animationIterationCount:
                  isListening
                    ? "infinite"
                    : undefined,
                animationDelay:
                  isListening
                    ? `${index * 0.06}s`
                    : undefined,
              }}
            />
          ))}
        </div>

        <p className="mt-4 text-sm text-white/30">
          Your voice stays the starting point.
        </p>

        {/* LANGUAGES */}
        <div className="mt-9 flex flex-wrap justify-center gap-2">
          {languages.map((item) => {
            const active =
              language === item.code;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() =>
                  setLanguage(item.code)
                }
                className={[
                  "rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition",
                  active
                    ? "border-cyan-200/25 bg-cyan-200/[0.08] text-cyan-100"
                    : "border-white/10 bg-white/[0.025] text-white/35 hover:border-white/20 hover:text-white/60",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={openJudgeMode}
          className="mt-5 rounded-full border border-white/10 bg-white/[0.025] px-5 py-2.5 text-[9px] uppercase tracking-[0.2em] text-white/40 transition hover:border-cyan-200/20 hover:bg-cyan-200/[0.04] hover:text-cyan-100"
        >
          Start 90-second judge walkthrough →
        </button>

        {/* DEMO SCENARIO LAB */}
        {stage === "idle" && (
          <div className="mt-14 w-full max-w-5xl text-left">
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div>
                <div className="text-[9px] uppercase tracking-[0.28em] text-emerald-200/45">
                  JALVĀN Field Lab · instant demo
                </div>
                <div className="mt-2 text-sm text-white/45">
                  Explore three response modes without using the microphone.
                </div>
              </div>
              <div className="hidden rounded-full border border-white/10 px-3 py-1.5 text-[8px] uppercase tracking-[0.18em] text-white/25 md:block">
                Judge-ready scenarios
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => loadDemoScenario(scenario)}
                  className="group rounded-[26px] border border-white/10 bg-white/[0.025] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-cyan-200/20 hover:bg-cyan-200/[0.035]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-200/45">
                      {scenario.label}
                    </span>
                    <span className="text-cyan-200/40 transition group-hover:translate-x-1 group-hover:text-cyan-100">
                      →
                    </span>
                  </div>
                  <div className="mt-4 text-base font-medium text-white/80">
                    {scenario.title}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/30">
                    {scenario.transcript}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-[8px] uppercase tracking-[0.16em] text-white/20">
                    <span>{scenario.state}</span>
                    <span>·</span>
                    <span>Open scenario</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ERROR */}
      {stage === "error" && (
        <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20">
          <div className="rounded-[28px] border border-orange-300/20 bg-orange-300/[0.035] p-7">
            <div className="text-xs uppercase tracking-[0.25em] text-orange-200/80">
              Voice processing error
            </div>

            <p className="mt-4 text-base leading-7 text-white/70">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={resetExperience}
              className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {/* RESULT */}
      {stage === "result" &&
        analysis && (
          <section id="result" className="relative z-10 mx-auto max-w-6xl scroll-mt-20 px-6 pb-24 lg:px-10">
            {/* RESULT HEADER */}
            <div className="mb-5 overflow-hidden rounded-[36px] border border-cyan-200/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.07),rgba(255,255,255,0.02)_42%,rgba(16,185,129,0.05))] p-7 md:p-9">
              <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(110,231,183,0.9)]" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-200/70">
                      JALVĀN Core · Situation detected
                    </span>
                    {demoScenario && (
                      <span className="rounded-full border border-cyan-200/10 bg-cyan-200/[0.04] px-3 py-1 text-[8px] uppercase tracking-[0.2em] text-cyan-100/45">
                        Demo scenario · illustrative
                      </span>
                    )}
                  </div>
                  <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-white md:text-6xl">
                    {analysis.problem}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
                    {analysis.category} · {analysis.intent}. JALVĀN has mapped the situation to indigenous knowledge, engineering and a government pathway.
                  </p>
                </div>

                <div className="min-w-[190px] rounded-3xl border border-white/10 bg-black/10 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.22em] text-white/30">
                      Explainability
                    </span>
                    <span className="text-xl font-semibold text-cyan-100">
                      {analysis.confidence}%
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 transition-all duration-1000" style={{ width: `${analysis.confidence}%` }} />
                  </div>
                  <div className="mt-3 text-[9px] uppercase tracking-[0.18em] text-white/25">
                    Core confidence signal
                  </div>
                </div>
              </div>
            </div>

            {demoScenario && (
              <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-cyan-200/10 bg-cyan-200/[0.025] px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-200/70" />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-100/45">
                    Field Lab · {demoScenario.state}
                  </span>
                  <span className="text-xs text-white/30">
                    This scenario demonstrates the response flow; site conditions still require validation.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetExperience}
                  className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-[8px] uppercase tracking-[0.18em] text-white/45 transition hover:border-white/20 hover:text-white/75"
                >
                  Return to voice
                </button>
              </div>
            )}

            {crisis && (
              <CrisisBanner
                mode={crisis.mode}
                title={crisis.title}
                text={crisis.text}
              />
            )}

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Transcript */}
              <div className="rounded-[32px] border border-white/10 bg-white/[0.025] p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55">
                    What JALVĀN heard
                  </div>

                  <div className="rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-emerald-200/65">
                    Voice
                  </div>
                </div>

                <p className="mt-8 text-2xl leading-10 text-white/85 md:text-3xl">
                  “{transcript}”
                </p>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  <InfoStat
                    label="Language"
                    value={
                      language === "auto"
                        ? "Auto detected"
                        : language
                    }
                  />

                  <InfoStat
                    label="Confidence"
                    value={`${analysis.confidence}%`}
                  />

                  <InfoStat
                    label="Intent"
                    value={analysis.intent}
                  />
                </div>
              </div>

              {/* Core reasoning */}
              <div className="rounded-[32px] border border-cyan-200/10 bg-cyan-200/[0.025] p-8">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55">
                    Why JALVĀN thinks this
                  </div>
                  <div className="rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-emerald-200/65">
                    {understanding?.source === "gemini-3.8-flash" ? "AI enhanced" : "Core intelligence"}
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  {(understanding?.reasons?.length ? understanding.reasons : ["The spoken situation was mapped against JALVĀN's water-problem knowledge base."]).map((reason, index) => (
                    <div key={`${reason}-${index}`} className="flex gap-4 rounded-2xl border border-white/8 bg-black/10 p-4">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-200/[0.08] text-[9px] text-cyan-100/70">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm leading-6 text-white/55">{reason}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniSignal label="Problem signals" value={understanding?.problems?.join(" · ") || analysis.problem} />
                  <MiniSignal label="Water intent" value={understanding?.purposes?.join(" · ") || analysis.intent} />
                </div>
              </div>
            </div>

            {/* INTERACTIVE SOLUTION MATRIX */}
            <div className="mt-5">
              <div className="mb-3 flex items-end justify-between gap-4 px-1">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55">
                    Intervention matrix
                  </div>
                  <div className="mt-2 text-sm text-white/35">
                    Select a layer to inspect why JALVĀN matched it.
                  </div>
                </div>
                <div className="hidden text-[9px] uppercase tracking-[0.2em] text-white/20 md:block">
                  Click to inspect
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <SolutionCard
                  number="01"
                  label="IKS MATCH"
                  title="Indigenous Knowledge"
                  value={analysis.iks}
                  icon="◈"
                  active={activeSolution === "iks"}
                  onClick={() => setActiveSolution("iks")}
                />

                <SolutionCard
                  number="02"
                  label="ENGINEERING"
                  title="Modern Intervention"
                  value={analysis.engineering}
                  icon="⌁"
                  active={activeSolution === "engineering"}
                  onClick={() => setActiveSolution("engineering")}
                />

                <SolutionCard
                  number="03"
                  label="YOJANA MATCH"
                  title="Government Pathway"
                  value={analysis.yojana}
                  icon="◎"
                  active={activeSolution === "yojana"}
                  onClick={() => setActiveSolution("yojana")}
                />
              </div>

              <div className="mt-3 overflow-hidden rounded-[28px] border border-cyan-200/10 bg-cyan-200/[0.025] p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/45">
                      {activeSolutionDetails.kicker}
                    </div>
                    <h3 className="mt-2 text-xl font-medium tracking-[-0.025em] text-white">
                      {activeSolutionDetails.title}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
                      {activeSolutionDetails.text}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-white/8 bg-black/10 px-5 py-4">
                    <div className="text-[8px] uppercase tracking-[0.18em] text-white/25">
                      Selected region
                    </div>
                    <div className="mt-1 text-sm text-cyan-100/80">
                      {selectedMapState}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("water-map")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-5 rounded-xl border border-cyan-200/10 bg-white/[0.035] px-4 py-2.5 text-[9px] uppercase tracking-[0.18em] text-cyan-100/65 transition hover:border-cyan-200/25 hover:bg-cyan-200/[0.05] hover:text-cyan-100"
                >
                  Explore on water atlas →
                </button>
              </div>
            </div>

            {/* FIRST ACTIONS */}
            <div className="mt-5 rounded-[32px] border border-emerald-200/10 bg-emerald-200/[0.025] p-8">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/55">
                    What should this community do first?
                  </div>
                  <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white">
                    Turn the diagnosis into a sequence of action.
                  </h3>
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                  Prioritized by JALVĀN Core
                </div>
              </div>

              <div className="mt-7 grid gap-3 md:grid-cols-3">
                {getPriorityActions(analysis.problem).map((action, index) => (
                  <ActionCard key={action.title} index={index + 1} {...action} />
                ))}
              </div>
            </div>

            {/* WHY */}
            <div className="mt-5 rounded-[32px] border border-white/10 bg-white/[0.025] p-8">
              <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55">
                Why this solution?
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-3">
                <ReasonCard
                  title="Traditional + Modern"
                  text="JALVĀN connects locally proven water wisdom with contemporary engineering."
                />

                <ReasonCard
                  title="Explainable"
                  text="Every recommendation shows the reasoning behind the selected intervention."
                />

                <ReasonCard
                  title="Community-first"
                  text="Solutions are framed around village-level action, resilience and participation."
                />
              </div>
            </div>

            {/* SAATHI */}
            <div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] border border-cyan-200/10 bg-cyan-200/[0.025] p-7">
                <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55">
                  Expected impact
                </div>
                <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-3xl font-semibold tracking-[-0.04em] text-white">
                      {representativeHarvest.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kL/year
                    </div>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/40">
                      Illustrative harvest potential from the current rooftop assumptions. The engineering card above remains the source of the situation-specific estimate.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-200/10 bg-black/10 px-5 py-4 text-right">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                      Recharge potential
                    </div>
                    <div className="mt-1 text-lg text-cyan-100">{representativeRecharge.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kL</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-amber-200/10 bg-amber-200/[0.025] p-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-amber-100/55">
                    JALVĀN Saathi
                  </div>
                  <span className="rounded-full border border-amber-200/10 bg-amber-200/[0.04] px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-amber-100/55">
                    Human help
                  </span>
                </div>
                <h3 className="mt-4 text-xl text-white">Need help taking this forward?</h3>
                <p className="mt-2 text-sm leading-6 text-white/40">
                  JALVĀN can hand the recommendation into a human-supported workflow for local validation, implementation and scheme navigation.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSaathiPrepared(false);
                    setSaathiOpen(true);
                  }}
                  className="mt-5 rounded-xl border border-amber-100/10 bg-white/[0.035] px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-amber-50/65 transition hover:border-amber-100/20 hover:text-amber-50"
                >
                  Prepare Saathi request
                </button>
              </div>
            </div>

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={resetExperience}
                className="rounded-full border border-white/10 bg-white/[0.035] px-6 py-3 text-[10px] uppercase tracking-[0.24em] text-white/55 transition hover:border-cyan-200/20 hover:text-cyan-100"
              >
                Analyze another situation
              </button>
            </div>
          </section>
        )}

      {saathiOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-5 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[32px] border border-amber-200/10 bg-[#071714] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
            {!saathiPrepared ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-amber-100/55">
                      JALVĀN Saathi · Human support
                    </div>
                    <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white">
                      Prepare a local support request
                    </h3>
                  </div>
                  <button type="button" onClick={() => setSaathiOpen(false)} className="rounded-full border border-white/10 px-3 py-2 text-white/40 hover:text-white">×</button>
                </div>

                <p className="mt-4 text-sm leading-6 text-white/40">
                  This demo prepares the information a Saathi would need for local validation. It does not send anything externally.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <input className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-amber-200/25" placeholder="Your name" />
                  <input className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-amber-200/25" placeholder="Village / community" />
                  <input className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-amber-200/25 sm:col-span-2" placeholder="Phone or preferred contact" />
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200/10 bg-amber-200/[0.025] p-4">
                  <div className="text-[8px] uppercase tracking-[0.18em] text-amber-100/40">
                    Request context
                  </div>
                  <div className="mt-2 text-sm text-white/65">
                    {analysis?.problem} · {analysis?.iks} · {selectedMapState}
                  </div>
                </div>

                <button type="button" onClick={() => setSaathiPrepared(true)} className="mt-6 w-full rounded-2xl border border-amber-200/15 bg-amber-200/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-amber-50/75 transition hover:bg-amber-200/[0.1]">
                  Prepare request
                </button>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200">✓</div>
                <div className="mt-5 text-[10px] uppercase tracking-[0.28em] text-emerald-200/60">
                  Request prepared
                </div>
                <h3 className="mt-3 text-2xl text-white">Ready for Saathi handoff</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
                  The demo has assembled the situation, recommended intervention and selected region. No external request has been sent.
                </p>
                <button type="button" onClick={() => setSaathiOpen(false)} className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-white/60 hover:text-white">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAP */}
      <section
        id="water-map"
        className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-6 pb-24 lg:px-10"
      >
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/50">
            JALVĀN water atlas
          </div>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                Water intelligence across India.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
                Explore state-level water stress,
                intervention signals and indigenous
                knowledge hotspots.
              </p>
            </div>

            <div className="rounded-full border border-cyan-200/10 bg-cyan-200/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-100/60">
              Selected: {selectedMapState}
            </div>
          </div>
        </div>

        <WaterMap
          selectedState={selectedMapState}
          onStateSelect={setSelectedMapState}
        />
      </section>

      {/* ATLAS INTELLIGENCE */}
      <section id="atlas-intelligence" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-6 pb-24 lg:px-10">
        <div className="overflow-hidden rounded-[36px] border border-cyan-200/10 bg-cyan-200/[0.025]">
          <div className="border-b border-white/[0.07] p-7 md:p-10">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/55">JALVĀN atlas intelligence</div>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">The map now explains the recommendation.</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/40">Select a region to see the curated water context that JALVĀN uses to frame indigenous knowledge, engineering and response priorities. This is a decision-support layer, not a live field survey.</p>
              </div>
              <div className="rounded-full border border-emerald-200/10 bg-emerald-200/[0.035] px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-emerald-100/55">Context linked · {selectedMapState}</div>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {["Rajasthan","Uttar Pradesh","Assam","Tamil Nadu","Maharashtra"].map((state) => (
                <button key={state} type="button" onClick={() => setSelectedMapState(state)} className={["rounded-full border px-4 py-2 text-[9px] uppercase tracking-[0.16em] transition", selectedMapState === state ? "border-cyan-200/25 bg-cyan-200/[0.08] text-cyan-100" : "border-white/10 bg-white/[0.02] text-white/35 hover:border-cyan-200/15 hover:text-white/65"].join(" ")}>{state}</button>
              ))}
            </div>
          </div>
          <AtlasIntelligencePanel state={selectedMapState} analysis={analysis} activeSolution={activeSolution} />
        </div>
      </section>

      {/* CALCULATOR */}
      <section
        id="impact"
        className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-6 pb-28 lg:px-10"
      >
        <div className="rounded-[36px] border border-white/10 bg-white/[0.025] p-7 md:p-10">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/50">
              JALVĀN Impact Engine
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
              Estimate your rainwater potential.
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/40">
              A transparent first-pass estimate for
              rooftop rainwater capture. Actual
              feasibility requires site validation.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {[
              { label: "Dry village", values: [1200, 240, 100, 700] },
              { label: "Small hamlet", values: [300, 65, 80, 850] },
              { label: "High rainfall", values: [1200, 240, 100, 1200] },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setPopulation(preset.values[0]);
                  setHouseholds(preset.values[1]);
                  setRoofArea(preset.values[2]);
                  setRainfall(preset.values[3]);
                }}
                className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-white/40 transition hover:border-cyan-200/20 hover:text-cyan-100"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="grid gap-4">
              <NumberInput
                label="Village population"
                suffix="people"
                value={population}
                onChange={setPopulation}
              />

              <NumberInput
                label="Households"
                suffix="homes"
                value={households}
                onChange={setHouseholds}
              />

              <NumberInput
                label="Average roof catchment"
                suffix="m² / home"
                value={roofArea}
                onChange={setRoofArea}
              />

              <NumberInput
                label="Annual rainfall"
                suffix="mm / year"
                value={rainfall}
                onChange={setRainfall}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard
                label="Representative home"
                value={`${householdKilolitres.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 1,
                  }
                )} kL`}
                description="Estimated annual capture"
              />

              <MetricCard
                label="Village potential"
                value={`${villageKilolitres.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 0,
                  }
                )} kL`}
                description="Estimated annual capture"
              />

              <MetricCard
                label="Water equivalent"
                value={personDays.toLocaleString(
                  "en-IN"
                )}
                description="Person-days at 50 L/day"
              />

              <div className="rounded-3xl border border-orange-300/10 bg-orange-300/[0.025] p-6">
                <div className="text-[9px] uppercase tracking-[0.2em] text-orange-200/50">
                  Site validation required
                </div>

                <p className="mt-4 text-sm leading-6 text-white/50">
                  Soil, roof condition, runoff,
                  storage capacity and local rainfall
                  patterns must be checked before
                  implementation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-200/10 bg-cyan-200/[0.025] p-6">
            <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-200/45">
              Interpretation
            </div>

            <p className="mt-3 text-sm leading-7 text-white/55">
              This catchment could potentially capture
              around{" "}
              <span className="text-cyan-100">
                {villageKilolitres.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 0,
                  }
                )}{" "}
                kL
              </span>{" "}
              of rainfall annually under the selected
              assumptions.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="text-sm tracking-[0.18em] text-white/70">
              JALVĀN
            </div>

            <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/25">
              Indigenous Water Intelligence
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.2em] text-white/25">
            Listen · Understand · Explain · Act
          </div>
        </div>
      </footer>
    </main>
  );
}

function AtlasIntelligencePanel({
  state, analysis, activeSolution,
}: { state: string; analysis: Analysis | null; activeSolution: "iks" | "engineering" | "yojana"; }) {
  const profiles: Record<string, { climate:string; pressure:string; indigenous:string; intervention:string; pathway:string; signal:string }> = {
    Rajasthan:{climate:"Arid · semi-arid",pressure:"Seasonal scarcity + groundwater stress",indigenous:"Kund · Johad · Tanka",intervention:"Capture scarce rainfall and validate recharge locations.",pathway:"Atal Bhujal Yojana · PMKSY",signal:"High dry-season sensitivity"},
    "Uttar Pradesh":{climate:"Sub-humid · alluvial",pressure:"Groundwater pressure + source-quality risk",indigenous:"Village ponds · traditional recharge landscapes",intervention:"Protect drinking sources and connect recharge with extraction monitoring.",pathway:"Jal Jeevan Mission · Atal Bhujal Yojana",signal:"Community source protection"},
    Assam:{climate:"Humid · flood-prone",pressure:"Seasonal flooding + river overflow",indigenous:"Ahar-Pyne-inspired flow management",intervention:"Work with seasonal flows, protect drinking supply and restore safe drainage.",pathway:"Jal Jeevan Mission · MGNREGA",signal:"High monsoon exposure"},
    "Tamil Nadu":{climate:"Semi-arid · coastal",pressure:"Seasonal rainfall variability + water demand",indigenous:"Eri tank systems",intervention:"Restore connected tanks and capture monsoon runoff before it leaves the landscape.",pathway:"PMKSY · MGNREGA",signal:"Tank-network opportunity"},
    Maharashtra:{climate:"Semi-arid · monsoon",pressure:"Seasonal scarcity + uneven recharge",indigenous:"Village ponds · bunding traditions",intervention:"Slow runoff, improve infiltration and protect stored water through the dry season.",pathway:"PMKSY · Catch the Rain",signal:"Runoff-to-recharge opportunity"},
  };
  const profile=profiles[state] ?? profiles.Rajasthan;
  const currentFocus=analysis ? activeSolution === "iks" ? analysis.iks : activeSolution === "engineering" ? analysis.engineering : analysis.yojana : "Select a voice situation or demo scenario to connect the atlas to a live recommendation.";
  return <div className="grid gap-px bg-white/[0.06] lg:grid-cols-[1.05fr_0.95fr]">
    <div className="bg-[#071513] p-7 md:p-10">
      <div className="flex items-center justify-between"><div className="text-[9px] uppercase tracking-[0.2em] text-white/25">Regional signal</div><div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.16em] text-emerald-200/55"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />Curated context</div></div>
      <div className="mt-5 text-3xl font-medium tracking-[-0.035em] text-white">{state}</div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2"><MiniSignal label="Climate" value={profile.climate} /><MiniSignal label="Water pressure" value={profile.pressure} /><MiniSignal label="Indigenous layer" value={profile.indigenous} /><MiniSignal label="Regional signal" value={profile.signal} /></div>
    </div>
    <div className="bg-[#061311] p-7 md:p-10">
      <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-200/45">Recommendation bridge</div>
      <div className="mt-5 rounded-3xl border border-cyan-200/10 bg-cyan-200/[0.025] p-6"><div className="text-[8px] uppercase tracking-[0.18em] text-white/25">Current JALVĀN focus · {activeSolution}</div><div className="mt-3 text-lg leading-7 text-white/85">{currentFocus}</div></div>
      <div className="mt-4 rounded-3xl border border-white/8 bg-black/10 p-6"><div className="text-[8px] uppercase tracking-[0.18em] text-white/25">What the atlas adds</div><div className="mt-3 text-sm leading-6 text-white/65">{profile.intervention}</div></div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[8px] uppercase tracking-[0.18em] text-white/25">Government pathway context</div><div className="mt-2 text-xs text-white/55">{profile.pathway}</div></div><div className="rounded-full border border-white/10 px-3 py-2 text-[8px] uppercase tracking-[0.16em] text-white/35">Validate locally</div></div>
    </div>
  </div>;
}

/* ------------------------------------------------ */
/* SMALL UI COMPONENTS                              */
/* ------------------------------------------------ */

function MiniSignal({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="text-[8px] uppercase tracking-[0.18em] text-white/25">{label}</div>
      <div className="mt-2 text-xs leading-5 text-white/60">{value}</div>
    </div>
  );
}

function ActionCard({
  index,
  title,
  text,
}: {
  index: number;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-3xl border border-white/8 bg-black/10 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-200/15 hover:bg-emerald-200/[0.025]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-[0.2em] text-emerald-200/45">{String(index).padStart(2, "0")}</span>
        <span className="h-2 w-2 rounded-full bg-emerald-300/60 transition group-hover:shadow-[0_0_15px_rgba(110,231,183,0.7)]" />
      </div>
      <div className="mt-6 text-sm font-medium text-white/85">{title}</div>
      <p className="mt-2 text-xs leading-6 text-white/35">{text}</p>
    </div>
  );
}

function getPriorityActions(problem: string) {
  const normalized = problem.toLowerCase();

  if (normalized.includes("flood")) {
    return [
      { title: "Protect people first", text: "Identify safe routes, vulnerable households and immediate drainage constraints." },
      { title: "Slow the runoff", text: "Map overflow paths and prioritize safe detention, drainage and landscape interventions." },
      { title: "Recover the water", text: "After the event, assess recharge opportunities and damaged water infrastructure." },
    ];
  }

  if (normalized.includes("contamin")) {
    return [
      { title: "Stop unsafe use", text: "Separate the suspected source from drinking supply until local water-quality checks are completed." },
      { title: "Find the source", text: "Map wells, sanitation, runoff and nearby contamination pathways." },
      { title: "Restore safe supply", text: "Pair verified treatment or alternate supply with longer-term source protection." },
    ];
  }

  if (normalized.includes("groundwater")) {
    return [
      { title: "Measure the well", text: "Record current water level, seasonal history and nearby extraction pressure." },
      { title: "Capture rainfall", text: "Prioritize rooftop and landscape runoff capture before the next rainfall window." },
      { title: "Recharge locally", text: "Validate suitable recharge structures with local soil and hydrogeology." },
    ];
  }

  return [
    { title: "Capture the next rainfall", text: "Identify rooftops, runoff paths and storage opportunities before the next rain event." },
    { title: "Recharge stressed sources", text: "Use locally suitable recharge measures after confirming soil and groundwater conditions." },
    { title: "Monitor recovery", text: "Track rainfall, storage and well levels so the intervention can be adjusted over time." },
  ];
}

function InfoStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="text-[8px] uppercase tracking-[0.18em] text-white/25">
        {label}
      </div>

      <div className="mt-2 text-xs leading-5 text-white/65">
        {value}
      </div>
    </div>
  );
}

function CrisisBanner({
  mode,
  title,
  text,
}: {
  mode: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-[28px] border border-orange-200/15 bg-orange-200/[0.035] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-200/15 bg-orange-200/[0.05] text-orange-100/80">
            !
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-orange-100/50">
              JALVĀN response mode · {mode}
            </div>
            <div className="mt-1 text-lg font-medium text-white">{title}</div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/40">{text}</p>
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-orange-200/10 px-3 py-1.5 text-[8px] uppercase tracking-[0.18em] text-orange-100/45">
          Validate locally
        </div>
      </div>
    </div>
  );
}

function getCrisisMode(problem: string) {
  const p = problem.toLowerCase();
  if (p.includes("flood")) return { mode: "FLOOD", title: "Protect people before infrastructure.", text: "JALVĀN shifts priority toward safe movement, overflow management and post-event recovery." };
  if (p.includes("contamin")) return { mode: "CONTAMINATION", title: "Protect the drinking-water pathway.", text: "Treat the source as potentially unsafe until local water-quality checks and an alternate supply are established." };
  if (p.includes("cyclone")) return { mode: "CYCLONE", title: "Prepare for rapid water-system disruption.", text: "Prioritize safe drinking reserves, vulnerable households, drainage and post-storm source checks." };
  if (p.includes("groundwater")) return { mode: "GROUNDWATER STRESS", title: "Recharge and extraction need to be considered together.", text: "Measure the well, understand extraction pressure and validate recharge opportunities before construction." };
  if (p.includes("drought")) return { mode: "DROUGHT", title: "Build resilience before the next rainfall window.", text: "Prioritize capture, recharge and monitoring while protecting the most critical water uses." };
  return { mode: "NORMAL", title: "Plan for water security.", text: "Use the recommendation as a first-pass decision aid and validate site conditions before implementation." };
}

function getSolutionDetails(
  type: "iks" | "engineering" | "yojana",
  analysis: Analysis | null,
  state: string
) {
  if (type === "iks") {
    return {
      kicker: "Knowledge layer · indigenous system",
      title: analysis?.iks || "Indigenous water system",
      text: `JALVĀN matched this knowledge system against the detected water problem, intended use and regional context. Use the atlas to inspect the selected ${state} context before treating the match as a site-specific design decision.`,
    };
  }
  if (type === "engineering") {
    return {
      kicker: "Engineering layer · transparent estimate",
      title: analysis?.engineering || "Rainwater and recharge intervention",
      text: "The estimate is a first-pass model using rainfall, catchment area and runoff assumptions. Soil infiltration, storage geometry, groundwater conditions and local measurements must be validated before implementation.",
    };
  }
  return {
    kicker: "Scheme layer · government pathway",
    title: analysis?.yojana || "Government water programme",
    text: "This is a relevance match, not an eligibility guarantee. The next step is to verify current scheme guidelines, local implementing agencies and the community's actual eligibility.",
  };
}

function SolutionCard({
  number,
  label,
  title,
  value,
  icon,
  active,
  onClick,
}: {
  number: string;
  label: string;
  title: string;
  value: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-[28px] border p-7 text-left transition duration-300",
        active
          ? "border-cyan-200/25 bg-cyan-200/[0.055] shadow-[0_0_50px_rgba(34,211,238,0.05)]"
          : "border-white/10 bg-white/[0.025] hover:-translate-y-0.5 hover:border-cyan-200/15 hover:bg-cyan-200/[0.025]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-[0.2em] text-white/20">
          {number}
        </span>

        <span className={active ? "text-lg text-cyan-100" : "text-lg text-cyan-200/50"}>
          {icon}
        </span>
      </div>

      <div className="mt-7 text-[9px] uppercase tracking-[0.22em] text-cyan-200/50">
        {label}
      </div>

      <div className="mt-2 text-sm text-white/40">
        {title}
      </div>

      <div className="mt-5 text-lg leading-7 text-white/85">
        {value}
      </div>

      <div className="mt-5 text-[8px] uppercase tracking-[0.18em] text-cyan-100/35">
        {active ? "Selected · showing reasoning" : "Inspect reasoning →"}
      </div>
    </button>
  );
}

function ReasonCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/10 p-6">
      <div className="text-sm font-medium text-white/80">
        {title}
      </div>

      <p className="mt-3 text-sm leading-6 text-white/40">
        {text}
      </p>
    </div>
  );
}

function NumberInput({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-3xl border border-white/10 bg-black/10 p-5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-white/55">
          {label}
        </span>

        <span className="text-[9px] uppercase tracking-[0.16em] text-white/25">
          {suffix}
        </span>
      </div>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(
              0,
              Number(event.target.value) || 0
            )
          )
        }
        className="mt-4 w-full border-0 bg-transparent text-2xl text-white outline-none placeholder:text-white/20"
      />
    </label>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-cyan-200/10 bg-cyan-200/[0.025] p-6">
      <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-200/45">
        {label}
      </div>

      <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>

      <div className="mt-2 text-xs text-white/30">
        {description}
      </div>
    </div>
  );
}
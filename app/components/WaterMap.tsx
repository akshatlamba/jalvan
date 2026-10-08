"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "leaflet/dist/leaflet.css";

type StateData = {
  name: string;
  lat: number;
  lng: number;
  stress:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM"
    | "LOW";
  groundwater: string;
  iks: string;
  solution: string;
  rainfall: string;
};

const STATES: StateData[] = [
  {
    name: "Rajasthan",
    lat: 27.0238,
    lng: 74.2179,
    stress: "CRITICAL",
    groundwater: "Severe stress",
    iks: "Johad + Khadin",
    solution:
      "Rainwater harvesting + groundwater recharge",
    rainfall: "Low / highly variable",
  },
  {
    name: "Gujarat",
    lat: 22.2587,
    lng: 71.1924,
    stress: "HIGH",
    groundwater: "High stress",
    iks: "Virdas + check dams",
    solution:
      "Rainwater harvesting + recharge",
    rainfall: "Low / seasonal",
  },
  {
    name: "Maharashtra",
    lat: 19.7515,
    lng: 75.7139,
    stress: "HIGH",
    groundwater: "High stress",
    iks: "Phad irrigation",
    solution:
      "Watershed restoration + recharge",
    rainfall: "Seasonal",
  },
  {
    name: "Madhya Pradesh",
    lat: 22.9734,
    lng: 78.6569,
    stress: "HIGH",
    groundwater: "High stress",
    iks: "Talab systems",
    solution:
      "Watershed restoration + recharge",
    rainfall: "Seasonal",
  },
  {
    name: "Uttar Pradesh",
    lat: 26.8467,
    lng: 80.9462,
    stress: "HIGH",
    groundwater: "High extraction",
    iks: "Traditional ponds",
    solution:
      "Aquifer recharge + pond restoration",
    rainfall: "Moderate",
  },
  {
    name: "Punjab",
    lat: 31.1471,
    lng: 75.3412,
    stress: "CRITICAL",
    groundwater: "Over-extraction",
    iks: "Traditional farm ponds",
    solution:
      "Efficient irrigation + recharge",
    rainfall: "Moderate",
  },
  {
    name: "Haryana",
    lat: 29.0588,
    lng: 76.0856,
    stress: "CRITICAL",
    groundwater: "Critical",
    iks: "Community ponds",
    solution:
      "Managed aquifer recharge",
    rainfall: "Moderate",
  },
  {
    name: "Karnataka",
    lat: 15.3173,
    lng: 75.7139,
    stress: "HIGH",
    groundwater: "Moderate-high stress",
    iks: "Kere / tank systems",
    solution:
      "Tank restoration + watershed management",
    rainfall: "Seasonal",
  },
  {
    name: "Telangana",
    lat: 18.1124,
    lng: 79.0193,
    stress: "HIGH",
    groundwater: "High stress",
    iks: "Kunta / tank systems",
    solution:
      "Farm ponds + recharge structures",
    rainfall: "Seasonal",
  },
  {
    name: "Tamil Nadu",
    lat: 11.1271,
    lng: 78.6569,
    stress: "HIGH",
    groundwater: "High stress",
    iks: "Eri tank systems",
    solution:
      "Tank restoration + rainwater harvesting",
    rainfall: "Monsoon dependent",
  },
  {
    name: "Kerala",
    lat: 10.8505,
    lng: 76.2711,
    stress: "MEDIUM",
    groundwater: "Moderate",
    iks: "Surangam",
    solution:
      "Spring / groundwater conservation",
    rainfall: "High",
  },
  {
    name: "Bihar",
    lat: 25.0961,
    lng: 85.3131,
    stress: "MEDIUM",
    groundwater: "Moderate",
    iks: "Ahar-Pyne",
    solution:
      "Traditional channel restoration",
    rainfall: "High / seasonal",
  },
  {
    name: "West Bengal",
    lat: 22.9868,
    lng: 87.855,
    stress: "MEDIUM",
    groundwater: "Moderate",
    iks: "Ponds + wetlands",
    solution:
      "Wetland restoration + recharge",
    rainfall: "High",
  },
  {
    name: "Odisha",
    lat: 20.9517,
    lng: 85.0985,
    stress: "MEDIUM",
    groundwater: "Moderate",
    iks: "Community ponds",
    solution:
      "Watershed + pond restoration",
    rainfall: "High / seasonal",
  },
  {
    name: "Andhra Pradesh",
    lat: 15.9129,
    lng: 79.74,
    stress: "HIGH",
    groundwater: "High stress",
    iks: "Cheruvu tanks",
    solution:
      "Tank restoration + recharge",
    rainfall: "Seasonal",
  },
  {
    name: "Chhattisgarh",
    lat: 21.2787,
    lng: 81.8661,
    stress: "MEDIUM",
    groundwater: "Moderate",
    iks: "Village tanks",
    solution:
      "Tank restoration + recharge",
    rainfall: "Seasonal",
  },
  {
    name: "Assam",
    lat: 26.2006,
    lng: 92.9376,
    stress: "MEDIUM",
    groundwater: "Moderate",
    iks: "Community wetlands",
    solution:
      "Wetland restoration + flood resilience",
    rainfall: "Very high",
  },
  {
    name: "Uttarakhand",
    lat: 30.0668,
    lng: 79.0193,
    stress: "MEDIUM",
    groundwater: "Localized stress",
    iks: "Naula / Dhara springs",
    solution:
      "Spring rejuvenation",
    rainfall: "High / seasonal",
  },
  {
    name: "Himachal Pradesh",
    lat: 31.1048,
    lng: 77.1734,
    stress: "MEDIUM",
    groundwater: "Localized stress",
    iks: "Kuhl irrigation",
    solution:
      "Spring + watershed conservation",
    rainfall: "Seasonal",
  },
];

function getStressColor(
  stress: StateData["stress"]
) {
  if (stress === "CRITICAL") {
    return "#fb7185";
  }

  if (stress === "HIGH") {
    return "#fb923c";
  }

  if (stress === "MEDIUM") {
    return "#facc15";
  }

  return "#34d399";
}

function getStressText(
  stress: StateData["stress"]
) {
  if (stress === "CRITICAL") {
    return "text-rose-200";
  }

  if (stress === "HIGH") {
    return "text-orange-200";
  }

  if (stress === "MEDIUM") {
    return "text-yellow-200";
  }

  return "text-emerald-200";
}

function FocusRegion({
  state,
}: {
  state: StateData | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!state) return;

    map.flyTo(
      [state.lat, state.lng],
      6,
      {
        duration: 1.2,
      }
    );
  }, [map, state]);

  return null;
}

export default function WaterMap({
  selectedState,
  onStateSelect,
}: {
  selectedState: string;
  onStateSelect: (
    state: string
  ) => void;
}) {
  const [activeState, setActiveState] =
    useState(selectedState);

  const selected = useMemo(
    () =>
      STATES.find(
        (state) =>
          state.name === activeState
      ) || STATES[0],
    [activeState]
  );

  useEffect(() => {
    setActiveState(selectedState);
  }, [selectedState]);

  const handleSelect = (
    state: StateData
  ) => {
    setActiveState(state.name);
    onStateSelect(state.name);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-24">
      {/* HEADER */}
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-10 bg-cyan-300/60" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200/60">
              JALVĀN / GEOSPATIAL INTELLIGENCE
            </span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Water Intelligence Map
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40">
            Explore regional water stress, groundwater
            conditions, indigenous water systems, and
            recommended interventions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-300/15 bg-emerald-300/5 px-4 py-2 md:self-auto">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />

          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
            Intelligence layer online
          </span>
        </div>
      </div>

      {/* MAP CONSOLE */}
      <div className="grid overflow-hidden rounded-[32px] border border-white/10 bg-[#071311] shadow-2xl shadow-black/30 lg:grid-cols-[1.35fr_0.65fr]">
        {/* MAP */}
        <div className="relative min-h-[620px]">
          <div className="absolute left-6 right-6 top-6 z-[500] flex items-center justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25">
                LIVE REGION LAYER
              </div>

              <div className="mt-1 text-sm text-white/70">
                India · Water intelligence
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-white/40 backdrop-blur">
              Click a region
            </div>
          </div>

          <MapContainer
            center={[
              22.5937,
              78.9629,
            ]}
            zoom={5}
            minZoom={4}
            maxZoom={9}
            scrollWheelZoom={false}
            className="jalvan-leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FocusRegion
              state={selected}
            />

            {STATES.map((state) => {
              const selected =
                state.name ===
                activeState;

              return (
                <CircleMarker
                  key={state.name}
                  center={[
                    state.lat,
                    state.lng,
                  ]}
                  radius={
                    selected ? 13 : 8
                  }
                  pathOptions={{
                    color: getStressColor(
                      state.stress
                    ),
                    fillColor:
                      getStressColor(
                        state.stress
                      ),
                    fillOpacity:
                      selected
                        ? 0.85
                        : 0.55,
                    weight:
                      selected ? 3 : 1,
                  }}
                  eventHandlers={{
                    click: () =>
                      handleSelect(
                        state
                      ),
                  }}
                >
                  <Popup>
                    <div className="min-w-[190px]">
                      <div className="text-sm font-bold">
                        {state.name}
                      </div>

                      <div className="mt-1 text-xs">
                        Water stress:{" "}
                        {state.stress}
                      </div>

                      <div className="mt-2 text-xs">
                        IKS: {state.iks}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* LEGEND */}
          <div className="absolute bottom-5 left-5 right-5 z-[500] flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
              WATER STRESS
            </span>

            {[
              ["#fb7185", "Critical"],
              ["#fb923c", "High"],
              ["#facc15", "Medium"],
              ["#34d399", "Lower"],
            ].map(
              ([color, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        color,
                    }}
                  />

                  <span className="text-[10px] text-white/50">
                    {label}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* INFORMATION PANEL */}
        <div className="flex flex-col border-t border-white/10 p-6 lg:border-l lg:border-t-0 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25">
                SELECTED REGION
              </div>

              <h3 className="mt-2 text-3xl font-semibold text-white">
                {selected.name}
              </h3>
            </div>

            <div
              className={`rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[9px] font-bold tracking-[0.18em] ${getStressText(
                selected.stress
              )}`}
            >
              {selected.stress}
            </div>
          </div>

          {/* SIGNAL */}
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                WATER STRESS SIGNAL
              </div>

              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    getStressColor(
                      selected.stress
                    ),
                  boxShadow: `0 0 18px ${getStressColor(
                    selected.stress
                  )}`,
                }}
              />
            </div>

            <div className="mt-5 flex h-20 items-end gap-1.5">
              {[25, 42, 32, 55, 68, 78, 92].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-white/5"
                  >
                    <div
                      className="w-full rounded-t bg-cyan-300/40"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>
                )
              )}
            </div>

            <div className="mt-3 text-xs text-white/30">
              Regional stress indicator
            </div>
          </div>

          {/* DATA */}
          <div className="mt-4 space-y-3">
            <InfoCard
              label="GROUNDWATER"
              value={
                selected.groundwater
              }
            />

            <InfoCard
              label="INDIGENOUS KNOWLEDGE"
              value={`🏺 ${selected.iks}`}
              accent="cyan"
            />

            <InfoCard
              label="RECOMMENDED INTERVENTION"
              value={
                selected.solution
              }
              accent="green"
            />

            <InfoCard
              label="RAINFALL PROFILE"
              value={
                selected.rainfall
              }
            />
          </div>

          <div className="mt-auto pt-8">
            <div className="border-t border-white/10 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                    REGION
                  </div>

                  <div className="mt-1 text-xs text-white/50">
                    India / {selected.name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                    JALVĀN
                  </div>

                  <div className="mt-1 text-xs text-emerald-200/60">
                    Analysis ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTELLIGENCE CARDS */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MiniCard
          icon="🌧️"
          title="Rainfall Intelligence"
          description="Understand rainfall patterns and their relationship with local water availability."
        />

        <MiniCard
          icon="💧"
          title="Groundwater Signals"
          description="Identify regions where recharge and groundwater management deserve attention."
        />

        <MiniCard
          icon="🏺"
          title="Indigenous Knowledge"
          description="Connect modern water interventions with traditional systems adapted to local conditions."
        />
      </div>
    </section>
  );
}

function InfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "cyan" | "green";
}) {
  const accentClass =
    accent === "cyan"
      ? "border-cyan-300/10 bg-cyan-300/[0.025] text-cyan-100/80"
      : accent === "green"
      ? "border-emerald-300/10 bg-emerald-300/[0.025] text-emerald-100/80"
      : "border-white/10 bg-white/[0.025] text-white/70";

  return (
    <div
      className={`rounded-2xl border p-4 ${accentClass}`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">
        {label}
      </div>

      <div className="mt-2 text-sm font-medium">
        {value}
      </div>
    </div>
  );
}

function MiniCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="text-2xl">
        {icon}
      </div>

      <div className="mt-5 text-sm font-semibold text-white">
        {title}
      </div>

      <p className="mt-2 text-xs leading-6 text-white/35">
        {description}
      </p>
    </div>
  );
}
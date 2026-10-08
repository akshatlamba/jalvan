import type { RegionProfile, Scheme, WaterSystem } from "./types";

export const REGIONS: RegionProfile[] = [
  { state: "Rajasthan", climate: "arid", rainfallMm: 500 },
  { state: "Gujarat", climate: "semi-arid", rainfallMm: 800 },
  { state: "Maharashtra", climate: "semi-arid", rainfallMm: 900 },
  { state: "Tamil Nadu", climate: "semi-arid", rainfallMm: 950 },
  { state: "Karnataka", climate: "semi-arid", rainfallMm: 1100 },
  { state: "Andhra Pradesh", climate: "semi-arid", rainfallMm: 900 },
  { state: "Telangana", climate: "semi-arid", rainfallMm: 900 },
  { state: "Bihar", climate: "sub-humid", rainfallMm: 1200 },
  { state: "Assam", climate: "humid", rainfallMm: 2300 },
  { state: "Kerala", climate: "humid", rainfallMm: 3000 },
  { state: "Uttarakhand", climate: "hill", rainfallMm: 1500 },
];

export const WATER_SYSTEMS: WaterSystem[] = [
  { name: "Tanka", states: ["Rajasthan", "Gujarat"], climates: ["arid", "semi-arid"], purposes: ["drinking"], scales: ["household", "community"], description: "Underground or covered rainwater storage traditionally used in dry regions.", benefit: "Reliable household drinking-water storage." },
  { name: "Kund", states: ["Rajasthan", "Gujarat"], climates: ["arid", "semi-arid"], purposes: ["drinking", "recharge"], scales: ["household", "community"], description: "Traditional saucer-shaped rainwater catchment and storage system.", benefit: "Captures scarce rainfall and improves local water security." },
  { name: "Johad", states: ["Rajasthan", "Haryana", "Delhi"], climates: ["arid", "semi-arid"], purposes: ["recharge", "irrigation"], scales: ["community"], description: "Small earthen check-dam or pond that captures monsoon runoff.", benefit: "Raises groundwater and supports agriculture." },
  { name: "Khadin", states: ["Rajasthan"], climates: ["arid"], purposes: ["irrigation"], scales: ["community"], description: "Runoff farming system that stores monsoon water behind an embankment.", benefit: "Uses harvested runoff to improve soil moisture and crops." },
  { name: "Baoli", states: ["Rajasthan", "Gujarat", "Delhi"], climates: ["arid", "semi-arid"], purposes: ["drinking", "recharge"], scales: ["community"], description: "Stepwell tradition for accessing and storing groundwater.", benefit: "Community water access and groundwater resilience." },
  { name: "Eri", states: ["Tamil Nadu"], climates: ["semi-arid", "sub-humid"], purposes: ["irrigation", "recharge"], scales: ["community"], description: "Traditional interconnected tank system.", benefit: "Buffers rainfall variability and supports irrigation." },
  { name: "Ahar-Pyne", states: ["Bihar", "Jharkhand"], climates: ["sub-humid"], purposes: ["irrigation", "recharge"], scales: ["community"], description: "Traditional floodwater harvesting and irrigation network.", benefit: "Stores seasonal water while managing excess flow." },
  { name: "Zabo", states: ["Nagaland"], climates: ["humid", "hill"], purposes: ["irrigation", "recharge"], scales: ["community"], description: "Integrated hill water harvesting and farming system.", benefit: "Links forest, water harvesting, livestock and agriculture." },
  { name: "Bamboo Drip Irrigation", states: ["Meghalaya", "Nagaland"], climates: ["humid", "hill"], purposes: ["irrigation"], scales: ["household", "community"], description: "Gravity-fed bamboo channels for controlled irrigation.", benefit: "Low-cost precision water delivery." },
  { name: "Kuhl", states: ["Himachal Pradesh"], climates: ["hill"], purposes: ["irrigation"], scales: ["community"], description: "Traditional mountain channel irrigation system.", benefit: "Distributes stream water to agricultural land." },
  { name: "Phad", states: ["Maharashtra"], climates: ["semi-arid"], purposes: ["irrigation"], scales: ["community"], description: "Community-managed diversion irrigation system.", benefit: "Shares seasonal water among farming communities." },
  { name: "Surangam", states: ["Kerala", "Karnataka"], climates: ["humid", "semi-arid"], purposes: ["drinking", "irrigation"], scales: ["household", "community"], description: "Traditional horizontal groundwater tunnel.", benefit: "Accesses groundwater using gravity." },
  { name: "Naula", states: ["Uttarakhand"], climates: ["hill"], purposes: ["drinking"], scales: ["household", "community"], description: "Traditional spring-water structure.", benefit: "Protects and stores mountain spring water." },
  { name: "Zing", states: ["Ladakh"], climates: ["arid", "hill"], purposes: ["drinking", "irrigation"], scales: ["community"], description: "Small storage basin for glacial meltwater.", benefit: "Stores scarce meltwater for dry periods." },
  { name: "Virda", states: ["Gujarat"], climates: ["arid", "semi-arid"], purposes: ["drinking"], scales: ["community"], description: "Traditional shallow well technique in saline landscapes.", benefit: "Provides access to fresher groundwater lenses." },
  { name: "Bundelkhand Talab", states: ["Uttar Pradesh", "Madhya Pradesh"], climates: ["semi-arid"], purposes: ["irrigation", "recharge"], scales: ["community"], description: "Traditional village pond systems.", benefit: "Supports recharge, livestock and agriculture." },
  { name: "Apatani Paddy-Fish", states: ["Arunachal Pradesh"], climates: ["hill", "humid"], purposes: ["irrigation"], scales: ["community"], description: "Integrated water and agriculture system.", benefit: "Combines water-efficient farming with food production." },
  { name: "Khazan", states: ["Goa"], climates: ["humid"], purposes: ["irrigation"], scales: ["community"], description: "Traditional managed wetland farming landscape.", benefit: "Balances tidal water, drainage and cultivation." },
  { name: "Village Pond", states: ["Rajasthan", "Gujarat", "Maharashtra", "Bihar", "Uttar Pradesh", "Madhya Pradesh"], climates: ["arid", "semi-arid", "sub-humid"], purposes: ["irrigation", "recharge", "drinking"], scales: ["community"], description: "Community pond for seasonal storage and recharge.", benefit: "Provides shared water storage and groundwater recharge." },
];

export const SCHEMES: Scheme[] = [
  { name: "PMKSY", tags: ["irrigation", "efficiency", "farmer"], description: "Pradhan Mantri Krishi Sinchayee Yojana." },
  { name: "Atal Bhujal Yojana", tags: ["groundwater", "recharge", "community"], description: "Groundwater management focused programme." },
  { name: "Jal Jeevan Mission", tags: ["drinking", "household", "water"], description: "Rural drinking-water service programme." },
  { name: "MGNREGA", tags: ["recharge", "community", "pond", "employment"], description: "Can support eligible water-conservation works." },
  { name: "Jal Shakti Abhiyan: Catch the Rain", tags: ["recharge", "rainwater", "community"], description: "Rainwater harvesting and water conservation campaign." },
];

export const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Marathi"];
export const ENGLISH_LANGUAGE_NAME = "English";
export const SPEECH_CODES: Record<string, string> = {
  Hindi: "hi-IN",
  English: "en-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Marathi: "mr-IN",
};

export const UI_TEXT = {
  title: "JALVĀN",
  subtitle: "Indigenous Water Intelligence",
};

export const NAME_HI: Record<string, string> = {};

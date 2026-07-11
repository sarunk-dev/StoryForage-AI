// Core data models for StoryForge AI

export interface StoryOutline {
  title: string;
  logline: string;
  premise: string;
  acts: {
    act1: string;
    act2: string;
    act3: string;
  };
  theme: string;
  tone: string;
}

export interface Character {
  name: string;
  role: string;
  physicalDescription: string;
  backstory: string;
  motivation: string;
  fatalFlaw: string;
  definingQuote: string;
}

export interface WorldBuilding {
  settingName: string;
  geography: string;
  rulesOrSystem: string;
  culturalFlavor: string;
  atmosphere: string;
}

export interface PitchDeck {
  prompt: string;
  genre: string;
  story: StoryOutline;
  characters: Character[];
  world: WorldBuilding;
  imagePrompts: string[];
  imageUrls: string[]; // base64 data URIs
  actAudioUrls?: {      // base64 audio for three acts
    act1?: string;
    act2?: string;
    act3?: string;
  };
}

export type GenerationStep =
  | "idle"
  | "story"
  | "characters"
  | "world"
  | "artPrompts"
  | "audio"
  | "images"
  | "done"
  | "error";

export interface GenerationState {
  step: GenerationStep;
  error?: string;
}

export const GENERATION_STEPS: { key: GenerationStep; label: string }[] = [
  { key: "story",      label: "Writing story outline" },
  { key: "characters", label: "Creating characters"   },
  { key: "world",      label: "Building the world"    },
  { key: "artPrompts", label: "Crafting art prompts"  },
  { key: "audio",      label: "Generating narration"  },
  { key: "images",     label: "Generating concept art"},
];

export const GENRES = [
  "Fantasy",
  "Sci-Fi",
  "Thriller",
  "Horror",
  "Romance",
  "Historical",
  "Mystery",
  "Adventure",
] as const;
export type Genre = (typeof GENRES)[number] | "None";

// ── Tier 1 options (always visible) ─────────────────────────────────────────
export const TONES = [
  "Dark & Gritty",
  "Hopeful & Uplifting",
  "Whimsical & Playful",
  "Melancholic",
  "Tense & Suspenseful",
  "Epic & Grand",
  "Intimate & Personal",
] as const;
export type Tone = (typeof TONES)[number] | "Any";

export const LENGTHS = [
  "Short Story",
  "Feature Film",
  "TV Pilot",
  "Book Series / Epic",
] as const;
export type StoryLength = (typeof LENGTHS)[number] | "Any";

export const ENDINGS = [
  "Happy Ending",
  "Tragic",
  "Bittersweet",
  "Open / Ambiguous",
  "Twist Ending",
] as const;
export type Ending = (typeof ENDINGS)[number] | "Any";

// ── Tier 2 options (advanced panel) ─────────────────────────────────────────
export const AUDIENCES = [
  "All Ages",
  "Young Adult (14+)",
  "Adult (18+)",
] as const;
export type Audience = (typeof AUDIENCES)[number] | "Any";

export const ERAS = [
  "Ancient / Mythological",
  "Medieval",
  "Renaissance",
  "Industrial / Victorian",
  "Modern Day",
  "Near Future",
  "Far Future",
  "Timeless / Unspecified",
] as const;
export type Era = (typeof ERAS)[number] | "Any";

// ── Bundled story options ────────────────────────────────────────────────────
export interface StoryOptions {
  genre:    Genre;
  tone:     Tone;
  length:   StoryLength;
  ending:   Ending;
  audience: Audience;
  era:      Era;
}

export const DEFAULT_OPTIONS: StoryOptions = {
  genre:    "None",
  tone:     "Any",
  length:   "Any",
  ending:   "Any",
  audience: "Any",
  era:      "Any",
};

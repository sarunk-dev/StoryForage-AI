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
}

export type GenerationStep =
  | "idle"
  | "story"
  | "characters"
  | "world"
  | "artPrompts"
  | "images"
  | "done"
  | "error";

export interface GenerationState {
  step: GenerationStep;
  error?: string;
}

export const GENERATION_STEPS: { key: GenerationStep; label: string }[] = [
  { key: "story", label: "Writing story outline" },
  { key: "characters", label: "Creating characters" },
  { key: "world", label: "Building the world" },
  { key: "artPrompts", label: "Crafting art prompts" },
  { key: "images", label: "Generating concept art" },
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

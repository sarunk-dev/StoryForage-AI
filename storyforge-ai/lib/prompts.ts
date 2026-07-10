import type { StoryOutline, Character, WorldBuilding } from "./types";

// System prompt sets the genre tone for all calls
export function systemPrompt(genre: string): string {
  const genreGuidance =
    genre && genre !== "None"
      ? `You are generating content for a ${genre} story. Every output should unmistakably feel like ${genre} — use genre-appropriate language, tropes, atmosphere, and stakes.`
      : "You are generating content for a creative story. Match the tone and genre implied by the user's concept.";

  return `You are a professional story development assistant and creative writing expert. ${genreGuidance}
Be vivid, specific, and original. Avoid clichés. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;
}

// Step 1: Story outline from user prompt
export function storyPrompt(userInput: string, genre: string): string {
  return `Create a compelling story concept based on this idea: "${userInput}"

Return ONLY this JSON (no extra text):
{
  "title": "A punchy, memorable title (3-6 words)",
  "logline": "One sentence that hooks you immediately — the concept + conflict + stakes",
  "premise": "2-3 sentences expanding the logline into a full concept",
  "acts": {
    "act1": "Setup: who, where, what triggers the story (2-3 sentences)",
    "act2": "Conflict: the central struggle, complications, turning points (3-4 sentences)",
    "act3": "Resolution: how it ends — satisfying but not predictable (2-3 sentences)"
  },
  "theme": "The central question or truth this story explores (one sentence)",
  "tone": "The emotional register — e.g. dark and suspenseful, whimsical and hopeful, gritty and intense"
}`;
}

// Step 2: Three characters — receives story context
export function characterPrompt(story: StoryOutline): string {
  return `Based on this story, create 3 compelling characters:

Story: "${story.title}" — ${story.logline}
Premise: ${story.premise}
Theme: ${story.theme}

Return ONLY this JSON (an array of exactly 3 characters):
[
  {
    "name": "Full name",
    "role": "Their role (e.g. Protagonist, Antagonist, Ally, Mentor, Wildcard)",
    "physicalDescription": "2 vivid sentences — distinctive appearance, not generic",
    "backstory": "3 sentences — formative experience that explains who they are today",
    "motivation": "What they want more than anything — specific, not vague",
    "fatalFlaw": "The internal weakness that will cause them problems — specific",
    "definingQuote": "One line of dialogue that captures their voice and worldview"
  }
]`;
}

// Step 3: World-building — receives story + characters
export function worldPrompt(
  story: StoryOutline,
  characters: Character[]
): string {
  const charNames = characters.map((c) => c.name).join(", ");
  return `Build the world for this story:

Story: "${story.title}" — ${story.logline}
Characters: ${charNames}
Tone: ${story.tone}

Return ONLY this JSON:
{
  "settingName": "The name of this world, city, era, or realm",
  "geography": "2-3 sentences: the physical environment — landscape, climate, architecture, sensory details",
  "rulesOrSystem": "2-3 sentences: what makes this world unique — its magic system, technology, political structure, or physical laws that don't exist in our world",
  "culturalFlavor": "2-3 sentences: the culture, society, customs, values — what daily life feels like here",
  "atmosphere": "One sentence capturing the dominant mood and feel of this world"
}`;
}

// Step 4: Art prompts — receives full story context
export function artPromptGenerator(
  story: StoryOutline,
  characters: Character[],
  world: WorldBuilding
): string {
  const protagonist = characters[0];
  return `Create 4 cinematic image prompts for this story. These will be used to generate concept art.

Story: "${story.title}" — ${story.logline}
Setting: ${world.settingName} — ${world.atmosphere}
Protagonist: ${protagonist.name} — ${protagonist.physicalDescription}
Tone: ${story.tone}

The 4 images should be:
1. An establishing scene — the world, a key moment, cinematic and wide
2. The protagonist ${protagonist.name} — a character portrait
3. The world/environment — a location or landscape from the story  
4. A mood/thematic image — abstract, emotional, symbolic

Return ONLY this JSON (array of exactly 4 strings):
[
  "prompt for image 1 — establishing scene (detailed, cinematic, specific art style, lighting)",
  "prompt for image 2 — character portrait of ${protagonist.name} (detailed physical description, setting, mood)",
  "prompt for image 3 — environment/location from ${world.settingName} (architecture, landscape, atmosphere)",
  "prompt for image 4 — thematic/mood image capturing '${story.theme}' (symbolic, atmospheric)"
]

Each prompt must be 2-4 sentences. Include: subject, setting, lighting style, color palette, and cinematic quality descriptors. Reference character names and setting names from the story.`;
}

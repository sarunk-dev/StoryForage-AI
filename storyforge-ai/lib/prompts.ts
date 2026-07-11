import type { StoryOutline, Character, WorldBuilding, StoryOptions } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a compact constraint string from only the options the user set. */
function buildConstraints(opts: StoryOptions): string {
  const lines: string[] = [];

  if (opts.genre    && opts.genre    !== "None") lines.push(`Genre: ${opts.genre}`);
  if (opts.tone     && opts.tone     !== "Any")  lines.push(`Tone / Mood: ${opts.tone}`);
  if (opts.length   && opts.length   !== "Any")  lines.push(`Story Scope: ${opts.length}`);
  if (opts.ending   && opts.ending   !== "Any")  lines.push(`Ending Type: ${opts.ending}`);
  if (opts.audience && opts.audience !== "Any")  lines.push(`Target Audience: ${opts.audience}`);
  if (opts.era      && opts.era      !== "Any")  lines.push(`Setting Era: ${opts.era}`);

  return lines.length ? lines.join("\n") : "";
}

// ── System prompt ────────────────────────────────────────────────────────────

export function systemPrompt(opts: StoryOptions): string {
  const constraints = buildConstraints(opts);

  const base = `You are a professional story development assistant and creative writing expert.`;

  const genreGuidance = opts.genre && opts.genre !== "None"
    ? `You are generating content for a ${opts.genre} story. Every output must unmistakably feel like ${opts.genre} — use genre-appropriate language, tropes, atmosphere, and stakes.`
    : `You are generating content for a creative story. Match the tone and genre implied by the user's concept.`;

  const toneGuidance = opts.tone && opts.tone !== "Any"
    ? `The emotional register throughout must be "${opts.tone}" — this should permeate the language, pacing, character voices, and every descriptive choice.`
    : "";

  const lengthGuidance = opts.length && opts.length !== "Any"
    ? `This is scoped as a "${opts.length}". Calibrate the scale of world-building, character depth, and act complexity accordingly.`
    : "";

  const audienceGuidance = opts.audience && opts.audience !== "Any"
    ? `The content must be appropriate for: ${opts.audience}. Adjust vocabulary complexity, thematic depth, and content accordingly.`
    : "";

  const constraintBlock = constraints
    ? `\n\nStory parameters to honour throughout ALL outputs:\n${constraints}`
    : "";

  return [base, genreGuidance, toneGuidance, lengthGuidance, audienceGuidance]
    .filter(Boolean)
    .join(" ")
    + constraintBlock
    + `\n\nBe vivid, specific, and original. Avoid clichés. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;
}

// ── Step 1: Story outline ────────────────────────────────────────────────────

export function storyPrompt(userInput: string, opts: StoryOptions): string {
  const constraints = buildConstraints(opts);
  const constraintBlock = constraints
    ? `\n\nYou MUST respect these story parameters:\n${constraints}\n`
    : "";

  // Specific ending instruction injected directly into act3 guidance
  const endingHint = opts.ending && opts.ending !== "Any"
    ? ` The ending type is "${opts.ending}" — Act III must deliver this.`
    : "";

  // Era hint for setting/world flavour
  const eraHint = opts.era && opts.era !== "Any"
    ? ` The story is set in the "${opts.era}" era — reflect this in the world and language.`
    : "";

  return `Create a compelling story concept based on this idea: "${userInput}"${constraintBlock}${eraHint}

Return ONLY this JSON (no extra text):
{
  "title": "A punchy, memorable title (3-6 words)",
  "logline": "One sentence that hooks you immediately — the concept + conflict + stakes",
  "premise": "2-3 sentences expanding the logline into a full concept",
  "acts": {
    "act1": "Setup: who, where, what triggers the story (2-3 sentences)",
    "act2": "Conflict: the central struggle, complications, turning points (3-4 sentences)",
    "act3": "Resolution: how it ends — satisfying but not predictable (2-3 sentences).${endingHint}"
  },
  "theme": "The central question or truth this story explores (one sentence)",
  "tone": "The emotional register — specific and vivid (e.g. dark and suspenseful, whimsical and hopeful)"
}`;
}

// ── Step 2: Characters ───────────────────────────────────────────────────────

export function characterPrompt(story: StoryOutline, opts: StoryOptions): string {
  const scopeNote = opts.length && opts.length !== "Any"
    ? `\nScope: ${opts.length} — calibrate character complexity to suit.`
    : "";
  const audienceNote = opts.audience && opts.audience !== "Any"
    ? `\nAudience: ${opts.audience} — keep content appropriate.`
    : "";

  return `Based on this story, create 3 compelling characters:

Story: "${story.title}" — ${story.logline}
Premise: ${story.premise}
Theme: ${story.theme}
Tone: ${story.tone}${scopeNote}${audienceNote}

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

// ── Step 3: World-building ───────────────────────────────────────────────────

export function worldPrompt(
  story: StoryOutline,
  characters: Character[],
  opts: StoryOptions
): string {
  const charNames = characters.map((c) => c.name).join(", ");
  const eraNote = opts.era && opts.era !== "Any"
    ? `\nEra: ${opts.era}` : "";
  const toneNote = opts.tone && opts.tone !== "Any"
    ? `\nMood: ${opts.tone}` : "";

  return `Build the world for this story:

Story: "${story.title}" — ${story.logline}
Characters: ${charNames}
Tone: ${story.tone}${eraNote}${toneNote}

Return ONLY this JSON:
{
  "settingName": "The name of this world, city, era, or realm",
  "geography": "2-3 sentences: the physical environment — landscape, climate, architecture, sensory details",
  "rulesOrSystem": "2-3 sentences: what makes this world unique — its magic system, technology, political structure, or physical laws",
  "culturalFlavor": "2-3 sentences: the culture, society, customs, values — what daily life feels like here",
  "atmosphere": "One sentence capturing the dominant mood and feel of this world"
}`;
}

// ── Step 4: Art prompts ──────────────────────────────────────────────────────
// These prompts are consumed directly by Pollinations.ai (FLUX model).
// Pollinations responds best to:
//   - Concrete subjects + setting first ("A lone warrior standing on...")
//   - Lighting explicitly named ("golden hour", "volumetric fog", "neon glow")
//   - Color palette stated ("muted earth tones", "deep blues and silvers")
//   - Quality boosters at the end ("hyperdetailed, 8K, concept art, artstation")
//   - NO negative prompts, NO aspect ratio in the text (handled by the API params)

export function artPromptGenerator(
  story: StoryOutline,
  characters: Character[],
  world: WorldBuilding,
  opts: StoryOptions
): string {
  const protagonist = characters[0];

  // Build context lines only for set options
  const eraCtx   = opts.era  && opts.era  !== "Any" ? ` Era: ${opts.era}.`  : "";
  const toneCtx  = opts.tone && opts.tone !== "Any" ? ` Mood: ${opts.tone}.` : "";
  const genreCtx = opts.genre && opts.genre !== "None" ? ` Genre: ${opts.genre}.` : "";

  return `Create 4 vivid image generation prompts for this story. These will be sent directly to an AI image model (Pollinations FLUX).

Story context:
- Title: "${story.title}"
- Logline: ${story.logline}
- Setting: ${world.settingName} — ${world.atmosphere}
- Protagonist: ${protagonist.name} — ${protagonist.physicalDescription}
- Story tone: ${story.tone}${toneCtx}${eraCtx}${genreCtx}
- Theme: ${story.theme}
- World geography: ${world.geography}

Rules for every prompt:
1. Start with the concrete subject and location (e.g. "A hooded figure stands at the edge of a shattered bridge over a glowing abyss")
2. Name the lighting explicitly (e.g. "bathed in crimson twilight", "cold blue moonlight", "warm golden hour rays")
3. State the color palette (e.g. "muted earth tones and deep shadows", "vivid teals and ambers")
4. End with quality keywords: "hyperdetailed, cinematic composition, concept art"
5. Each prompt must be ONE paragraph, 2-3 sentences max, no bullet points

Image 1 — ESTABLISHING SCENE (will be rendered 16:9 widescreen):
A wide cinematic shot of a key moment from the story's world. Show the scale of ${world.settingName}, the atmosphere, and a hint of the central conflict. No characters needed — focus on environment and mood.

Image 2 — CHARACTER PORTRAIT of ${protagonist.name} (will be rendered 3:4 portrait):
A dramatic close-up portrait. Use their exact physical description: ${protagonist.physicalDescription}. Convey their role (${characters[0].role}) and emotional state through lighting and expression.

Image 3 — WORLD / ENVIRONMENT (will be rendered 16:9 widescreen):
A location or landmark from ${world.settingName}. Focus on architecture, landscape, or the unique visual rules of this world: ${world.rulesOrSystem}. No characters.

Image 4 — THEMATIC MOOD (will be rendered 1:1 square):
An abstract or symbolic image embodying the story's central theme: "${story.theme}". Symbolic composition, impressionistic rather than literal. Emotional resonance over realism.

Return ONLY a JSON array of exactly 4 strings — one prompt per image, in order:
["image 1 prompt", "image 2 prompt", "image 3 prompt", "image 4 prompt"]`;
}

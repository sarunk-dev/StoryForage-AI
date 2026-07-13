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
    ? `You are generating content for a ${opts.genre} story. Every output — story, characters, world-building, and art prompts — MUST unmistakably feel like ${opts.genre}. Use genre-appropriate language, tropes, atmosphere, and stakes throughout ALL sections.`
    : `You are generating content for a creative story. Match the tone and genre implied by the user's concept across every section.`;

  const toneGuidance = opts.tone && opts.tone !== "Any"
    ? `The emotional register throughout EVERY output must be "${opts.tone}" — this must permeate the language, pacing, character voices, world atmosphere, and every descriptive choice in all sections.`
    : "";

  const lengthGuidance = opts.length && opts.length !== "Any"
    ? `This is scoped as a "${opts.length}". Calibrate the scale of world-building, character depth, and act complexity accordingly.`
    : "";

  const audienceGuidance = opts.audience && opts.audience !== "Any"
    ? `The content must be appropriate for: ${opts.audience}. Adjust vocabulary complexity, thematic depth, and content accordingly across all outputs.`
    : "";

  const eraGuidance = opts.era && opts.era !== "Any"
    ? `The setting era is "${opts.era}" — every section (story acts, characters, world, art prompts) must authentically reflect this era in language, technology, culture, and atmosphere.`
    : "";

  const consistencyRule = `CRITICAL CONSISTENCY RULE: All sections (story outline, characters, world-building, art prompts) are parts of ONE unified pitch deck. Every character name, event, location, and plot point that appears in one section MUST be consistent with all other sections. Never invent names or events that contradict what was already established in prior context you were given.`;

  const constraintBlock = constraints
    ? `\n\nUser-selected story parameters — these are NON-NEGOTIABLE and must be honoured in EVERY output:\n${constraints}`
    : "";

  return [base, genreGuidance, toneGuidance, lengthGuidance, audienceGuidance, eraGuidance, consistencyRule]
    .filter(Boolean)
    .join(" ")
    + constraintBlock
    + `\n\nBe vivid, specific, and original. Avoid clichés. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;
}

// ── Step 1: Story outline ────────────────────────────────────────────────────

export function storyPrompt(userInput: string, opts: StoryOptions): string {
  const constraints = buildConstraints(opts);
  const constraintBlock = constraints
    ? `\n\nYou MUST strictly respect these user-selected story parameters — they are NOT optional:\n${constraints}\n`
    : "";

  // Specific ending instruction injected directly into act3 guidance
  const endingHint = opts.ending && opts.ending !== "Any"
    ? ` The ending type MUST be "${opts.ending}" — Act III must unambiguously deliver this.`
    : "";

  // Era hint for setting/world flavour
  const eraHint = opts.era && opts.era !== "Any"
    ? ` The story is set in the "${opts.era}" era — every act must authentically reflect the language, technology, and culture of this era.`
    : "";

  // Genre enforcement in the story body
  const genreHint = opts.genre && opts.genre !== "None"
    ? ` This is a ${opts.genre} story — every act, the premise, the logline, and the theme must be distinctly ${opts.genre} in tone, stakes, and vocabulary.`
    : "";

  // Tone enforcement
  const toneHint = opts.tone && opts.tone !== "Any"
    ? ` The tone throughout must be "${opts.tone}" — reflect this in every sentence of every act.`
    : "";

  // Audience enforcement
  const audienceHint = opts.audience && opts.audience !== "Any"
    ? ` The story is for: ${opts.audience} — keep all content appropriate for this audience.`
    : "";

  return `Create a compelling story concept based on this user-provided idea: "${userInput}"${constraintBlock}${genreHint}${toneHint}${eraHint}${audienceHint}

GROUNDING RULE: The characters, events, and locations you name in the acts will be used as the authoritative source of truth for the characters and world-building sections that follow. Be specific — name your protagonist, antagonist, and key supporting characters inside the acts. Do not use placeholder names like "the hero" — use real character names.

Return ONLY this JSON (no extra text):
{
  "title": "A punchy, memorable title (3-6 words)",
  "logline": "One sentence that hooks you immediately — the concept + conflict + stakes",
  "premise": "2-3 sentences expanding the logline into a full concept",
  "acts": {
    "act1": "Setup: who (use real character names), where, what triggers the story (2-3 sentences)",
    "act2": "Conflict: the central struggle, complications, turning points — reference named characters (3-4 sentences)",
    "act3": "Resolution: how it ends — satisfying but not predictable — reference named characters (2-3 sentences).${endingHint}"
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
  const genreNote = opts.genre && opts.genre !== "None"
    ? `\nGenre: ${opts.genre} — character archetypes, motivations, and voices must feel unmistakably ${opts.genre}.`
    : "";
  const toneNote = opts.tone && opts.tone !== "Any"
    ? `\nTone: ${opts.tone} — each character's backstory, flaw, and quote must reflect this tone.`
    : "";
  const eraNote = opts.era && opts.era !== "Any"
    ? `\nEra: ${opts.era} — character backgrounds, occupations, and speech must be authentic to this era.`
    : "";

  return `Based on this story, create exactly 3 compelling characters.

══ STORY CONTEXT (authoritative — do not contradict) ══
Title: "${story.title}"
Logline: ${story.logline}
Premise: ${story.premise}

Act I (Setup):      ${story.acts.act1}
Act II (Conflict):  ${story.acts.act2}
Act III (Resolution): ${story.acts.act3}

Theme: ${story.theme}
Tone:  ${story.tone}${genreNote}${toneNote}${scopeNote}${audienceNote}${eraNote}

══ STRICT RULES ══
1. The 3 characters you create MUST be the actual named people who appear in the acts above. Read the acts carefully and extract the real character names from them.
2. Do NOT invent new names that do not appear in the acts. Do NOT rename characters.
3. Each character's backstory, motivation, and fatal flaw must be consistent with what happens to them in the acts.
4. Assign roles accurately: the person the story centres on is "Protagonist"; the primary opposing force is "Antagonist"; close allies are "Ally" or "Mentor"; unpredictable characters are "Wildcard".
5. The definingQuote must sound like something THIS character — given their specific backstory and arc — would actually say. It must reflect the story's tone.

Return ONLY this JSON (an array of exactly 3 characters):
[
  {
    "name": "Full name — must match a name from the acts above",
    "role": "Their role (Protagonist | Antagonist | Ally | Mentor | Wildcard)",
    "physicalDescription": "2 vivid sentences — distinctive appearance that fits the story's genre and era, not generic",
    "backstory": "3 sentences — formative experience that explains who they are today, consistent with the acts",
    "motivation": "What they want more than anything — specific, tied to the story events above",
    "fatalFlaw": "The internal weakness that creates problems for them in the acts — specific",
    "definingQuote": "One line of dialogue that captures their voice, worldview, and the story's tone"
  }
]`;
}

// ── Step 3: World-building ───────────────────────────────────────────────────

export function worldPrompt(
  story: StoryOutline,
  characters: Character[],
  opts: StoryOptions
): string {
  // Find protagonist for grounding — prefer role match, fall back to index 0
  const protagonist = characters.find(
    (c) => c.role.toLowerCase().includes("protagonist")
  ) ?? characters[0];

  const charSummaries = characters
    .map((c) => `  - ${c.name} (${c.role}): ${c.motivation}`)
    .join("\n");

  const eraNote = opts.era && opts.era !== "Any"
    ? `\nEra: ${opts.era} — all geography, architecture, technology, and culture MUST authentically reflect this era.`
    : "";
  const toneNote = opts.tone && opts.tone !== "Any"
    ? `\nMood: ${opts.tone} — the world's atmosphere, dangers, and sensory details must embody this tone.`
    : "";
  const genreNote = opts.genre && opts.genre !== "None"
    ? `\nGenre: ${opts.genre} — the world's rules, culture, and geography must feel distinctly ${opts.genre}.`
    : "";
  const audienceNote = opts.audience && opts.audience !== "Any"
    ? `\nAudience: ${opts.audience} — keep world details appropriate.`
    : "";

  return `Build the world for this story.

══ STORY CONTEXT (authoritative — do not contradict) ══
Title: "${story.title}"
Logline: ${story.logline}

Act I (Setup):        ${story.acts.act1}
Act II (Conflict):    ${story.acts.act2}
Act III (Resolution): ${story.acts.act3}

Theme: ${story.theme}
Tone:  ${story.tone}

Characters in this world:
${charSummaries}

Protagonist: ${protagonist.name}${genreNote}${toneNote}${eraNote}${audienceNote}

══ STRICT RULES ══
1. The setting name, geography, and culture must be consistent with the locations and events described in the acts above.
2. The "rulesOrSystem" must explain the specific mechanics (magic, technology, political structure, or physical laws) that drive the conflict in Act II.
3. All character names referenced in the world description must exactly match the names from the acts and character list above — do not invent new names.
4. The atmosphere must match the story's tone exactly: "${story.tone}".

Return ONLY this JSON:
{
  "settingName": "The name of this world, city, era, or realm — consistent with the acts",
  "geography": "2-3 sentences: the physical environment — landscape, climate, architecture, sensory details that appear in the story",
  "rulesOrSystem": "2-3 sentences: what makes this world unique — the specific system (magic, technology, political structure, or physical laws) that creates the conflict in the acts",
  "culturalFlavor": "2-3 sentences: the culture, society, customs, values — what daily life feels like for characters like ${protagonist.name}",
  "atmosphere": "One sentence capturing the dominant mood that permeates the story — must match tone: ${story.tone}"
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
  // Find protagonist by role first — do NOT blindly use index 0
  const protagonist = characters.find(
    (c) => c.role.toLowerCase().includes("protagonist")
  ) ?? characters[0];

  // Find antagonist for a richer image 4
  const antagonist = characters.find(
    (c) => c.role.toLowerCase().includes("antagonist")
  );

  const genreStyleNote = opts.genre && opts.genre !== "None"
    ? `\nThe art style must feel unmistakably ${opts.genre} — use genre-specific visual language, color palettes, and mood.`
    : "";

  const toneColorNote = opts.tone && opts.tone !== "Any"
    ? `\nOverall color palette and lighting must reflect the tone: "${opts.tone}".`
    : "";

  const eraVisualNote = opts.era && opts.era !== "Any"
    ? `\nArchitecture, clothing, technology, and props must visually match the era: "${opts.era}".`
    : "";

  return `Create 4 cinematic image prompts for this story. These will be fed directly to an AI image generator (FLUX model).

══ STORY CONTEXT ══
Title: "${story.title}"
Logline: ${story.logline}
Setting: ${world.settingName} — ${world.atmosphere}
Protagonist: ${protagonist.name} — ${protagonist.physicalDescription}
${antagonist ? `Antagonist: ${antagonist.name} — ${antagonist.physicalDescription}` : ""}
Act I:   ${story.acts.act1}
Act II:  ${story.acts.act2}
Act III: ${story.acts.act3}
Tone: ${story.tone}${genreStyleNote}${toneColorNote}${eraVisualNote}

══ STRICT RULES ══
1. Every prompt must reference real names, locations, and events from the story context above — no generic placeholders.
2. The protagonist in image 2 MUST be ${protagonist.name} using the physical description above.
3. The setting in image 3 MUST be from ${world.settingName} as described in the acts.
4. All 4 images must feel like they belong to the SAME story — consistent visual language, palette, and mood.

The 4 images must be:
1. An establishing scene — a key cinematic moment from the acts, wide shot, shows the world
2. A character portrait of ${protagonist.name} — based on their physical description above, in their world
3. A key location from ${world.settingName} — a specific place mentioned in the acts
4. A thematic/mood image — symbolic, abstract, capturing the theme: "${story.theme}"

Return ONLY this JSON (array of exactly 4 strings):
[
  "prompt for image 1 — establishing scene: a specific moment from the acts, cinematic wide shot, lighting style, color palette matching tone, hyperdetailed concept art",
  "prompt for image 2 — portrait of ${protagonist.name}: [their physical description], setting from ${world.settingName}, mood matching '${story.tone}', hyperdetailed, dramatic lighting",
  "prompt for image 3 — key location in ${world.settingName}: specific place from the acts, architectural/landscape details, atmosphere matching '${story.tone}', concept art quality",
  "prompt for image 4 — thematic mood image for '${story.theme}': symbolic composition, color palette matching tone '${story.tone}', atmospheric, painterly"
]

Each prompt must be 2-4 sentences. Always include: specific subject, named setting, lighting style, color palette, and quality descriptors (hyperdetailed, 8K, concept art, cinematic).`;
  void opts; // genre/tone handled above via notes; replicate.ts also applies genre style
}

// ── Step 4b: Single art prompt (for per-image regeneration) ──────────────────
// Asks Granite to produce exactly ONE image prompt for the given slot index,
// using the current story/characters/world so the result is always in sync.

const SLOT_ROLES = [
  "An establishing scene — a key cinematic moment from the acts, wide shot, shows the world",
  "A character portrait of the protagonist — based on their physical description, in their world",
  "A key location from the world's setting — a specific place mentioned in the acts",
  "A thematic/mood image — symbolic, abstract, capturing the central theme of the story",
] as const;

export function singleArtPrompt(
  index: number,
  story: StoryOutline,
  characters: Character[],
  world: WorldBuilding,
  opts: StoryOptions
): string {
  const protagonist = characters.find(
    (c) => c.role.toLowerCase().includes("protagonist")
  ) ?? characters[0];

  const antagonist = characters.find(
    (c) => c.role.toLowerCase().includes("antagonist")
  );

  const genreStyleNote = opts.genre && opts.genre !== "None"
    ? `\nThe art style must feel unmistakably ${opts.genre} — use genre-specific visual language, color palettes, and mood.`
    : "";

  const toneColorNote = opts.tone && opts.tone !== "Any"
    ? `\nOverall color palette and lighting must reflect the tone: "${opts.tone}".`
    : "";

  const eraVisualNote = opts.era && opts.era !== "Any"
    ? `\nArchitecture, clothing, technology, and props must visually match the era: "${opts.era}".`
    : "";

  // Per-slot specific instruction with live data embedded
  const slotInstructions = [
    `An establishing scene — pick a specific cinematic moment from the acts below, wide shot, shows the world of ${world.settingName}`,
    `A character portrait of ${protagonist.name} — use this exact physical description: "${protagonist.physicalDescription}" — place them in ${world.settingName}, mood matching "${story.tone}"`,
    `A key location in ${world.settingName} — pick a specific place mentioned in the acts, show its architecture/landscape, atmosphere matching "${story.tone}"`,
    `A thematic mood image for the theme "${story.theme}" — symbolic composition, color palette matching tone "${story.tone}", atmospheric, painterly`,
  ];

  return `Create ONE cinematic image prompt for this story. This prompt will be fed directly to an AI image generator (FLUX model).

══ STORY CONTEXT ══
Title: "${story.title}"
Logline: ${story.logline}
Setting: ${world.settingName} — ${world.atmosphere}
Protagonist: ${protagonist.name} — ${protagonist.physicalDescription}
${antagonist ? `Antagonist: ${antagonist.name} — ${antagonist.physicalDescription}` : ""}
Act I:   ${story.acts.act1}
Act II:  ${story.acts.act2}
Act III: ${story.acts.act3}
Theme: ${story.theme}
Tone: ${story.tone}${genreStyleNote}${toneColorNote}${eraVisualNote}

══ IMAGE TO PRODUCE ══
${slotInstructions[index]}

══ RULES ══
1. Reference real names, locations, and events from the story context above — no generic placeholders.
2. Include: specific subject, named setting, lighting style, color palette, and quality descriptors (hyperdetailed, 8K, concept art, cinematic).
3. The prompt must be 2–4 sentences.

Return ONLY a single JSON string value — NOT an object, NOT an array, NOT wrapped in a key. Just the quoted string itself, starting with " and ending with ". Example of the exact format required:
"A lone warrior standing on the cliffs of Ashenveil, golden-hour light cutting through storm clouds, muted earth tones and deep crimson, hyperdetailed concept art, cinematic."`;
}

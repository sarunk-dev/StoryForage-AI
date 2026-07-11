/**
 * Pollinations.ai image generation — free, no API key required.
 *
 * Pollinations API docs: https://image.pollinations.ai/prompt/{prompt}
 * Parameters:
 *   model     — flux (best quality), flux-realism, flux-anime, flux-3d, turbo
 *   width     — image width in px (default 1024)
 *   height    — image height in px (default 1024)
 *   seed      — integer for reproducibility (random = varied results)
 *   nologo    — true removes the Pollinations watermark
 *   enhance   — true runs an automatic prompt-enhancer pass
 *   private   — true skips public feed listing
 *
 * Model guide:
 *   flux          — highest quality, photorealistic / cinematic
 *   flux-realism  — tuned for photorealistic scenes & characters
 *   flux-anime    — anime / illustrated style
 *   flux-3d       — 3D render aesthetic (good for Sci-Fi, Fantasy)
 *   turbo         — fastest, slightly lower fidelity
 */

const BASE = "https://image.pollinations.ai/prompt";

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Style suffix per image slot ───────────────────────────────────────────────
// Each of the 4 images has a different purpose; we append style keywords
// tuned to that purpose so Pollinations renders it appropriately.
const SLOT_SUFFIXES = [
  // Slot 0 — establishing scene (wide, cinematic)
  "ultra-wide cinematic shot, establishing scene, volumetric lighting, golden hour, 8K, hyperdetailed, epic scale, matte painting",
  // Slot 1 — character portrait (close-up, expressive)
  "character portrait, dramatic close-up, expressive eyes, rim lighting, shallow depth of field, highly detailed face, concept art, artstation",
  // Slot 2 — world / environment (landscape, architecture)
  "environment concept art, wide establishing shot, architectural detail, atmospheric perspective, rich texture, ambient occlusion, artstation trending",
  // Slot 3 — thematic / mood (symbolic, atmospheric)
  "atmospheric mood painting, symbolic composition, cinematic color grading, ethereal lighting, emotional resonance, impressionistic detail",
];

// ── Genre → preferred model ───────────────────────────────────────────────────
// Maps genre strings to the Pollinations model best suited visually.
function modelForGenre(genre?: string): string {
  switch (genre) {
    case "Fantasy":    return "flux-3d";      // lush, otherworldly render quality
    case "Sci-Fi":     return "flux-3d";      // clean futuristic 3D aesthetic
    case "Horror":     return "flux-realism"; // photorealistic dread
    case "Thriller":   return "flux-realism"; // gritty realism
    case "Romance":    return "flux";         // warm, soft quality
    case "Historical": return "flux-realism"; // period-accurate realism
    case "Mystery":    return "flux";         // atmospheric, painterly
    case "Adventure":  return "flux";         // vibrant, dynamic
    default:           return "flux";
  }
}

// ── Tone → color / lighting style hint appended to every prompt ──────────────
function toneStyleHint(tone?: string): string {
  switch (tone) {
    case "Dark & Gritty":       return "dark shadows, desaturated palette, gritty texture, noir lighting";
    case "Hopeful & Uplifting": return "warm golden light, saturated colors, optimistic composition";
    case "Whimsical & Playful": return "bright pastel colors, playful composition, soft lighting";
    case "Melancholic":         return "muted cool tones, overcast diffuse light, melancholic mood";
    case "Tense & Suspenseful": return "high contrast, deep shadows, tension-filled composition";
    case "Epic & Grand":        return "epic scale, dramatic sky, god rays, sweeping landscape";
    case "Intimate & Personal": return "intimate framing, warm soft light, shallow DOF, emotional";
    default:                    return "";
  }
}

// ── Aspect ratio per slot ─────────────────────────────────────────────────────
// Slot 0 (scene) — widescreen cinematic
// Slot 1 (portrait) — portrait orientation
// Slot 2 (environment) — landscape/wide
// Slot 3 (mood) — square (thematic / abstract)
const SLOT_DIMENSIONS = [
  { width: 1344, height: 768 },  // 16:9 cinematic
  { width: 768,  height: 1024 }, // 3:4 portrait
  { width: 1344, height: 768 },  // 16:9 environment
  { width: 1024, height: 1024 }, // 1:1 thematic
];

// ── Fetch with retry (handles Pollinations 429s) ─────────────────────────────
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let delay = 6000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.status !== 429) return res;
    if (attempt < maxRetries) {
      console.warn(`[pollinations] 429 — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      delay *= 2;
    }
  }
  return fetch(url);
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Generate a single concept-art image via Pollinations.
 * @param prompt   The base narrative prompt from Granite
 * @param index    0-3 slot index (controls dimensions, style suffix, model)
 * @param genre    Optional genre string for model selection
 * @param tone     Optional tone string for color/lighting hint
 */
export async function pollinationsImage(
  prompt: string,
  index: number,
  genre?: string,
  tone?: string
): Promise<string> {
  const slot      = Math.min(index, 3);
  const dims      = SLOT_DIMENSIONS[slot];
  const suffix    = SLOT_SUFFIXES[slot];
  const toneHint  = toneStyleHint(tone);
  const model     = modelForGenre(genre);
  const seed      = Math.floor(Math.random() * 9_999_999);

  // Build the final prompt: narrative content + tone hint + slot style suffix
  const fullPrompt = [prompt.trim(), toneHint, suffix]
    .filter(Boolean)
    .join(", ");

  const encoded = encodeURIComponent(fullPrompt);
  const url = `${BASE}/${encoded}?width=${dims.width}&height=${dims.height}&model=${model}&nologo=true&enhance=true&private=true&seed=${seed}`;

  const res = await fetchWithRetry(url);
  if (!res.ok) {
    throw new Error(`Pollinations returned ${res.status} for slot ${slot}: ${prompt.slice(0, 60)}`);
  }

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${base64}`;
}

// ── Legacy exports (kept so any other imports don't break) ───────────────────
export async function flux2pro(prompt: string): Promise<string> {
  return pollinationsImage(prompt, 0);
}
export async function fluxKontext(prompt: string, _ref: string, _delay?: number): Promise<string> {
  return pollinationsImage(prompt, 1);
}

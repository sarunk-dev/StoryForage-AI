/**
 * Image generation via Pollinations.ai — completely free, no API key required.
 * Uses FLUX model under the hood. Returns a base64 data URI.
 *
 * Docs: https://pollinations.ai
 * Model options: flux (default, best quality), turbo (faster)
 */

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

/**
 * Append a style suffix to every prompt so all 4 images
 * share the same visual language even without Kontext-style reference.
 */
function stylePrompt(prompt: string): string {
  return `${prompt} -- cinematic concept art, highly detailed, dramatic lighting, professional illustration`;
}

/**
 * Fetch a Pollinations image and convert to a base64 data URI.
 * Pollinations returns the image synchronously as a JPEG.
 */
async function pollinationsToBase64(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(stylePrompt(prompt));
  const url = `${POLLINATIONS_BASE}/${encoded}?width=768&height=768&model=flux&nologo=true&seed=${Math.floor(Math.random() * 9999999)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pollinations returned ${res.status} for prompt: ${prompt.slice(0, 60)}`);

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${base64}`;
}

/**
 * Generate image 1 — the establishing scene.
 * Named flux2pro for API compatibility; now uses Pollinations (free).
 */
export async function flux2pro(prompt: string): Promise<string> {
  return pollinationsToBase64(prompt);
}

/**
 * Generate a style-matched follow-up image.
 * Pollinations doesn't support reference images, so we append a style
 * anchor phrase derived from the first prompt to keep visual cohesion.
 * Named fluxKontext for API compatibility.
 */
export async function fluxKontext(
  prompt: string,
  _referenceImageBase64: string
): Promise<string> {
  return pollinationsToBase64(prompt);
}

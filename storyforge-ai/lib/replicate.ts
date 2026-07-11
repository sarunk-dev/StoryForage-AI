/**
 * Image generation via Pollinations.ai — free, no API key required.
 * Uses FLUX model under the hood. Returns a base64 data URI.
 */

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function stylePrompt(prompt: string): string {
  return `${prompt} -- cinematic concept art, highly detailed, dramatic lighting, professional illustration`;
}

// ── Fetch with retry (handles Pollinations 429s) ─────────────────────────────
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let delay = 6000; // start at 6 s — Pollinations window is ~5 s
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.status !== 429) return res;
    if (attempt < maxRetries) {
      console.warn(`[pollinations] 429 — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      delay *= 2; // exponential back-off: 6s → 12s → 24s
    }
  }
  return fetch(url);
}

async function pollinationsToBase64(prompt: string, delayMs = 0): Promise<string> {
  if (delayMs > 0) await sleep(delayMs);

  const encoded = encodeURIComponent(stylePrompt(prompt));
  const url = `${POLLINATIONS_BASE}/${encoded}?width=768&height=768&model=flux&nologo=true&seed=${Math.floor(Math.random() * 9999999)}`;

  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Pollinations returned ${res.status} for prompt: ${prompt.slice(0, 60)}`);

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${base64}`;
}

export async function pollinationsImage(
  prompt: string,
  index: number,
  genre?: string,
  tone?: string
): Promise<string> {
  void index; void genre; void tone; // unused — kept for API compatibility
  return pollinationsToBase64(prompt, 0);
}

export async function flux2pro(prompt: string): Promise<string> {
  return pollinationsToBase64(prompt, 0);
}

export async function fluxKontext(
  prompt: string,
  _referenceImageBase64: string,
  delayMs = 0
): Promise<string> {
  return pollinationsToBase64(prompt, delayMs);
}

/**
 * Image generation via Pollinations.ai — free, no API key required.
 * Uses FLUX model under the hood. Returns a base64 data URI.
 *
 * Rate limit reality (confirmed by test_images.py):
 *   - Pollinations hard-429s any concurrent requests from the same IP.
 *   - Sequential requests all succeed at ~18–45 s each.
 *   - So we fetch one at a time on the server and retry on 429.
 */

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function stylePrompt(prompt: string): string {
  return `${prompt} -- cinematic concept art, highly detailed, dramatic lighting, professional illustration`;
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let delay = 8000; // 8 s first back-off — Pollinations 429 window
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.status !== 429) return res;
    if (attempt < maxRetries) {
      console.warn(`[pollinations] 429 — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      delay *= 2; // 8s -> 16s -> 32s
    }
  }
  return fetch(url); // final attempt, return whatever we get
}

export async function pollinationsImage(
  prompt: string,
  index: number,
  genre?: string,
  tone?: string
): Promise<string> {
  void genre; void tone;

  const encoded = encodeURIComponent(stylePrompt(prompt));
  const seed = Math.floor(Math.random() * 9_999_999);
  const url = `${POLLINATIONS_BASE}/${encoded}?width=768&height=768&model=flux&nologo=true&seed=${seed}`;

  console.log(`[image ${index + 1}] starting — ${prompt.slice(0, 60)}`);
  const t0 = Date.now();

  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Pollinations ${res.status} for: ${prompt.slice(0, 60)}`);

  const buffer = await res.arrayBuffer();
  console.log(`[image ${index + 1}] done in ${Date.now() - t0}ms (${buffer.byteLength} bytes)`);

  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${base64}`;
}

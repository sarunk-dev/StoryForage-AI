import { WatsonXAI } from "@ibm-cloud/watsonx-ai";
import { IamAuthenticator } from "ibm-cloud-sdk-core";

let client: WatsonXAI | null = null;

function getClient(): WatsonXAI {
  if (client) return client;

  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;
  const serviceUrl =
    process.env.WATSONX_SERVICE_URL || "https://us-south.ml.cloud.ibm.com";

  if (!apiKey) throw new Error("WATSONX_API_KEY is not set");
  if (!projectId) throw new Error("WATSONX_PROJECT_ID is not set");

  client = WatsonXAI.newInstance({
    version: "2024-05-31",
    serviceUrl,
    authenticator: new IamAuthenticator({ apikey: apiKey }),
  });

  return client;
}

/**
 * Call IBM Granite 4 via the chat completions API (/ml/v1/text/chat).
 * granite-4-h-small is a chat model — the old generateText API returns empty strings.
 * All prompt templates request JSON output — parse in the caller.
 *
 * Pass `signal` (from the incoming NextRequest) so if the client disconnects
 * mid-request the upstream IBM connection is aborted immediately, freeing
 * the concurrent-request slot on the free-tier plan.
 */
export async function generateText(
  userPrompt: string,
  systemPrompt: string,
  options: { maxTokens?: number; signal?: AbortSignal } = {}
): Promise<string> {
  const watsonx = getClient();
  const projectId = process.env.WATSONX_PROJECT_ID!;

  // `signal` is a first-class param on all WatsonX SDK methods —
  // validators.js line 30 includes it in commonParams, and vml_v1.js
  // line 2226 wires it to axiosOptions internally. Passing it here causes
  // Axios to abort the IBM HTTP call when the client disconnects, freeing
  // the concurrent-request slot on the free-tier plan.
  const response = await watsonx.textChat({
    modelId: "ibm/granite-4-h-small",
    projectId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: options.maxTokens ?? 2048,
    temperature: 0.7,
    topP: 0.9,
    ...(options.signal ? { signal: options.signal } : {}),
  });

  const content = response.result?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(
      `Granite returned no content. finish_reason: ${response.result?.choices?.[0]?.finish_reason}`
    );
  }

  return content.trim();
}

/**
 * Parse JSON from Granite output robustly.
 * Strips markdown code fences and extracts the outermost JSON object/array.
 */
export function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip ```json ... ``` or ``` ... ``` fences (including multi-line)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

  // Find first { or [ and last } or ]
  const firstBrace = cleaned.search(/[{[]/);
  const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));

  // Find first and last " — handles bare JSON string responses e.g. "A lone warrior..."
  const firstQuote = cleaned.indexOf('"');
  const lastQuote  = cleaned.lastIndexOf('"');

  // Prefer object/array if present; fall back to bare string literal
  if (firstBrace !== -1 && lastBrace !== -1) {
    // If a quote starts before the brace, Granite may have wrapped the value in a
    // string — try the string extraction first, then fall through to object/array
    if (firstQuote !== -1 && firstQuote < firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstQuote, lastQuote + 1)) as T;
      } catch {
        // fall through to object/array parse
      }
    }
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
  }

  // No object or array found — try bare quoted string
  if (firstQuote !== -1 && lastQuote > firstQuote) {
    return JSON.parse(cleaned.slice(firstQuote, lastQuote + 1)) as T;
  }

  throw new Error(`No JSON found in response: ${cleaned.slice(0, 300)}`);
}

/**
 * Generate JSON with automatic retry on parse failure.
 * On first failure, sends a correction message and tries once more.
 */
export async function generateJSON<T>(
  userPrompt: string,
  systemPrompt: string,
  options: { maxTokens?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const raw = await generateText(userPrompt, systemPrompt, options);

  try {
    return parseJSON<T>(raw);
  } catch {
    const retryPrompt = `${userPrompt}

IMPORTANT: Your previous response could not be parsed as JSON. Return ONLY valid JSON — no explanation, no markdown, no code fences. Start your response with {, [, or " (for a plain string value).`;

    const retryRaw = await generateText(retryPrompt, systemPrompt, options);
    return parseJSON<T>(retryRaw);
  }
}

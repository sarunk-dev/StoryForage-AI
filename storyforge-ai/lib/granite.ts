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
 */
export async function generateText(
  userPrompt: string,
  systemPrompt: string,
  options: { maxTokens?: number } = {}
): Promise<string> {
  const watsonx = getClient();
  const projectId = process.env.WATSONX_PROJECT_ID!;

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

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON found in response: ${cleaned.slice(0, 300)}`);
  }

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr) as T;
}

/**
 * Generate JSON with automatic retry on parse failure.
 * On first failure, sends a correction message and tries once more.
 */
export async function generateJSON<T>(
  userPrompt: string,
  systemPrompt: string,
  options: { maxTokens?: number } = {}
): Promise<T> {
  const raw = await generateText(userPrompt, systemPrompt, options);

  try {
    return parseJSON<T>(raw);
  } catch {
    const retryPrompt = `${userPrompt}

IMPORTANT: Your previous response could not be parsed as JSON. Return ONLY valid JSON — no explanation, no markdown, no code fences. Start your response with { or [.`;

    const retryRaw = await generateText(retryPrompt, systemPrompt, options);
    return parseJSON<T>(retryRaw);
  }
}

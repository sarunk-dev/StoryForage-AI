import { WatsonXAI } from "@ibm-cloud/watsonx-ai";
import { IamAuthenticator } from "ibm-cloud-sdk-core";

let client: WatsonXAI | null = null;

function getClient(): WatsonXAI {
  if (client) return client;

  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;
  const serviceUrl =
    process.env.WATSONX_SERVICE_URL ||
    "https://us-south.ml.cloud.ibm.com";

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
 * Call IBM Granite and return the raw text response.
 * All prompt templates request JSON output — parse in the caller.
 */
export async function generateText(
  userPrompt: string,
  _systemPrompt: string,
  options: { maxTokens?: number } = {}
): Promise<string> {
  const watsonx = getClient();
  const projectId = process.env.WATSONX_PROJECT_ID!;

  const response = await watsonx.generateText({
    modelId: "ibm/granite-4-h-small",
    projectId,
    input: userPrompt,
    parameters: {
      max_new_tokens: options.maxTokens ?? 2048,
      temperature: 0.7,
      top_p: 0.9,
      repetition_penalty: 1.1,
    },
  });

  // The SDK returns results array
  const results = response.result?.results;
  if (!results || results.length === 0) {
    throw new Error("Granite returned no results");
  }

  return results[0].generated_text?.trim() ?? "";
}

/**
 * Parse JSON from Granite output robustly.
 * Granite may wrap JSON in markdown code fences — strip them.
 */
export function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip ```json ... ``` or ``` ... ``` fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

  // Find first { or [ and last } or ]
  const firstBrace = cleaned.search(/[[{]/);
  const lastBrace = Math.max(
    cleaned.lastIndexOf("}"),
    cleaned.lastIndexOf("]")
  );

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON found in response: ${cleaned.slice(0, 200)}`);
  }

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr) as T;
}

/**
 * Generate with automatic retry on JSON parse failure.
 * On first failure, appends a correction instruction and tries once more.
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
    // One retry with explicit correction
    const retryPrompt = `${userPrompt}

IMPORTANT: Your previous response could not be parsed as JSON. Return ONLY valid JSON — no explanation, no markdown, no code fences. Start your response with { or [.`;

    const retryRaw = await generateText(retryPrompt, systemPrompt, options);
    return parseJSON<T>(retryRaw);
  }
}

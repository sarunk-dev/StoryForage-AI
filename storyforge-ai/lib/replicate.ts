import Replicate from "replicate";

let replicateClient: Replicate | null = null;

function getClient(): Replicate {
  if (replicateClient) return replicateClient;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
  replicateClient = new Replicate({ auth: token });
  return replicateClient;
}

/**
 * Convert a URL (from Replicate output) to a base64 data URI.
 * This avoids CORS issues when rendering images in html2canvas for PDF export.
 */
async function urlToBase64DataUri(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${base64}`;
}

/**
 * Generate a base image using Flux 2 Pro.
 * Returns a base64 data URI.
 * Use Flux Schnell during development by setting DEV_IMAGE_MODEL=schnell in .env.local
 */
export async function flux2pro(prompt: string): Promise<string> {
  const client = getClient();

  // Allow cheap model swap for dev iterations
  const model =
    process.env.DEV_IMAGE_MODEL === "schnell"
      ? "black-forest-labs/flux-schnell"
      : "black-forest-labs/flux-2-pro";

  const output = await client.run(model as `${string}/${string}`, {
    input: {
      prompt,
      aspect_ratio: "1:1",
      output_format: "png",
      output_quality: 90,
      safety_tolerance: 2,
      ...(model === "black-forest-labs/flux-2-pro"
        ? { resolution: "1 MP" }
        : {}),
    },
  });

  // Flux 2 Pro returns a single URL object; Flux Schnell returns an array
  let imageUrl: string;
  if (Array.isArray(output)) {
    imageUrl = output[0] as string;
  } else {
    // ReadableStream or URL object from Flux 2 Pro
    const urlObj = output as { url: () => string | URL };
    imageUrl =
      typeof urlObj.url === "function"
        ? urlObj.url().toString()
        : String(output);
  }

  return await urlToBase64DataUri(imageUrl);
}

/**
 * Generate a style-matched image using Flux Kontext Pro.
 * referenceImageBase64 is a data URI (data:image/png;base64,...) from flux2pro().
 * Returns a base64 data URI.
 */
export async function fluxKontext(
  prompt: string,
  referenceImageBase64: string
): Promise<string> {
  const client = getClient();

  const output = await client.run("black-forest-labs/flux-kontext-pro", {
    input: {
      prompt,
      input_image: referenceImageBase64,
      aspect_ratio: "match_input_image",
      output_format: "png",
      prompt_upsampling: false,
      safety_tolerance: 2,
    },
  });

  // Flux Kontext Pro returns a URL object
  const urlObj = output as { url: () => string | URL };
  const imageUrl =
    typeof urlObj.url === "function"
      ? urlObj.url().toString()
      : String(output);

  return await urlToBase64DataUri(imageUrl);
}

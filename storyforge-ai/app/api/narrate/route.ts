import { NextRequest, NextResponse } from "next/server";

// Allow up to 30 s for this route — ElevenLabs TTS can take 5–10 s
export const maxDuration = 30;

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

// ── Model ────────────────────────────────────────────────────────────────────
// eleven_multilingual_v2: "most life-like, emotionally rich" — supports
// style (expressiveness) and speaker_boost. Best for audiobooks / voice-overs.
const MODEL_ID = "eleven_multilingual_v2";

// ── Voice roster (hardcoded IDs from live account — no fetch needed) ─────────
// Chosen by use_case label and character description for storytelling fit.
const VOICES: Record<string, { id: string; description: string }> = {
  george: { id: "JBFqnCBsd6RMkjVDRZzb", description: "Warm, Captivating Storyteller — narrative_story" },
  harry:  { id: "SOYHLrjzK2X1ezoPC6cr", description: "Fierce, Intense — characters_animation"          },
  brian:  { id: "nPczCjzI2devNBz1zQrb", description: "Deep, Resonant, Comforting"                       },
  sarah:  { id: "EXAVITQu4vr4xnSDxMaL", description: "Mature, Reassuring — entertainment_tv"            },
  lily:   { id: "pFZP5JQG7iQjIQuC4Bku", description: "Velvety Actress — informative/dramatic"            },
  daniel: { id: "onwK4e9ZLuTAKqWW03F9", description: "Steady Broadcaster — clear fallback"               },
  callum: { id: "N2lVS1w4EtoT3dr4eOWO", description: "Husky Trickster — mysterious/fantasy"              },
  charlie:{ id: "IKne3meq5aSn9XLyUdCD", description: "Deep, Confident, Energetic — adventure"            },
};

// ── Genre → voice + base voice_settings ─────────────────────────────────────
// stability:        lower (0.25–0.40) = more emotional/dynamic
//                   higher (0.55–0.70) = steadier/authoritative
// similarity_boost: 0.85 keeps the voice character clear
// style:            0.0–1.0 expressiveness injection (multilingual_v2 only)
// speaker_boost:    true = clarity boost (multilingual_v2 only)

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface GenreProfile {
  voiceKey: string;
  settings: VoiceSettings;
}

const GENRE_PROFILES: Record<string, GenreProfile> = {
  Fantasy: {
    voiceKey: "george",
    settings: { stability: 0.32, similarity_boost: 0.85, style: 0.50, use_speaker_boost: true },
  },
  "Sci-Fi": {
    voiceKey: "brian",
    settings: { stability: 0.42, similarity_boost: 0.85, style: 0.38, use_speaker_boost: true },
  },
  Thriller: {
    voiceKey: "harry",
    settings: { stability: 0.28, similarity_boost: 0.88, style: 0.60, use_speaker_boost: true },
  },
  Horror: {
    voiceKey: "harry",
    settings: { stability: 0.25, similarity_boost: 0.88, style: 0.65, use_speaker_boost: true },
  },
  Romance: {
    voiceKey: "sarah",
    settings: { stability: 0.38, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true },
  },
  Historical: {
    voiceKey: "george",
    settings: { stability: 0.48, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
  },
  Mystery: {
    voiceKey: "callum",
    settings: { stability: 0.30, similarity_boost: 0.87, style: 0.55, use_speaker_boost: true },
  },
  Adventure: {
    voiceKey: "charlie",
    settings: { stability: 0.30, similarity_boost: 0.85, style: 0.55, use_speaker_boost: true },
  },
  None: {
    voiceKey: "daniel",
    settings: { stability: 0.40, similarity_boost: 0.85, style: 0.42, use_speaker_boost: true },
  },
};

// ── Per-act settings overlay ─────────────────────────────────────────────────
// Act I (setup):       calm, measured — slight stability bump, lower style
// Act II (conflict):   heightened tension — most dynamic, highest style
// Act III (resolution):tapering — slightly more stable than conflict
const ACT_OVERLAYS: Record<string, Partial<VoiceSettings>> = {
  act1: { stability: +0.06, style: -0.08 },   // relative adjustments
  act2: { stability: -0.05, style: +0.10 },
  act3: { stability: +0.03, style: -0.04 },
};

function blendSettings(
  base: VoiceSettings,
  overlay: Partial<VoiceSettings>
): VoiceSettings {
  return {
    stability:        clamp((base.stability        + (overlay.stability        ?? 0)), 0.20, 0.75),
    similarity_boost: clamp((base.similarity_boost + (overlay.similarity_boost ?? 0)), 0.70, 0.95),
    style:            clamp((base.style            + (overlay.style            ?? 0)), 0.00, 0.90),
    use_speaker_boost: base.use_speaker_boost,
  };
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// ── Text pre-processing ───────────────────────────────────────────────────────
// ElevenLabs reads punctuation as prosody cues:
//   comma      → short breath pause
//   period     → sentence-end drop
//   ellipsis   → contemplative hold
//   em-dash    → sharp beat/break
//   exclamation→ emphasis rise
// We enrich the raw act text to feel like voiced narration, not a flat read.
function prepareNarrationText(rawText: string, actLabel: string, tone: string): string {
  let text = rawText.trim();

  // Ensure sentences end cleanly (add period if last char is a letter)
  if (/[a-zA-Z]$/.test(text)) text += ".";

  // Replace double spaces
  text = text.replace(/  +/g, " ");

  // Soften abrupt transitions — "But" / "And" / "Then" at sentence start
  // gets a short pause beat before it for a storytelling feel
  text = text.replace(/([.!?])\s+(But|And|Then|Yet|So|Now|Here|There)\s/g, "$1 — $2 ");

  // Wrap in a brief narrator framing — tells the model it's a storytelling
  // read, which activates the narrative_story prosody in George's voice etc.
  // We omit the wrapper from the actual audio by making it a stage direction
  // that ElevenLabs ignores (leading context helps prosody even if brief).
  const intro = actLabel === "act1"
    ? ""          // Act I: no intro, just let it open naturally
    : actLabel === "act2"
    ? ""          // Act II: same — raw tension
    : "";         // Act III: same

  return (intro + text).trim();
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { text, genre, actKey, tone } = (await req.json()) as {
      text: string;
      genre?: string;
      actKey?: string;
      tone?: string;
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const resolvedGenre = genre ?? "None";
    const resolvedAct   = actKey ?? "act1";
    const resolvedTone  = tone ?? "";

    const profile = GENRE_PROFILES[resolvedGenre] ?? GENRE_PROFILES["None"];
    const voice   = VOICES[profile.voiceKey] ?? VOICES["daniel"];

    const actOverlay    = ACT_OVERLAYS[resolvedAct] ?? {};
    const finalSettings = blendSettings(profile.settings, actOverlay);

    const narrationText = prepareNarrationText(text, resolvedAct, resolvedTone);

    // Retry up to 3 times with back-off — handles ElevenLabs 429 rate-limits
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const wait = attempt === 1 ? 4000 : 8000; // 4 s, then 8 s
        console.warn(`[narrate] ${actKey} retry ${attempt} after ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
      }

      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
          },
          body: JSON.stringify({
            text: narrationText,
            model_id: MODEL_ID,
            voice_settings: {
              stability:         finalSettings.stability,
              similarity_boost:  finalSettings.similarity_boost,
              style:             finalSettings.style,
              use_speaker_boost: finalSettings.use_speaker_boost,
            },
          }),
        }
      );

      if (ttsRes.status === 429) {
        lastErr = `429 rate-limited on attempt ${attempt + 1}`;
        continue; // wait and retry
      }

      if (!ttsRes.ok) {
        const errText = await ttsRes.text();
        lastErr = `ElevenLabs ${ttsRes.status}: ${errText}`;
        continue;
      }

      const audioBuffer = await ttsRes.arrayBuffer();
      if (audioBuffer.byteLength === 0) {
        lastErr = "Empty audio buffer returned";
        continue;
      }

      const base64Audio = Buffer.from(audioBuffer).toString("base64");
      return NextResponse.json({ audioBase64: base64Audio });
    }

    throw new Error(`[narrate] All attempts failed for ${actKey}: ${lastErr}`);
  } catch (error) {
    console.error("[/api/narrate] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Narration failed" },
      { status: 500 }
    );
  }
}

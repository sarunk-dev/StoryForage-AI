import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

// Voice selection map: genre/theme → ElevenLabs voice name hints
// We pick from the standard pre-made voices available on all plans.
const GENRE_VOICE_MAP: Record<string, { name: string; gender: string }> = {
  Fantasy:    { name: "Callum",   gender: "male"   },
  "Sci-Fi":   { name: "Liam",     gender: "male"   },
  Thriller:   { name: "Daniel",   gender: "male"   },
  Horror:     { name: "Arnold",   gender: "male"   },
  Romance:    { name: "Rachel",   gender: "female" },
  Historical: { name: "George",   gender: "male"   },
  Mystery:    { name: "Nicole",   gender: "female" },
  Adventure:  { name: "Adam",     gender: "male"   },
  None:       { name: "Rachel",   gender: "female" },
};

async function pickVoiceId(genre: string): Promise<string> {
  const target = GENRE_VOICE_MAP[genre] ?? GENRE_VOICE_MAP["None"];
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch ElevenLabs voices");
  const data = await res.json() as { voices: { voice_id: string; name: string }[] };

  // Try to match by name first
  const matched = data.voices.find(
    (v) => v.name.toLowerCase() === target.name.toLowerCase()
  );
  // Fallback: first available voice
  return matched?.voice_id ?? data.voices[0]?.voice_id ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { text, genre } = (await req.json()) as { text: string; genre?: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceId = await pickVoiceId(genre ?? "None");
    if (!voiceId) {
      return NextResponse.json({ error: "No voice available" }, { status: 500 });
    }

    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      throw new Error(`ElevenLabs TTS error: ${errText}`);
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({ audioBase64: base64Audio });
  } catch (error) {
    console.error("[/api/narrate] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Narration failed" },
      { status: 500 }
    );
  }
}

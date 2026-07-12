import { NextRequest, NextResponse } from "next/server";
import { pollinationsImage } from "@/lib/replicate";

export async function POST(req: NextRequest) {
  try {
    const { prompt, index, genre, tone } = (await req.json()) as {
      prompt: string;
      index: number;
      genre?: string;
      tone?: string;
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // Sequential on the server — Pollinations hard-429s parallel requests
    // from the same IP. page.tsx calls this one image at a time so each
    // request lands in its own rate-limit window.
    const imageUrl = await pollinationsImage(prompt, index, genre, tone);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("[/api/images] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image generation failed" },
      { status: 500 }
    );
  }
}

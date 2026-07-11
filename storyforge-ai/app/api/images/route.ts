import { NextRequest, NextResponse } from "next/server";
import { pollinationsImage } from "@/lib/replicate";

export async function POST(req: NextRequest) {
  try {
    const { prompt, index, genre, tone } = (await req.json()) as {
      prompt: string;
      index: number;       // 0-3 — which of the 4 images
      genre?: string;
      tone?: string;
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

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

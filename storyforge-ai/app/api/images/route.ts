import { NextRequest, NextResponse } from "next/server";
import { flux2pro, fluxKontext } from "@/lib/replicate";

export async function POST(req: NextRequest) {
  try {
    const { imagePrompts } = (await req.json()) as {
      imagePrompts: string[];
    };

    if (!Array.isArray(imagePrompts) || imagePrompts.length === 0) {
      return NextResponse.json(
        { error: "imagePrompts array is required" },
        { status: 400 }
      );
    }

    // Stagger requests by 1.5 s each to avoid Pollinations 429 rate limit.
    // With retry back-off this still completes in ~15–25 s total.
    const [image1, image2, image3, image4] = await Promise.all([
      flux2pro(imagePrompts[0]),
      fluxKontext(imagePrompts[1], "", 1500),
      fluxKontext(imagePrompts[2], "", 3000),
      fluxKontext(imagePrompts[3], "", 4500),
    ]);

    return NextResponse.json({ imageUrls: [image1, image2, image3, image4] });
  } catch (error) {
    console.error("[/api/images] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Image generation failed",
      },
      { status: 500 }
    );
  }
}

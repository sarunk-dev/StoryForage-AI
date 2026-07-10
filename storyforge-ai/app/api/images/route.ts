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

    // Fully sequential with a 2 s gap — Pollinations rate-limits parallel requests.
    const image1 = await flux2pro(imagePrompts[0]);
    const image2 = await fluxKontext(imagePrompts[1], "", 2000);
    const image3 = await fluxKontext(imagePrompts[2], "", 2000);
    const image4 = await fluxKontext(imagePrompts[3], "", 2000);

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

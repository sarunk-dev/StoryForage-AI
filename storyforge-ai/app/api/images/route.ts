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

    // Image 1: Flux 2 Pro — establishes the visual universe
    const image1 = await flux2pro(imagePrompts[0]);

    // Images 2–4: Flux Kontext Pro — style-matched to image 1
    // Run sequentially (each could reference image1 as style anchor)
    const image2 = await fluxKontext(imagePrompts[1], image1);
    const image3 = await fluxKontext(imagePrompts[2], image1);
    const image4 = await fluxKontext(imagePrompts[3], image1);

    const imageUrls = [image1, image2, image3, image4];

    return NextResponse.json({ imageUrls });
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

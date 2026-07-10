import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/granite";
import {
  systemPrompt,
  storyPrompt,
  characterPrompt,
  worldPrompt,
  artPromptGenerator,
} from "@/lib/prompts";
import type { StoryOutline, Character, WorldBuilding } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { prompt, genre } = (await req.json()) as {
      prompt: string;
      genre: string;
    };

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const sys = systemPrompt(genre);

    // Step 1: Story outline
    const story = await generateJSON<StoryOutline>(
      storyPrompt(prompt.trim(), genre),
      sys,
      { maxTokens: 1024 }
    );

    // Step 2: Characters (receives story context)
    const characters = await generateJSON<Character[]>(
      characterPrompt(story),
      sys,
      { maxTokens: 2048 }
    );

    // Step 3: World-building (receives story + characters)
    const world = await generateJSON<WorldBuilding>(
      worldPrompt(story, characters),
      sys,
      { maxTokens: 1024 }
    );

    // Step 4: Art prompts (receives all context)
    const imagePrompts = await generateJSON<string[]>(
      artPromptGenerator(story, characters, world),
      sys,
      { maxTokens: 1024 }
    );

    return NextResponse.json({ story, characters, world, imagePrompts });
  } catch (error) {
    console.error("[/api/generate] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}

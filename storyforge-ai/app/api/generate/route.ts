import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/granite";
import {
  systemPrompt,
  storyPrompt,
  characterPrompt,
  worldPrompt,
  artPromptGenerator,
} from "@/lib/prompts";
import type { StoryOutline, Character, WorldBuilding, StoryOptions } from "@/lib/types";
import { DEFAULT_OPTIONS } from "@/lib/types";

// Allow up to 120 s — 4 sequential Granite calls can take ~60–90 s total.
// When the client disconnects (browser reload / cancel), Next.js aborts
// req.signal which propagates to every Granite call below, immediately
// releasing the concurrent-request slot on the IBM free-tier plan.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      prompt: string;
      options?: Partial<StoryOptions>;
    };

    const { prompt } = body;
    // Merge user options over defaults — any unset field falls back to "Any"/"None"
    const opts: StoryOptions = { ...DEFAULT_OPTIONS, ...(body.options ?? {}) };

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }
    if (prompt.trim().length > 2000) {
      return NextResponse.json(
        { error: "Prompt too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const sys = systemPrompt(opts);
    const signal = req.signal;

    // Step 1: Story outline
    const story = await generateJSON<StoryOutline>(
      storyPrompt(prompt.trim(), opts),
      sys,
      { maxTokens: 1024, signal }
    );

    // Step 2: Characters (receives story + options context)
    const characters = await generateJSON<Character[]>(
      characterPrompt(story, opts),
      sys,
      { maxTokens: 2048, signal }
    );

    // Step 3: World-building (receives story + characters + options)
    const world = await generateJSON<WorldBuilding>(
      worldPrompt(story, characters, opts),
      sys,
      { maxTokens: 1024, signal }
    );

    // Step 4: Art prompts (receives all context)
    const imagePrompts = await generateJSON<string[]>(
      artPromptGenerator(story, characters, world, opts),
      sys,
      { maxTokens: 1024, signal }
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

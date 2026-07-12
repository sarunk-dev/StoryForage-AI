import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/granite";
import {
  systemPrompt,
  storyPrompt,
  characterPrompt,
  worldPrompt,
} from "@/lib/prompts";
import type {
  StoryOutline,
  Character,
  WorldBuilding,
  StoryOptions,
} from "@/lib/types";
import { DEFAULT_OPTIONS } from "@/lib/types";

/**
 * POST /api/regenerate
 *
 * Re-runs a single step of the generation chain using the existing context.
 * The caller passes whatever prior context the step needs so results stay
 * coherent with the rest of the deck.
 *
 * Body shape (discriminated by `target`):
 *   { target: "story",      prompt, options? }
 *   { target: "characters", prompt, story, options? }
 *   { target: "world",      prompt, story, characters, options? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, prompt } = body as {
      target: "story" | "characters" | "world";
      prompt: string;
      story?: StoryOutline;
      characters?: Character[];
      options?: Partial<StoryOptions>;
    };

    if (!target) {
      return NextResponse.json({ error: "target is required" }, { status: 400 });
    }
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const opts: StoryOptions = { ...DEFAULT_OPTIONS, ...(body.options ?? {}) };
    const sys = systemPrompt(opts);

    if (target === "story") {
      const story = await generateJSON<StoryOutline>(
        storyPrompt(prompt.trim(), opts),
        sys,
        { maxTokens: 1024 }
      );
      return NextResponse.json({ story });
    }

    if (target === "characters") {
      const story = body.story as StoryOutline;
      if (!story) {
        return NextResponse.json({ error: "story is required for target=characters" }, { status: 400 });
      }
      const characters = await generateJSON<Character[]>(
        characterPrompt(story, opts),
        sys,
        { maxTokens: 2048 }
      );
      return NextResponse.json({ characters });
    }

    if (target === "world") {
      const story      = body.story      as StoryOutline;
      const characters = body.characters as Character[];
      if (!story || !characters) {
        return NextResponse.json({ error: "story and characters are required for target=world" }, { status: 400 });
      }
      const world = await generateJSON<WorldBuilding>(
        worldPrompt(story, characters, opts),
        sys,
        { maxTokens: 1024 }
      );
      return NextResponse.json({ world });
    }

    return NextResponse.json({ error: `Unknown target: ${target}` }, { status: 400 });

  } catch (error) {
    console.error("[/api/regenerate] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}

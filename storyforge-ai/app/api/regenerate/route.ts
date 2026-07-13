import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/granite";
import {
  systemPrompt,
  storyPrompt,
  characterPrompt,
  worldPrompt,
  singleArtPrompt,
} from "@/lib/prompts";
import type {
  StoryOutline,
  Character,
  WorldBuilding,
  StoryOptions,
} from "@/lib/types";
import { DEFAULT_OPTIONS } from "@/lib/types";

// Single Granite call — 30 s is sufficient; signal propagation same as /generate.
export const maxDuration = 60;

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
      target: "story" | "characters" | "world" | "imagePrompt";
      prompt: string;
      story?: StoryOutline;
      characters?: Character[];
      world?: WorldBuilding;
      index?: number;
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
    const signal = req.signal;

    if (target === "story") {
      const story = await generateJSON<StoryOutline>(
        storyPrompt(prompt.trim(), opts),
        sys,
        { maxTokens: 1024, signal }
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
        { maxTokens: 2048, signal }
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
        { maxTokens: 1024, signal }
      );
      return NextResponse.json({ world });
    }

    if (target === "imagePrompt") {
      const story      = body.story      as StoryOutline;
      const characters = body.characters as Character[];
      const world      = body.world      as WorldBuilding;
      const index      = body.index      as number;

      if (!story || !characters || !world) {
        return NextResponse.json(
          { error: "story, characters, and world are required for target=imagePrompt" },
          { status: 400 }
        );
      }
      if (index === undefined || index < 0 || index > 3) {
        return NextResponse.json(
          { error: "index must be 0–3 for target=imagePrompt" },
          { status: 400 }
        );
      }

      const raw = await generateJSON<unknown>(
        singleArtPrompt(index, story, characters, world, opts),
        sys,
        { maxTokens: 256, signal }
      );

      // Granite sometimes wraps the string in an object e.g. { "prompt": "..." }
      // or { "imagePrompt": "..." } — unwrap to a plain string defensively.
      let imagePrompt: string;
      if (typeof raw === "string") {
        imagePrompt = raw;
      } else if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        const val = obj.prompt ?? obj.imagePrompt ?? obj.image_prompt ?? Object.values(obj)[0];
        imagePrompt = typeof val === "string" ? val : JSON.stringify(val);
      } else {
        imagePrompt = String(raw);
      }

      return NextResponse.json({ imagePrompt });
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

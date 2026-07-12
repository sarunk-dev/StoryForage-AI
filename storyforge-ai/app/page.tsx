"use client";

import { useState, useEffect } from "react";
import { PromptInput } from "@/components/PromptInput";
import { LoadingPipeline } from "@/components/LoadingPipeline";
import { StorySection } from "@/components/StorySection";
import { CharactersSection } from "@/components/CharacterCard";
import { WorldSection } from "@/components/WorldSection";
import { ArtGrid } from "@/components/ArtGrid";
import { ExportButton } from "@/components/ExportButton";
import { DemoDeck } from "@/components/DemoDeck";
import { Separator } from "@/components/ui/separator";
import type { PitchDeck, GenerationStep, StoryOptions, StoryOutline, Character, WorldBuilding } from "@/lib/types";
import { DEFAULT_OPTIONS } from "@/lib/types";
import { AlertCircle, Flame, Moon, Sun, ChevronDown, ChevronUp } from "lucide-react";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Which section is currently regenerating (only one at a time)
type RegeneratingSection = "story" | "characters" | "world" | null;

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<StoryOptions>(DEFAULT_OPTIONS);
  const [step, setStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<Partial<PitchDeck> | null>(null);
  const [dark, setDark] = useState(false);
  const [regenerating, setRegenerating] = useState<RegeneratingSection>(null);
  // Demo deck is expanded by default so judges see output immediately
  const [demoOpen, setDemoOpen] = useState(true);

  // Patch a subset of options without replacing the whole object
  const patchOptions = (patch: Partial<StoryOptions>) =>
    setOptions((prev) => ({ ...prev, ...patch }));

  // Apply / remove dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStep("story");
    setError(null);
    setDeck(null);

    try {
      // ── Text generation ──────────────────────────────────────────────────
      const textRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), options }),
      });
      if (!textRes.ok) {
        const errData = await textRes.json().catch(() => ({}));
        throw new Error(errData.error || "Text generation failed");
      }
      const { story, characters, world, imagePrompts } = await textRes.json();

      // ── Visual micro-delays for intermediate steps ───────────────────────
      setStep("characters"); await sleep(900);
      setStep("world");      await sleep(900);
      setStep("artPrompts"); await sleep(900);

      setDeck({ prompt, genre: options.genre, story, characters, world, imagePrompts, imageUrls: [] });

      // ── Audio narration + Image generation — run concurrently ────────────
      // Narration is sequential per-act (ElevenLabs quota); images are fully
      // parallel (each gets its own direct Pollinations URL from /api/images
      // instantly, then the browser fetches all 4 images simultaneously).
      setStep("audio");

      const narrateAct = async (
        text: string,
        actKey: "act1" | "act2" | "act3"
      ): Promise<string | undefined> => {
        const body = JSON.stringify({ text, genre: options.genre, actKey, tone: story.tone });
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) await sleep(3000); // 3 s back-off on retry
            const res = await fetch("/api/narrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            });
            if (!res.ok) {
              console.warn(`[narrate] ${actKey} attempt ${attempt + 1} failed: ${res.status}`);
              continue;
            }
            const { audioBase64 } = await res.json();
            if (audioBase64) return audioBase64 as string;
          } catch (e) {
            console.warn(`[narrate] ${actKey} attempt ${attempt + 1} threw:`, e);
          }
        }
        return undefined;
      };

      // ── Images — sequential, one at a time ───────────────────────────────
      // Pollinations hard-429s concurrent requests from the same server IP
      // (confirmed: parallel fires 3×429 immediately, sequential 4/4 succeed).
      // Each image renders as soon as it arrives; server retries 429s internally.
      const fetchImages = async () => {
        const urls: (string | null)[] = [null, null, null, null];
        for (let i = 0; i < (imagePrompts as string[]).length; i++) {
          try {
            const imgRes = await fetch("/api/images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: (imagePrompts as string[])[i],
                index:  i,
                genre:  options.genre !== "None" ? options.genre : undefined,
                tone:   options.tone  !== "Any"  ? options.tone  : undefined,
              }),
            });
            if (imgRes.ok) {
              const { imageUrl } = await imgRes.json();
              urls[i] = imageUrl;
              // Render each image as it arrives
              setDeck((prev) =>
                prev ? { ...prev, imageUrls: urls.filter((u): u is string => u !== null) } : null
              );
            }
          } catch {
            // Non-fatal — continue to next image
          }
        }
      };

      // Start images concurrently with act1 narration — they run in parallel
      // because fetchImages is sequential *within itself* (image-to-image),
      // but the whole image pipeline doesn't block narration from starting.
      const [act1Audio] = await Promise.all([
        narrateAct(story.acts.act1, "act1"),
        fetchImages(),
      ]);
      await sleep(2000);
      const act2Audio = await narrateAct(story.acts.act2, "act2");
      await sleep(2000);
      const act3Audio = await narrateAct(story.acts.act3, "act3");

      const actAudioUrls: { act1?: string; act2?: string; act3?: string } = {
        ...(act1Audio ? { act1: act1Audio } : {}),
        ...(act2Audio ? { act2: act2Audio } : {}),
        ...(act3Audio ? { act3: act3Audio } : {}),
      };

      setDeck((prev) => prev ? { ...prev, actAudioUrls } : null);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  };

  // ── Per-section regenerate handlers ─────────────────────────────────────────
  // Each calls /api/regenerate with its target + current context, then patches
  // only the relevant slice of deck. Story regen clears stale audio — the user
  // can regenerate it manually via the "Generate Audio" button in StorySection.

  const handleRegenerateStory = async () => {
    if (!deck || regenerating) return;
    setRegenerating("story");
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "story", prompt, options }),
      });
      if (!res.ok) return;
      const { story } = (await res.json()) as { story: StoryOutline };
      // Clear stale audio — user must click "Generate Audio" to refresh it
      setDeck((prev) => prev ? { ...prev, story, actAudioUrls: {} } : null);
    } finally {
      setRegenerating(null);
    }
  };

  const handleRegenerateCharacters = async () => {
    if (!deck?.story || regenerating) return;
    setRegenerating("characters");
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "characters", prompt, options, story: deck.story }),
      });
      if (!res.ok) return;
      const { characters } = (await res.json()) as { characters: Character[] };
      setDeck((prev) => prev ? { ...prev, characters } : null);
    } finally {
      setRegenerating(null);
    }
  };

  const handleRegenerateWorld = async () => {
    if (!deck?.story || !deck?.characters || regenerating) return;
    setRegenerating("world");
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "world", prompt, options, story: deck.story, characters: deck.characters }),
      });
      if (!res.ok) return;
      const { world } = (await res.json()) as { world: WorldBuilding };
      setDeck((prev) => prev ? { ...prev, world } : null);
    } finally {
      setRegenerating(null);
    }
  };

  // ── Manual audio generation — triggered by "Generate Audio" button ───────────
  // Called from StorySection when the user explicitly requests narration for the
  // current (possibly regenerated) story. Sends /api/narrate for each act
  // sequentially to respect ElevenLabs quota, then patches actAudioUrls.
  const handleGenerateAudio = async (story: StoryOutline) => {
    const narrateAct = async (
      text: string,
      actKey: "act1" | "act2" | "act3"
    ): Promise<string | undefined> => {
      const body = JSON.stringify({ text, genre: options.genre, actKey, tone: story.tone });
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) await sleep(3000);
          const res = await fetch("/api/narrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          if (!res.ok) continue;
          const { audioBase64 } = await res.json();
          if (audioBase64) return audioBase64 as string;
        } catch { /* non-fatal */ }
      }
      return undefined;
    };

    // Clear existing audio first so per-act players show loading state
    setDeck((prev) => prev ? { ...prev, actAudioUrls: {} } : null);

    const act1Audio = await narrateAct(story.acts.act1, "act1");
    await sleep(2000);
    const act2Audio = await narrateAct(story.acts.act2, "act2");
    await sleep(2000);
    const act3Audio = await narrateAct(story.acts.act3, "act3");

    const actAudioUrls = {
      ...(act1Audio ? { act1: act1Audio } : {}),
      ...(act2Audio ? { act2: act2Audio } : {}),
      ...(act3Audio ? { act3: act3Audio } : {}),
    };
    setDeck((prev) => prev ? { ...prev, actAudioUrls } : null);
  };

  const isLoading = step !== "idle" && step !== "done" && step !== "error";
  const isDone    = step === "done";
  const hasText   = deck?.story && deck?.characters && deck?.world;
  const hasImages = (deck?.imageUrls?.length ?? 0) > 0;
  const showHero  = step === "idle";

  // Collect active option badges to show below section header
  const activeBadges = [
    options.genre    !== "None" ? options.genre    : null,
    options.tone     !== "Any"  ? options.tone     : null,
    options.length   !== "Any"  ? options.length   : null,
    options.ending   !== "Any"  ? options.ending   : null,
    options.audience !== "Any"  ? options.audience : null,
    options.era      !== "Any"  ? options.era      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <Flame className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">StoryForge AI</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle dark mode"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isDone && deck && hasText && hasImages && (
              <ExportButton deck={deck as PitchDeck} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        {showHero && (
          <div className="pt-16 pb-10 text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border/60 rounded-full px-3 py-1 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Powered by IBM Granite 4 + Flux AI
            </div>
            <h2 className="text-5xl font-extrabold tracking-tight leading-[1.1] text-gradient">
              Your story,<br />fully realized.
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
              One sentence becomes a complete pitch deck — story, characters,
              world-building, and concept art in under 60 seconds.
            </p>
          </div>
        )}

        {/* ── Prompt input ──────────────────────────────────────────────── */}
        <div className={showHero ? "pb-10 max-w-2xl mx-auto" : "pt-6 pb-8 max-w-2xl mx-auto"}>
          <div className="rounded-2xl border border-border/60 bg-card p-5 glow-amber transition-shadow">
            <PromptInput
              value={prompt}
              options={options}
              isLoading={isLoading}
              onChange={setPrompt}
              onOptionsChange={patchOptions}
              onSubmit={handleGenerate}
            />
          </div>
        </div>

        {/* ── Demo deck — visible on landing so judges see output instantly ── */}
        {showHero && (
          <div className="max-w-2xl mx-auto pb-8">
            <button
              onClick={() => setDemoOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-border/50
                         bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest
                         text-muted-foreground/60 hover:text-foreground/70 hover:bg-muted/30
                         transition-colors select-none mb-2"
            >
              <span>Sample output — see what StoryForge generates</span>
              {demoOpen
                ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
            {demoOpen && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <DemoDeck />
              </div>
            )}
          </div>
        )}

        {/* ── Loading pipeline ──────────────────────────────────────────── */}
        {isLoading && (
          <div className="rounded-xl border border-border/40 bg-muted/20 px-5 mb-8 max-w-2xl mx-auto">
            <LoadingPipeline currentStep={step} />
          </div>
        )}

        {/* ── Error state ───────────────────────────────────────────────── */}
        {step === "error" && error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-8">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5">Generation failed</div>
              <div className="text-destructive/80">{error}</div>
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {hasText && deck && (
          <div className="space-y-10">
            {/* Active options badges — shown once at the top of results */}
            {activeBadges.length > 0 && (
              <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 self-center mr-1">
                  Generated with
                </span>
                {activeBadges.map((badge) => (
                  <span
                    key={badge}
                    className="text-[11px] font-medium border border-primary/25 text-primary/80 bg-primary/5 rounded-full px-2.5 py-0.5"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <StorySection
              story={deck.story!}
              genre={options.genre}
              actAudioUrls={deck.actAudioUrls}
              onRegenerate={isDone ? handleRegenerateStory : undefined}
              isRegenerating={regenerating === "story"}
              onGenerateAudio={isDone ? () => handleGenerateAudio(deck.story!) : undefined}
            />
            <Separator />
            <CharactersSection
              characters={deck.characters!}
              onRegenerate={isDone ? handleRegenerateCharacters : undefined}
              isRegenerating={regenerating === "characters"}
            />
            <Separator />
            <WorldSection
              world={deck.world!}
              onRegenerate={isDone ? handleRegenerateWorld : undefined}
              isRegenerating={regenerating === "world"}
            />

            {(hasImages || step === "audio" || step === "images") && (
              <>
                <Separator />
                <ArtGrid
                  imageUrls={deck.imageUrls ?? []}
                  isLoading={step === "audio" || step === "images"}
                />
              </>
            )}

            {isDone && hasImages && (
              <div className="flex flex-col items-center gap-3 pt-6 pb-2 border-t border-border/40">
                <p className="text-sm text-muted-foreground">Your pitch deck is ready.</p>
                <ExportButton deck={deck as PitchDeck} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground/50">
          <span>StoryForge AI</span>
          <span>IBM AI Builders Challenge · July 2026</span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
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
  // Holds the AbortController for the currently running generation so a
  // re-submit or unmount can cancel the in-flight /api/generate request,
  // which propagates via req.signal all the way to the IBM WatsonX call.
  const abortRef = useRef<AbortController | null>(null);

  // Patch a subset of options without replacing the whole object
  const patchOptions = (patch: Partial<StoryOptions>) =>
    setOptions((prev) => ({ ...prev, ...patch }));

  // Apply / remove dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Abort any in-flight generation when the component unmounts (e.g. hot reload)
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Cancel any in-flight request from a previous generate click
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStep("story");
    setError(null);
    setDeck(null);

    try {
      // ── Text generation ──────────────────────────────────────────────────
      const textRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), options }),
        signal: controller.signal,
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

      // ── Images + Narration — both lanes start immediately in parallel ─────
      // Lane A (images): image[0] → [1] → [2] → [3], each renders as it arrives.
      // Lane B (narration): sweep 1 → act1/2/3 with 2 s gaps between each act;
      //   sweep 2 retries only the acts that failed in sweep 1. No sweep 3.
      setStep("audio");

      // Single narrate call — one act, one attempt, no internal retry loop
      const narrateOne = async (
        text: string,
        actKey: "act1" | "act2" | "act3"
      ): Promise<string | undefined> => {
        try {
          const res = await fetch("/api/narrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, genre: options.genre, actKey, tone: story.tone }),
          });
          if (!res.ok) {
            console.warn(`[narrate] ${actKey} failed: ${res.status}`);
            return undefined;
          }
          const { audioBase64 } = await res.json();
          return audioBase64 as string | undefined;
        } catch (e) {
          console.warn(`[narrate] ${actKey} threw:`, e);
          return undefined;
        }
      };

      // Lane B: two sweeps across all 3 acts; sweep 2 only retries failures.
      // Advances the progress step to "images" once narration is done so the
      // loading bar moves forward even while images are still running in Lane A.
      const narrateAllActs = async (): Promise<{ act1?: string; act2?: string; act3?: string }> => {
        const acts: { key: "act1" | "act2" | "act3"; text: string }[] = [
          { key: "act1", text: story.acts.act1 },
          { key: "act2", text: story.acts.act2 },
          { key: "act3", text: story.acts.act3 },
        ];
        const results: { act1?: string; act2?: string; act3?: string } = {};

        // Helper — patches the act into deck immediately so the play button
        // appears as soon as each act's audio arrives, without waiting for images.
        const commitAct = (key: "act1" | "act2" | "act3", audio: string) => {
          results[key] = audio;
          setDeck((prev) => prev ? { ...prev, actAudioUrls: { ...results } } : null);
        };

        // Sweep 1 — try every act sequentially
        for (let i = 0; i < acts.length; i++) {
          if (i > 0) await sleep(2000);
          const audio = await narrateOne(acts[i].text, acts[i].key);
          if (audio) commitAct(acts[i].key, audio);
        }

        // Sweep 2 — retry only the acts that failed in sweep 1
        const failed = acts.filter((a) => !results[a.key]);
        for (let i = 0; i < failed.length; i++) {
          if (i > 0) await sleep(2000);
          const audio = await narrateOne(failed[i].text, failed[i].key);
          if (audio) commitAct(failed[i].key, audio);
        }

        // Narration is done — advance progress bar to concept art step
        setStep("images");
        return results;
      };

      // Lane A: images — sequential, each renders as it arrives
      const fetchAllImages = async () => {
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
              const snapshot = urls.map((u) => u ?? "").filter(Boolean);
              setDeck((prev) => prev ? { ...prev, imageUrls: snapshot } : null);
            }
          } catch {
            // Non-fatal — continue to next image
          }
        }
      };

      // Fire both lanes simultaneously — neither blocks the other
      const [actAudioUrls] = await Promise.all([
        narrateAllActs(),
        fetchAllImages(),
      ]);

      setDeck((prev) => prev ? { ...prev, actAudioUrls } : null);
      setStep("done");
    } catch (err) {
      // AbortError means we intentionally cancelled (re-submit / unmount) — not an error
      if (err instanceof Error && err.name === "AbortError") {
        setStep("idle");
        return;
      }
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
  // Same two-sweep logic as the main generation flow.
  const handleGenerateAudio = async (story: StoryOutline) => {
    const narrateOne = async (
      text: string,
      actKey: "act1" | "act2" | "act3"
    ): Promise<string | undefined> => {
      try {
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, genre: options.genre, actKey, tone: story.tone }),
        });
        if (!res.ok) return undefined;
        const { audioBase64 } = await res.json();
        return audioBase64 as string | undefined;
      } catch { return undefined; }
    };

    // Clear existing audio first so per-act players show loading state
    setDeck((prev) => prev ? { ...prev, actAudioUrls: {} } : null);

    const acts: { key: "act1" | "act2" | "act3"; text: string }[] = [
      { key: "act1", text: story.acts.act1 },
      { key: "act2", text: story.acts.act2 },
      { key: "act3", text: story.acts.act3 },
    ];
    const results: { act1?: string; act2?: string; act3?: string } = {};

    // Sweep 1
    for (let i = 0; i < acts.length; i++) {
      if (i > 0) await sleep(2000);
      const audio = await narrateOne(acts[i].text, acts[i].key);
      if (audio) results[acts[i].key] = audio;
    }
    // Sweep 2 — retry only failures
    const failed = acts.filter((a) => !results[a.key]);
    for (let i = 0; i < failed.length; i++) {
      if (i > 0) await sleep(2000);
      const audio = await narrateOne(failed[i].text, failed[i].key);
      if (audio) results[failed[i].key] = audio;
    }

    setDeck((prev) => prev ? { ...prev, actAudioUrls: results } : null);
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
              Powered by IBM Granite 4 · Flux AI · ElevenLabs
            </div>
            <h2 className="text-5xl font-extrabold tracking-tight leading-[1.1] text-gradient">
              Your story,<br />fully realized.
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
              One sentence becomes a complete pitch deck — story, characters,
              world-building, and concept art in{" "}
              <span className="text-gradient font-semibold whitespace-nowrap">under 60 seconds</span>.
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
          <span>StoryForge AI · Built by sarunk-dev</span>
          <span>IBM AI Builders Challenge · July 2026</span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { PromptInput } from "@/components/PromptInput";
import { LoadingPipeline } from "@/components/LoadingPipeline";
import { StorySection } from "@/components/StorySection";
import { CharactersSection } from "@/components/CharacterCard";
import { WorldSection } from "@/components/WorldSection";
import { ArtGrid } from "@/components/ArtGrid";
import { ExportButton } from "@/components/ExportButton";
import { Separator } from "@/components/ui/separator";
import type { PitchDeck, GenerationStep, Genre } from "@/lib/types";
import { AlertCircle, Flame, Moon, Sun } from "lucide-react";

// Small helper: resolves after `ms` milliseconds
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState<Genre>("None");
  const [step, setStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<Partial<PitchDeck> | null>(null);
  const [dark, setDark] = useState(false);

  // Apply / remove dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [dark]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStep("story");
    setError(null);
    setDeck(null);

    try {
      // ── Text generation ──────────────────────────────────────────────
      const textRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), genre }),
      });
      if (!textRes.ok) {
        const errData = await textRes.json().catch(() => ({}));
        throw new Error(errData.error || "Text generation failed");
      }
      const { story, characters, world, imagePrompts } = await textRes.json();

      // ── Visual micro-delays for intermediate steps ────────────────────
      // "characters" step
      setStep("characters");
      await sleep(900);
      // "world" step
      setStep("world");
      await sleep(900);
      // "artPrompts" step
      setStep("artPrompts");
      await sleep(900);

      setDeck({ prompt, genre, story, characters, world, imagePrompts, imageUrls: [] });

      // ── Audio narration (sequential — avoids ElevenLabs rate-limit) ──
      setStep("audio");

      const narrateAct = async (text: string): Promise<string | undefined> => {
        try {
          const res = await fetch("/api/narrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, genre }),
          });
          if (!res.ok) return undefined;
          const { audioBase64 } = await res.json();
          return audioBase64 as string;
        } catch {
          return undefined;
        }
      };

      const act1Audio = await narrateAct(story.acts.act1);
      const act2Audio = await narrateAct(story.acts.act2);
      const act3Audio = await narrateAct(story.acts.act3);

      const actAudioUrls: { act1?: string; act2?: string; act3?: string } = {
        ...(act1Audio ? { act1: act1Audio } : {}),
        ...(act2Audio ? { act2: act2Audio } : {}),
        ...(act3Audio ? { act3: act3Audio } : {}),
      };

      setDeck({ prompt, genre, story, characters, world, imagePrompts, imageUrls: [], actAudioUrls });

      // ── Image generation ──────────────────────────────────────────────
      setStep("images");

      const imgRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompts }),
      });
      if (!imgRes.ok) {
        const errData = await imgRes.json().catch(() => ({}));
        throw new Error(errData.error || "Image generation failed");
      }
      const { imageUrls } = await imgRes.json();
      setDeck((prev) => (prev ? { ...prev, imageUrls } : null));
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  };

  const isLoading = step !== "idle" && step !== "done" && step !== "error";
  const isDone = step === "done";
  const hasText = deck?.story && deck?.characters && deck?.world;
  const hasImages = (deck?.imageUrls?.length ?? 0) > 0;
  const showHero = step === "idle";

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
            {/* Dark mode toggle */}
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
        <div className={`${showHero ? "pb-10 max-w-2xl mx-auto" : "pt-6 pb-8 max-w-2xl mx-auto"}`}>
          <div className="rounded-2xl border border-border/60 bg-card p-5 glow-amber transition-shadow">
            <PromptInput
              value={prompt}
              genre={genre}
              isLoading={isLoading}
              onChange={setPrompt}
              onGenreChange={setGenre}
              onSubmit={handleGenerate}
            />
          </div>
        </div>

        {/* ── Loading pipeline ──────────────────────────────────────────── */}
        {isLoading && (
          <div className="rounded-xl border border-border/40 bg-muted/20 px-5 mb-8">
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
            <StorySection
              story={deck.story!}
              genre={genre}
              actAudioUrls={deck.actAudioUrls}
            />
            <Separator />
            <CharactersSection characters={deck.characters!} />
            <Separator />
            <WorldSection world={deck.world!} />

            {(hasImages || step === "images") && (
              <>
                <Separator />
                <ArtGrid
                  imageUrls={deck.imageUrls ?? []}
                  isLoading={step === "images"}
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

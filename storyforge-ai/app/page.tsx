"use client";

import { useState } from "react";
import { PromptInput } from "@/components/PromptInput";
import { LoadingPipeline } from "@/components/LoadingPipeline";
import { StorySection } from "@/components/StorySection";
import { CharactersSection } from "@/components/CharacterCard";
import { WorldSection } from "@/components/WorldSection";
import { ArtGrid } from "@/components/ArtGrid";
import { ExportButton } from "@/components/ExportButton";
import { Separator } from "@/components/ui/separator";
import type { PitchDeck, GenerationStep, Genre } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState<Genre>("None");
  const [step, setStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<Partial<PitchDeck> | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStep("story");
    setError(null);
    setDeck(null);

    try {
      // ── Step 1–4: Text generation chain (story → characters → world → art prompts)
      const textRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), genre }),
      });

      if (!textRes.ok) {
        const errData = await textRes.json().catch(() => ({}));
        throw new Error(errData.error || "Text generation failed");
      }

      const textData = await textRes.json();
      const { story, characters, world, imagePrompts } = textData;

      // Update deck with text content — show it while images generate
      setDeck({ prompt, genre, story, characters, world, imagePrompts, imageUrls: [] });
      setStep("images");

      // ── Step 5: Image generation
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

      setDeck((prev) => prev ? { ...prev, imageUrls } : null);
      setStep("done");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  };

  const isLoading = step !== "idle" && step !== "done" && step !== "error";
  const isDone = step === "done";
  const hasText = deck?.story && deck?.characters && deck?.world;
  const hasImages = (deck?.imageUrls?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">StoryForge AI</h1>
            <p className="text-xs text-muted-foreground">
              One prompt → complete story pitch deck
            </p>
          </div>
          {isDone && deck && hasText && hasImages && (
            <ExportButton deck={deck as PitchDeck} />
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Hero */}
        {step === "idle" && (
          <div className="text-center space-y-3 pt-8 pb-4">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Your story, fully realized
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              One sentence becomes a complete pitch deck — story outline,
              characters, world-building, and concept art. In under 60 seconds.
            </p>
          </div>
        )}

        {/* Input */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <PromptInput
            value={prompt}
            genre={genre}
            isLoading={isLoading}
            onChange={setPrompt}
            onGenreChange={setGenre}
            onSubmit={handleGenerate}
          />
        </div>

        {/* Loading pipeline */}
        {isLoading && (
          <div className="rounded-2xl border border-border/40 bg-muted/20 px-6 py-2">
            <LoadingPipeline currentStep={step} />
          </div>
        )}

        {/* Error state */}
        {step === "error" && error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Generation failed</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Results — stream in as they arrive */}
        {hasText && deck && (
          <div className="space-y-12">
            <StorySection story={deck.story!} genre={genre} />
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

            {/* Export CTA at bottom too */}
            {isDone && hasImages && (
              <div className="flex flex-col items-center gap-4 py-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Your pitch deck is ready.
                </p>
                <ExportButton deck={deck as PitchDeck} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-muted-foreground/50 py-8 border-t border-border/30 mt-12">
        StoryForge AI · Built for IBM AI Builders Challenge · July 2026
      </footer>
    </div>
  );
}

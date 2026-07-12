"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import type { StoryOutline } from "@/lib/types";
import { BookOpen, Volume2, VolumeX, RefreshCw } from "lucide-react";

interface StorySectionProps {
  story: StoryOutline;
  genre: string;
  actAudioUrls?: {
    act1?: string;
    act2?: string;
    act3?: string;
  };
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

type ActKey = "act1" | "act2" | "act3";

function useActAudio(base64?: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!base64) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return { playing, toggle, hasAudio: !!base64 };
}

interface ActPlayerProps {
  base64?: string;
}

function ActPlayer({ base64 }: ActPlayerProps) {
  const { playing, toggle, hasAudio } = useActAudio(base64);

  // Always reserve space — invisible placeholder keeps layout stable even
  // before audio loads. Once hasAudio, the button is always visible.
  return (
    <button
      onClick={hasAudio ? toggle : undefined}
      title={playing ? "Stop narration" : "Play narration"}
      aria-label={playing ? "Stop narration" : "Play narration"}
      disabled={!hasAudio}
      className={[
        // Base — consistent size & shape
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        // Visibility: always shown when audio exists; ghost placeholder when not
        hasAudio
          ? playing
            ? // Active state: filled amber + pulse-ring animation
              "bg-primary text-primary-foreground shadow-md scale-110 audio-pulse"
            : // Rest state: tinted amber so it's clearly visible, not ghost
              "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:scale-105 hover:shadow-sm"
          : // No audio yet — invisible but occupies space
            "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {playing ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
}

export function StorySection({ story, genre, actAudioUrls, onRegenerate, isRegenerating }: StorySectionProps) {
  const acts: { label: string; sub: string; content: string; key: ActKey }[] = [
    { label: "Act I",   sub: "Setup",      content: story.acts.act1, key: "act1" },
    { label: "Act II",  sub: "Conflict",   content: story.acts.act2, key: "act2" },
    { label: "Act III", sub: "Resolution", content: story.acts.act3, key: "act3" },
  ];

  return (
    <section className="space-y-7">
      {/* Section label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 section-label">
          <BookOpen className="w-3.5 h-3.5" />
          Story Outline
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Regenerate story outline"
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 hover:text-primary
                       hover:bg-primary/8 border border-transparent hover:border-primary/20
                       rounded-lg px-2.5 py-1.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating…" : "Regenerate"}
          </button>
        )}
      </div>

      {/* Title block */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-[2.1rem] font-extrabold tracking-tight leading-tight text-foreground">
            {story.title}
          </h2>
          {genre && genre !== "None" && (
            <Badge variant="outline" className="mt-2 border-primary/30 text-primary text-xs">
              {genre}
            </Badge>
          )}
        </div>
        <p className="text-[15px] text-muted-foreground italic leading-relaxed">
          &ldquo;{story.logline}&rdquo;
        </p>
      </div>

      {/* Premise */}
      <div className="rounded-xl bg-muted/40 border border-border/50 px-5 py-4">
        <p className="text-[15px] leading-[1.75] text-foreground/90">{story.premise}</p>
      </div>

      {/* Three-act structure */}
      <div className="space-y-3">
        <p className="section-label">Three-Act Structure</p>
        <div className="space-y-2.5">
          {acts.map(({ label, sub, content, key }) => (
            <div
              key={label}
              className="flex gap-4 rounded-xl border border-border/40 bg-card px-4 py-4
                         hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-200 group"
            >
              {/* Act label column — fixed width */}
              <div className="flex-shrink-0 w-16 pt-0.5">
                <div className="text-[12px] font-bold text-primary uppercase tracking-widest">
                  {label}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">{sub}</div>
              </div>

              {/* Divider */}
              <div className="w-px bg-border/60 flex-shrink-0 self-stretch" />

              {/* Content */}
              <p className="flex-1 text-[15px] leading-[1.75] text-foreground/85 min-w-0">
                {content}
              </p>

              {/* Speaker button — always in the layout, visible once audio ready */}
              <div className="flex items-center pl-2 flex-shrink-0">
                <ActPlayer base64={actAudioUrls?.[key]} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-muted-foreground pt-2 border-t border-border/40">
        <span>
          <span className="font-semibold text-foreground/70">Theme</span>
          <span className="mx-1.5 text-border">—</span>
          {story.theme}
        </span>
        <span>
          <span className="font-semibold text-foreground/70">Tone</span>
          <span className="mx-1.5 text-border">—</span>
          {story.tone}
        </span>
      </div>
    </section>
  );
}

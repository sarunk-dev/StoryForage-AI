"use client";

import { Badge } from "@/components/ui/badge";
import type { StoryOutline } from "@/lib/types";
import { BookOpen } from "lucide-react";

interface StorySectionProps {
  story: StoryOutline;
  genre: string;
}

export function StorySection({ story, genre }: StorySectionProps) {
  const acts = [
    { label: "Act I", sub: "Setup", content: story.acts.act1 },
    { label: "Act II", sub: "Conflict", content: story.acts.act2 },
    { label: "Act III", sub: "Resolution", content: story.acts.act3 },
  ];

  return (
    <section className="space-y-7">
      {/* Section label */}
      <div className="flex items-center gap-2 section-label">
        <BookOpen className="w-3.5 h-3.5" />
        Story Outline
      </div>

      {/* Title block */}
      <div className="space-y-2">
        <div className="flex items-start gap-2.5 flex-wrap">
          <h2 className="text-[2rem] font-extrabold tracking-tight leading-tight text-foreground">
            {story.title}
          </h2>
          {genre && genre !== "None" && (
            <Badge variant="outline" className="mt-1.5 border-primary/30 text-primary text-xs">
              {genre}
            </Badge>
          )}
        </div>
        <p className="text-base text-muted-foreground italic leading-relaxed">
          &ldquo;{story.logline}&rdquo;
        </p>
      </div>

      {/* Premise */}
      <div className="rounded-xl bg-muted/40 border border-border/50 px-5 py-4">
        <p className="text-sm leading-relaxed text-foreground/90">{story.premise}</p>
      </div>

      {/* Three-act structure */}
      <div className="space-y-3">
        <p className="section-label">Three-Act Structure</p>
        <div className="space-y-2">
          {acts.map(({ label, sub, content }) => (
            <div
              key={label}
              className="flex gap-4 rounded-lg p-3.5 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex-shrink-0 w-14 pt-0.5">
                <div className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                  {label}
                </div>
                <div className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">{content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
        <span><span className="font-medium text-foreground/60">Theme</span> — {story.theme}</span>
        <span><span className="font-medium text-foreground/60">Tone</span> — {story.tone}</span>
      </div>
    </section>
  );
}

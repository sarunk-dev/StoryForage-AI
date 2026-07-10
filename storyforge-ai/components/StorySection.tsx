"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { StoryOutline } from "@/lib/types";
import { BookOpen } from "lucide-react";

interface StorySectionProps {
  story: StoryOutline;
  genre: string;
}

export function StorySection({ story, genre }: StorySectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
        <BookOpen className="w-4 h-4" />
        Story Outline
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
            {story.title}
          </h2>
          {genre && genre !== "None" && (
            <Badge variant="secondary" className="mt-1">
              {genre}
            </Badge>
          )}
          <Badge variant="outline" className="mt-1">
            {story.tone}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground italic leading-relaxed">
          &ldquo;{story.logline}&rdquo;
        </p>
      </div>

      <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
        <p className="text-base leading-relaxed">{story.premise}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Three-Act Structure
        </h3>
        <div className="grid gap-3">
          {(
            [
              { label: "Act I — Setup", content: story.acts.act1 },
              { label: "Act II — Conflict", content: story.acts.act2 },
              { label: "Act III — Resolution", content: story.acts.act3 },
            ] as const
          ).map(({ label, content }) => (
            <div key={label} className="flex gap-4">
              <div className="w-32 flex-shrink-0 text-xs font-semibold text-primary/80 pt-0.5 uppercase tracking-wide">
                {label}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex gap-6 text-sm flex-wrap">
        <div>
          <span className="text-muted-foreground font-medium">Theme: </span>
          <span className="italic">{story.theme}</span>
        </div>
      </div>
    </section>
  );
}

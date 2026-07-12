"use client";

import type { Character } from "@/lib/types";
import { Users, RefreshCw } from "lucide-react";

interface CharacterCardProps {
  character: Character;
  index: number;
}

const ROLE_STYLES: Record<string, string> = {
  protagonist: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  antagonist:  "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  ally:        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  mentor:      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  wildcard:    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

function roleStyle(role: string): string {
  const key = Object.keys(ROLE_STYLES).find((k) =>
    role.toLowerCase().includes(k)
  );
  return key ? ROLE_STYLES[key] : "bg-muted/60 text-muted-foreground border-border";
}

export function CharacterCard({ character, index }: CharacterCardProps) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card p-5 space-y-4
                    hover:border-border hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-muted-foreground/40 block mb-0.5">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-[1.1rem] font-bold tracking-tight leading-snug truncate">
            {character.name}
          </h3>
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border flex-shrink-0 mt-0.5 ${roleStyle(character.role)}`}
        >
          {character.role}
        </span>
      </div>

      {/* Physical description */}
      <p className="text-[13px] text-muted-foreground leading-relaxed italic">
        {character.physicalDescription}
      </p>

      {/* Backstory */}
      <p className="text-[14px] text-foreground/80 leading-relaxed flex-1">{character.backstory}</p>

      {/* Wants / Flaw — stacked, full-width so text can breathe */}
      <div className="space-y-2">
        <div className="rounded-lg bg-muted/40 border border-border/30 px-3.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Wants
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/85">{character.motivation}</p>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border/30 px-3.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Fatal Flaw
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/85">{character.fatalFlaw}</p>
        </div>
      </div>

      {/* Defining quote */}
      <div className="border-l-2 border-primary/40 pl-3.5 py-0.5">
        <p className="text-[13px] italic text-muted-foreground leading-relaxed">
          &ldquo;{character.definingQuote}&rdquo;
        </p>
      </div>
    </div>
  );
}

interface CharactersSectionProps {
  characters: Character[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function CharactersSection({ characters, onRegenerate, isRegenerating }: CharactersSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 section-label">
          <Users className="w-3.5 h-3.5" />
          Characters
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Regenerate characters"
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 hover:text-primary
                       hover:bg-primary/8 border border-transparent hover:border-primary/20
                       rounded-lg px-2.5 py-1.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating…" : "Regenerate"}
          </button>
        )}
      </div>
      {/* 
        Up to 3 cards side-by-side on wide screens.
        Each card has enough room to breathe because the page is now wider.
      */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((char, idx) => (
          <CharacterCard key={char.name} character={char} index={idx} />
        ))}
      </div>
    </section>
  );
}

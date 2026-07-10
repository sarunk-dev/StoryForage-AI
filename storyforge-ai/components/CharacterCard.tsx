"use client";

import type { Character } from "@/lib/types";
import { Users } from "lucide-react";

interface CharacterCardProps {
  character: Character;
  index: number;
}

const ROLE_STYLES: Record<string, string> = {
  protagonist: "bg-blue-50 text-blue-700 border-blue-200",
  antagonist:  "bg-red-50 text-red-700 border-red-200",
  ally:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  mentor:      "bg-violet-50 text-violet-700 border-violet-200",
  wildcard:    "bg-amber-50 text-amber-700 border-amber-200",
};

function roleStyle(role: string): string {
  const key = Object.keys(ROLE_STYLES).find((k) =>
    role.toLowerCase().includes(k)
  );
  return key ? ROLE_STYLES[key] : "bg-muted/60 text-muted-foreground border-border";
}

export function CharacterCard({ character, index }: CharacterCardProps) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card p-5 space-y-4 hover:border-border hover:shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground/40 block mb-0.5">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-lg font-bold tracking-tight">{character.name}</h3>
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 mt-1 ${roleStyle(character.role)}`}
        >
          {character.role}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed italic">
        {character.physicalDescription}
      </p>

      {/* Backstory */}
      <p className="text-sm text-foreground/80 leading-relaxed">{character.backstory}</p>

      {/* Wants / Flaw chips */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/40 border border-border/30 px-3 py-2.5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Wants
          </div>
          <p className="text-xs leading-snug">{character.motivation}</p>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border/30 px-3 py-2.5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Fatal Flaw
          </div>
          <p className="text-xs leading-snug">{character.fatalFlaw}</p>
        </div>
      </div>

      {/* Quote */}
      <div className="border-l-2 border-primary/40 pl-3 py-0.5">
        <p className="text-xs italic text-muted-foreground leading-relaxed">
          &ldquo;{character.definingQuote}&rdquo;
        </p>
      </div>
    </div>
  );
}

interface CharactersSectionProps {
  characters: Character[];
}

export function CharactersSection({ characters }: CharactersSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 section-label">
        <Users className="w-3.5 h-3.5" />
        Characters
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {characters.map((char, idx) => (
          <CharacterCard key={char.name} character={char} index={idx} />
        ))}
      </div>
    </section>
  );
}

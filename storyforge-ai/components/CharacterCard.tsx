"use client";

import type { Character } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface CharacterCardProps {
  character: Character;
  index: number;
}

export function CharacterCard({ character, index }: CharacterCardProps) {
  const roleColors: Record<string, string> = {
    Protagonist: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    Antagonist: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    Ally: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    Mentor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    Wildcard: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  };

  const roleColorClass =
    Object.entries(roleColors).find(([key]) =>
      character.role.toLowerCase().includes(key.toLowerCase())
    )?.[1] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono">
              #{index + 1}
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground">{character.name}</h3>
        </div>
        <Badge
          variant="outline"
          className={`text-xs font-medium px-2.5 py-1 ${roleColorClass}`}
        >
          {character.role}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed italic">
        {character.physicalDescription}
      </p>

      <div className="space-y-3 text-sm">
        <div>
          <span className="font-semibold text-foreground/80">Backstory — </span>
          <span className="text-muted-foreground">{character.backstory}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-muted/40 rounded-lg p-3 border border-border/40">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Wants
            </div>
            <div className="text-sm">{character.motivation}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 border border-border/40">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Fatal Flaw
            </div>
            <div className="text-sm">{character.fatalFlaw}</div>
          </div>
        </div>

        <div className="border-l-2 border-primary/30 pl-4 py-1">
          <p className="text-sm italic text-foreground/80">
            &ldquo;{character.definingQuote}&rdquo;
          </p>
        </div>
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
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
        <Users className="w-4 h-4" />
        Characters
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {characters.map((char, idx) => (
          <CharacterCard key={char.name} character={char} index={idx} />
        ))}
      </div>
    </section>
  );
}

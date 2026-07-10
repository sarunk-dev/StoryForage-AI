"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENRES } from "@/lib/types";
import type { Genre } from "@/lib/types";
import { Sparkles } from "lucide-react";

interface PromptInputProps {
  value: string;
  genre: Genre;
  isLoading: boolean;
  onChange: (value: string) => void;
  onGenreChange: (genre: Genre) => void;
  onSubmit: () => void;
}

const EXAMPLES = [
  "A blind cartographer discovers the world is flat",
  "Pirates in space who worship a dying star",
  "A detective in 1920s Shanghai who hears the last words of the dead",
  "The last librarian in a world that forgot how to read",
];

export function PromptInput({
  value,
  genre,
  isLoading,
  onChange,
  onGenreChange,
  onSubmit,
}: PromptInputProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Describe your story concept…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        rows={3}
        disabled={isLoading}
        className="resize-none text-[15px] leading-relaxed border-border/50 focus-visible:ring-primary/30 focus-visible:border-primary/40 bg-transparent placeholder:text-muted-foreground/40 transition-colors"
      />

      {/* Example chips */}
      {!value && !isLoading && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(ex)}
              className="text-xs text-muted-foreground/60 border border-border/40 rounded-full px-2.5 py-1 hover:border-primary/40 hover:text-foreground/80 transition-colors truncate max-w-[220px]"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 items-center">
        <Select
          value={genre}
          onValueChange={(v) => onGenreChange(v as Genre)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm border-border/50">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">Any genre</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="flex-1 sm:flex-none gap-2 font-semibold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoading ? "Generating…" : "Generate Pitch Deck"}
        </Button>

        <span className="text-xs text-muted-foreground/40 hidden sm:block select-none">
          ⌘↵
        </span>
      </div>
    </div>
  );
}

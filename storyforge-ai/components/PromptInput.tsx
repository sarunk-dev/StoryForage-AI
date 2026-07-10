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

export function PromptInput({
  value,
  genre,
  isLoading,
  onChange,
  onGenreChange,
  onSubmit,
}: PromptInputProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Describe your story concept… e.g. 'A blind cartographer discovers the world is flat'"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        rows={4}
        disabled={isLoading}
        className="resize-none text-base leading-relaxed bg-background border-border/60 focus:border-primary/50 transition-colors"
      />

      <div className="flex gap-3 items-center flex-wrap">
        <Select
          value={genre}
          onValueChange={(v) => onGenreChange(v as Genre)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Genre (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">No genre</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          size="lg"
          className="flex-1 sm:flex-none gap-2 font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? "Generating…" : "Generate Pitch Deck"}
        </Button>

        <p className="text-xs text-muted-foreground hidden sm:block">
          ⌘ Enter to generate
        </p>
      </div>
    </div>
  );
}

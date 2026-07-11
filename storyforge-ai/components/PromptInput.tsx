"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GENRES,
  TONES,
  LENGTHS,
  ENDINGS,
  AUDIENCES,
  ERAS,
} from "@/lib/types";
import type { StoryOptions } from "@/lib/types";
import { Sparkles, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

interface PromptInputProps {
  value: string;
  options: StoryOptions;
  isLoading: boolean;
  onChange: (value: string) => void;
  onOptionsChange: (patch: Partial<StoryOptions>) => void;
  onSubmit: () => void;
}

const EXAMPLES = [
  "A blind cartographer discovers the world is flat",
  "Pirates in space who worship a dying star",
  "A detective in 1920s Shanghai who hears the last words of the dead",
  "The last librarian in a world that forgot how to read",
];

// Shared select styling
const triggerCls = "h-9 text-sm border-border/50 bg-transparent";

// Per-select display label functions — map stored values to friendly trigger text
const GENRE_LABEL   = (v: string) => v === "None" ? "Any genre"    : v;
const TONE_LABEL    = (v: string) => v === "Any"  ? "Any tone"     : v;
const LENGTH_LABEL  = (v: string) => v === "Any"  ? "Any scope"    : v;
const ENDING_LABEL  = (v: string) => v === "Any"  ? "Any ending"   : v;
const AUDIENCE_LABEL= (v: string) => v === "Any"  ? "Any audience" : v;
const ERA_LABEL     = (v: string) => v === "Any"  ? "Any era"      : v;

// Small helper: how many advanced options are non-default
function countAdvanced(opts: StoryOptions): number {
  let n = 0;
  if (opts.audience && opts.audience !== "Any") n++;
  if (opts.era      && opts.era      !== "Any") n++;
  return n;
}

export function PromptInput({
  value,
  options,
  isLoading,
  onChange,
  onOptionsChange,
  onSubmit,
}: PromptInputProps) {
  const [advOpen, setAdvOpen] = useState(false);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
  };

  const advCount = countAdvanced(options);

  return (
    <div className="space-y-3">
      {/* Textarea */}
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
              className="text-xs text-muted-foreground/60 border border-border/40 rounded-full px-2.5 py-1 hover:border-primary/40 hover:text-foreground/80 transition-colors truncate max-w-[240px]"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* ── Row 1: Genre · Tone ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Genre */}
        <Select
          value={options.genre}
          onValueChange={(v) => onOptionsChange({ genre: v as StoryOptions["genre"] })}
          disabled={isLoading}
        >
          <SelectTrigger className={`w-[148px] ${triggerCls}`}>
            <span className="truncate">{GENRE_LABEL(options.genre)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">Any genre</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tone */}
        <Select
          value={options.tone}
          onValueChange={(v) => onOptionsChange({ tone: v as StoryOptions["tone"] })}
          disabled={isLoading}
        >
          <SelectTrigger className={`w-[185px] ${triggerCls}`}>
            <span className="truncate">{TONE_LABEL(options.tone)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any">Any tone</SelectItem>
            {TONES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Row 2: Scope · Ending · Advanced ────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Scope */}
        <Select
          value={options.length}
          onValueChange={(v) => onOptionsChange({ length: v as StoryOptions["length"] })}
          disabled={isLoading}
        >
          <SelectTrigger className={`w-[148px] ${triggerCls}`}>
            <span className="truncate">{LENGTH_LABEL(options.length)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any">Any scope</SelectItem>
            {LENGTHS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ending — right next to Scope */}
        <Select
          value={options.ending}
          onValueChange={(v) => onOptionsChange({ ending: v as StoryOptions["ending"] })}
          disabled={isLoading}
        >
          <SelectTrigger className={`w-[155px] ${triggerCls}`}>
            <span className="truncate">{ENDING_LABEL(options.ending)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any">Any ending</SelectItem>
            {ENDINGS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setAdvOpen((o) => !o)}
          disabled={isLoading}
          className={[
            "flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm transition-colors select-none",
            advOpen
              ? "border-primary/40 text-primary bg-primary/5"
              : advCount > 0
              ? "border-primary/30 text-primary/80 bg-primary/5"
              : "border-border/40 text-muted-foreground/60 hover:border-border hover:text-foreground/70",
          ].join(" ")}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Advanced</span>
          {advCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
              {advCount}
            </span>
          )}
          {advOpen
            ? <ChevronUp className="w-3 h-3 opacity-50" />
            : <ChevronDown className="w-3 h-3 opacity-50" />
          }
        </button>
      </div>

      {/* ── Tier 2: Advanced panel ───────────────────────────────────────── */}
      {advOpen && (
        <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3.5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Advanced Options
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Audience */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground/60 font-medium pl-0.5">
                Audience
              </label>
              <Select
                value={options.audience}
                onValueChange={(v) => onOptionsChange({ audience: v as StoryOptions["audience"] })}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-[175px] ${triggerCls}`}>
                  <span className="truncate">{AUDIENCE_LABEL(options.audience)}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any audience</SelectItem>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Era */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground/60 font-medium pl-0.5">
                Setting Era
              </label>
              <Select
                value={options.era}
                onValueChange={(v) => onOptionsChange({ era: v as StoryOptions["era"] })}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-[210px] ${triggerCls}`}>
                  <span className="truncate">{ERA_LABEL(options.era)}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any era</SelectItem>
                  {ERAS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset advanced */}
          {advCount > 0 && (
            <button
              type="button"
              onClick={() => onOptionsChange({ audience: "Any", era: "Any" })}
              disabled={isLoading}
              className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Reset advanced options
            </button>
          )}
        </div>
      )}

      {/* ── Submit row ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <Button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="flex-1 sm:flex-none gap-2 font-semibold h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoading ? "Generating…" : "Generate Pitch Deck"}
        </Button>
        <span className="text-xs text-muted-foreground/40 hidden sm:block select-none">⌘↵</span>
      </div>
    </div>
  );
}

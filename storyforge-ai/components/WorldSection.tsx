"use client";

import type { WorldBuilding } from "@/lib/types";
import { Globe, RefreshCw, Undo2, Check } from "lucide-react";

interface WorldSectionProps {
  world: WorldBuilding;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  hasPrevious?: boolean;
  onRollback?: () => void;
  onKeep?: () => void;
}

export function WorldSection({ world, onRegenerate, isRegenerating, hasPrevious, onRollback, onKeep }: WorldSectionProps) {
  const fields = [
    { label: "Geography & Environment", value: world.geography },
    { label: "Rules & Systems", value: world.rulesOrSystem },
    { label: "Culture & Society", value: world.culturalFlavor },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 section-label">
          <Globe className="w-3.5 h-3.5" />
          World Building
        </div>
        {onRegenerate && !hasPrevious && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Regenerate world building"
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 hover:text-primary
                       hover:bg-primary/8 border border-transparent hover:border-primary/20
                       rounded-lg px-2.5 py-1.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating…" : "Regenerate"}
          </button>
        )}
      </div>

      {/* Rollback banner — appears after a successful regeneration */}
      {hasPrevious && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2
                        animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-[11px] text-muted-foreground flex-1">
            New version generated — keep it or roll back to the previous one.
          </span>
          <button
            onClick={onRollback}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/70
                       hover:text-foreground border border-border/50 hover:border-border
                       rounded-md px-2.5 py-1 transition-colors"
          >
            <Undo2 className="w-3 h-3" />
            Roll back
          </button>
          <button
            onClick={onKeep}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary
                       hover:text-primary/80 border border-primary/30 hover:border-primary/50
                       bg-primary/8 hover:bg-primary/12 rounded-md px-2.5 py-1 transition-colors"
          >
            <Check className="w-3 h-3" />
            Keep new
          </button>
        </div>
      )}

      {/* Ink-surface setting card */}
      <div className="rounded-2xl ink-surface px-6 py-5 space-y-1.5">
        <h3 className="text-[1.35rem] font-bold tracking-tight">{world.settingName}</h3>
        <p className="text-[14px] leading-relaxed opacity-60 italic">{world.atmosphere}</p>
      </div>

      {/* Fields grid — 3 cols on wide, 1 on mobile */}
      <div className="grid gap-5 sm:grid-cols-3">
        {fields.map(({ label, value }) => (
          <div key={label} className="space-y-2">
            <div className="section-label">{label}</div>
            <p className="text-[14px] leading-relaxed text-foreground/80">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

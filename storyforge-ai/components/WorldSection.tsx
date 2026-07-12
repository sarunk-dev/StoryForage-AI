"use client";

import type { WorldBuilding } from "@/lib/types";
import { Globe, RefreshCw } from "lucide-react";

interface WorldSectionProps {
  world: WorldBuilding;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function WorldSection({ world, onRegenerate, isRegenerating }: WorldSectionProps) {
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
        {onRegenerate && (
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

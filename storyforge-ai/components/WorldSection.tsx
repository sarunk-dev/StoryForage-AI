"use client";

import type { WorldBuilding } from "@/lib/types";
import { Globe } from "lucide-react";

interface WorldSectionProps {
  world: WorldBuilding;
}

export function WorldSection({ world }: WorldSectionProps) {
  const fields = [
    { label: "Geography & Environment", value: world.geography },
    { label: "Rules & Systems", value: world.rulesOrSystem },
    { label: "Culture & Society", value: world.culturalFlavor },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 section-label">
        <Globe className="w-3.5 h-3.5" />
        World Building
      </div>

      {/* Ink-surface setting card */}
      <div className="rounded-2xl ink-surface px-6 py-5 space-y-1">
        <h3 className="text-xl font-bold tracking-tight">{world.settingName}</h3>
        <p className="text-sm leading-relaxed opacity-60 italic">{world.atmosphere}</p>
      </div>

      {/* Fields grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map(({ label, value }) => (
          <div key={label} className="space-y-1.5">
            <div className="section-label">{label}</div>
            <p className="text-sm leading-relaxed text-foreground/80">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import type { WorldBuilding } from "@/lib/types";
import { Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
        <Globe className="w-4 h-4" />
        World Building
      </div>

      <div className="bg-muted/30 rounded-xl border border-border/60 p-6 space-y-5">
        <div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight mb-1">
            {world.settingName}
          </h3>
          <p className="text-muted-foreground italic text-sm">
            {world.atmosphere}
          </p>
        </div>

        <Separator />

        <div className="grid gap-5 sm:grid-cols-3">
          {fields.map(({ label, value }) => (
            <div key={label} className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

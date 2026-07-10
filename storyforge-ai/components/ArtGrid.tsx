"use client";

import Image from "next/image";
import { Palette } from "lucide-react";

interface ArtGridProps {
  imageUrls: string[];
  isLoading?: boolean;
}

const IMAGE_LABELS = [
  "Establishing Scene",
  "Main Character",
  "World & Setting",
  "Thematic Mood",
];

function ImageSkeleton({ label }: { label: string }) {
  return (
    <div className="aspect-square bg-muted/60 rounded-xl border border-border/40 animate-pulse flex flex-col items-center justify-center gap-2">
      <div className="w-8 h-8 rounded-full bg-muted-foreground/10" />
      <span className="text-xs text-muted-foreground/50">{label}</span>
    </div>
  );
}

export function ArtGrid({ imageUrls, isLoading }: ArtGridProps) {
  const slots = [0, 1, 2, 3];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
        <Palette className="w-4 h-4" />
        Concept Art
      </div>

      <div className="grid grid-cols-2 gap-4">
        {slots.map((idx) => {
          const url = imageUrls[idx];
          const label = IMAGE_LABELS[idx];

          if (isLoading && !url) {
            return <ImageSkeleton key={idx} label={label} />;
          }

          if (!url) return null;

          return (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden border border-border/40 group"
            >
              <Image
                src={url}
                alt={label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized // base64 data URIs don't need Next.js optimization
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-xs font-medium text-white/90">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Generated with Flux 2 Pro + Flux Kontext Pro — style-matched concept art
      </p>
    </section>
  );
}

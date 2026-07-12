"use client";

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

const STAGGER = ["delay-0", "delay-75", "delay-150", "delay-300"];

function ImageSkeleton({ label, index }: { label: string; index: number }) {
  return (
    <div
      className={`aspect-square rounded-xl border border-border/30 bg-muted/40 animate-pulse flex items-end p-3 ${STAGGER[index]}`}
    >
      <span className="text-[10px] text-muted-foreground/30 font-medium">{label}</span>
    </div>
  );
}

export function ArtGrid({ imageUrls, isLoading }: ArtGridProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2 section-label">
        <Palette className="w-3.5 h-3.5" />
        Concept Art
      </div>

      {/* Uniform 2×2 square grid — consistent, stable layout */}
      <div className="grid grid-cols-2 gap-3">
        {IMAGE_LABELS.map((label, idx) => {
          const url = imageUrls[idx];

          if (url) {
            return (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-border/30 group
                           animate-in fade-in duration-500"
              >
                {/*
                  Plain <img> instead of next/image:
                  next/image blocks external hostnames unless listed in remotePatterns
                  (requires a config change + server restart). Since `unoptimized` was
                  already set, Next's optimisation pipeline was bypassed anyway — a
                  native img tag is strictly equivalent here with no extra config.
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                {/* Label overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-[10px] font-semibold text-white tracking-wide uppercase">
                    {label}
                  </span>
                </div>
              </div>
            );
          }

          if (isLoading) {
            return <ImageSkeleton key={idx} label={label} index={idx} />;
          }

          return null;
        })}
      </div>

      <p className="text-[11px] text-muted-foreground/40 text-center">
        FLUX · Pollinations AI
      </p>
    </section>
  );
}

"use client";

import { Palette, RefreshCw, Loader2, Undo2, Check } from "lucide-react";

interface ArtGridProps {
  imageUrls: string[];
  isLoading?: boolean;
  imageErrors?: (string | null)[];
  onRetry?: (index: number) => void;
  /** Called when user clicks Regenerate on a specific image slot */
  onRegenerate?: (index: number) => void;
  /** Index of the slot currently being regenerated, or null */
  regeneratingIndex?: number | null;
  /** Previous URL per slot — non-null means rollback is available */
  previousImageUrls?: (string | null)[];
  onRollback?: (index: number) => void;
  onKeep?: (index: number) => void;
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

function ImageErrorCard({
  label,
  index,
  onRetry,
}: {
  label: string;
  index: number;
  onRetry?: (index: number) => void;
}) {
  return (
    <div className="aspect-square rounded-xl border border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-3 p-4">
      <span className="text-[10px] text-muted-foreground/40 font-medium text-center">{label}</span>
      <button
        onClick={() => onRetry?.(index)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground
                   border border-border/50 rounded-lg px-3 py-1.5
                   hover:border-primary/40 hover:text-primary transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}

export function ArtGrid({
  imageUrls,
  isLoading,
  imageErrors,
  onRetry,
  onRegenerate,
  regeneratingIndex,
  previousImageUrls,
  onRollback,
  onKeep,
}: ArtGridProps) {
  // True when any slot is busy — disables all other Regenerate buttons
  const anyRegenerating = regeneratingIndex !== null && regeneratingIndex !== undefined;

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
          const isThisRegenerating = regeneratingIndex === idx;

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
                  className={[
                    "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]",
                    isThisRegenerating ? "brightness-50" : "",
                  ].join(" ")}
                />

                {/* Regenerating overlay — spinner centred over dimmed image */}
                {isThisRegenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                    <span className="text-[10px] font-semibold text-white/80 tracking-wide uppercase">
                      Regenerating…
                    </span>
                  </div>
                )}

                {/* Hover overlay — gradient + label (bottom) + Regenerate button (top-right) */}
                {!isThisRegenerating && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Bottom label */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-[10px] font-semibold text-white tracking-wide uppercase">
                        {label}
                      </span>
                    </div>

                    {/* Top-right Regenerate button */}
                    {onRegenerate && (
                      <button
                        onClick={() => onRegenerate(idx)}
                        disabled={anyRegenerating}
                        title={`Regenerate ${label}`}
                        className={[
                          "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center",
                          "bg-black/50 text-white border border-white/20",
                          "opacity-0 group-hover:opacity-100 transition-all duration-200",
                          "hover:bg-black/70 hover:scale-110 hover:border-white/40",
                          "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                        ].join(" ")}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          }

          if (isLoading && imageErrors?.[idx]) {
            return (
              <ImageErrorCard key={idx} label={label} index={idx} onRetry={onRetry} />
            );
          }

          if (isLoading) {
            return <ImageSkeleton key={idx} label={label} index={idx} />;
          }

          return null;
        })}
      </div>

      {/* Per-slot rollback banners — shown below the grid after a successful regen */}
      {IMAGE_LABELS.map((label, idx) =>
        previousImageUrls?.[idx] ? (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2
                       animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <span className="text-[11px] text-muted-foreground flex-1">
              <span className="font-medium text-foreground/70">{label}</span> updated — keep it or roll back to the previous version.
            </span>
            <button
              onClick={() => onRollback?.(idx)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/70
                         hover:text-foreground border border-border/50 hover:border-border
                         rounded-md px-2.5 py-1 transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              Roll back
            </button>
            <button
              onClick={() => onKeep?.(idx)}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary
                         hover:text-primary/80 border border-primary/30 hover:border-primary/50
                         bg-primary/8 hover:bg-primary/12 rounded-md px-2.5 py-1 transition-colors"
            >
              <Check className="w-3 h-3" />
              Keep new
            </button>
          </div>
        ) : null
      )}

      <p className="text-[11px] text-muted-foreground/40 text-center">
        FLUX · Pollinations AI
      </p>
    </section>
  );
}

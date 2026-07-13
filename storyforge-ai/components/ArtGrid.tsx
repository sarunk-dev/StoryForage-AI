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

          const hasPreviousUrl = !!previousImageUrls?.[idx];

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

                {/* Hover overlay — gradient + label/rollback strip (bottom) + Regenerate button (top-right) */}
                {!isThisRegenerating && (
                  <>
                    {/* Gradient — always visible when rollback strip is showing */}
                    <div className={[
                      "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300",
                      hasPreviousUrl ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    ].join(" ")} />

                    {/* Bottom strip — switches between plain label and rollback controls */}
                    <div className={[
                      "absolute bottom-0 left-0 right-0 transition-all duration-300",
                      hasPreviousUrl
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
                    ].join(" ")}>
                      {hasPreviousUrl ? (
                        /* Rollback strip — always visible until user decides */
                        <div className="flex items-center gap-1.5 px-2.5 py-2">
                          <span className="text-[9px] font-semibold text-white/60 tracking-wide uppercase flex-1 truncate">
                            {label}
                          </span>
                          <button
                            onClick={() => onRollback?.(idx)}
                            title="Roll back to previous"
                            className="flex items-center gap-1 text-[10px] font-medium text-white/80
                                       bg-white/15 hover:bg-white/25 border border-white/20 hover:border-white/40
                                       rounded px-2 py-1 transition-colors"
                          >
                            <Undo2 className="w-2.5 h-2.5" />
                            Roll back
                          </button>
                          <button
                            onClick={() => onKeep?.(idx)}
                            title="Keep new version"
                            className="flex items-center gap-1 text-[10px] font-semibold text-white
                                       bg-primary/70 hover:bg-primary/90 border border-primary/50
                                       rounded px-2 py-1 transition-colors"
                          >
                            <Check className="w-2.5 h-2.5" />
                            Keep
                          </button>
                        </div>
                      ) : (
                        /* Normal hover — just the label */
                        <div className="p-2.5">
                          <span className="text-[10px] font-semibold text-white tracking-wide uppercase">
                            {label}
                          </span>
                        </div>
                      )}
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

      <p className="text-[11px] text-muted-foreground/40 text-center">
        FLUX · Pollinations AI
      </p>
    </section>
  );
}

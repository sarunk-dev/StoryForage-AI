"use client";

import { Progress } from "@/components/ui/progress";
import { GENERATION_STEPS } from "@/lib/types";
import type { GenerationStep } from "@/lib/types";
import { Check, Loader2 } from "lucide-react";

interface LoadingPipelineProps {
  currentStep: GenerationStep;
}

const STEP_KEYS = GENERATION_STEPS.map((s) => s.key);

export function LoadingPipeline({ currentStep }: LoadingPipelineProps) {
  if (currentStep === "idle" || currentStep === "done") return null;

  const currentIndex = STEP_KEYS.indexOf(currentStep);
  const progressValue =
    currentStep === "error"
      ? 100
      : Math.round(((currentIndex + 0.5) / STEP_KEYS.length) * 100);

  return (
    <div className="py-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground/60 font-medium">
          Generating your pitch deck…
        </span>
        <span className="text-xs tabular-nums text-muted-foreground/40">
          {Math.round(progressValue)}%
        </span>
      </div>
      <Progress value={progressValue} className="h-1 bg-border" />

      <div className="flex flex-col gap-2">
        {GENERATION_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
                isDone
                  ? "text-muted-foreground/50"
                  : isActive
                  ? "text-foreground"
                  : "text-muted-foreground/25"
              }`}
            >
              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-current" />
                )}
              </span>
              <span className={isActive ? "font-medium" : ""}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

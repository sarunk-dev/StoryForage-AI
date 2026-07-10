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
    <div className="space-y-4 py-6">
      <Progress
        value={progressValue}
        className="h-1.5"
      />
      <div className="flex flex-col gap-2.5">
        {GENERATION_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 text-sm transition-all ${
                isDone
                  ? "text-muted-foreground"
                  : isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground/40"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-current opacity-30" />
                )}
              </span>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

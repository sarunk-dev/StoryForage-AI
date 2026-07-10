"use client";

import { Button } from "@/components/ui/button";
import type { PitchDeck } from "@/lib/types";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  deck: PitchDeck;
}

export function ExportButton({ deck }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { exportToPDF } = await import("@/lib/pdfExport");
      await exportToPDF(deck);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      size="sm"
      variant="outline"
      className="gap-1.5 font-medium border-border/60 hover:border-primary/40 hover:text-primary transition-colors"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Exporting…
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" />
          Export PDF
        </>
      )}
    </Button>
  );
}

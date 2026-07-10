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
      alert("PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      size="lg"
      variant="default"
      className="gap-2 font-semibold"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating PDF…
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}

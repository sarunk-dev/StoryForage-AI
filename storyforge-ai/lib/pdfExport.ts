import type { PitchDeck } from "./types";

/**
 * Generate and download a styled PDF pitch deck.
 * Uses html2canvas + jsPDF — fully client-side.
 * Images are already base64 data URIs, so no CORS issues.
 */
export async function exportToPDF(deck: PitchDeck): Promise<void> {
  // Dynamic imports — these are large client-only libs
  const { default: jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function newPageIfNeeded(neededHeight: number) {
    if (y + neededHeight > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  }

  function drawHRule(color = "#e5e7eb") {
    pdf.setDrawColor(color);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageW - margin, y);
    y += 4;
  }

  function label(text: string, opts: { size?: number; color?: string } = {}) {
    pdf.setFontSize(opts.size ?? 7);
    pdf.setTextColor(opts.color ?? "#9ca3af");
    pdf.setFont("helvetica", "bold");
    pdf.text(text.toUpperCase(), margin, y);
    y += 4;
  }

  function body(
    text: string,
    opts: { size?: number; color?: string; indent?: number; italic?: boolean } = {}
  ) {
    pdf.setFontSize(opts.size ?? 9.5);
    pdf.setTextColor(opts.color ?? "#374151");
    pdf.setFont("helvetica", opts.italic ? "italic" : "normal");
    const x = margin + (opts.indent ?? 0);
    const wrapped = pdf.splitTextToSize(text, contentW - (opts.indent ?? 0));
    newPageIfNeeded(wrapped.length * 4.5 + 2);
    pdf.text(wrapped, x, y);
    y += wrapped.length * 4.5 + 2;
  }

  function heading(text: string, size = 22, color = "#111827") {
    newPageIfNeeded(size * 0.5 + 4);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    pdf.setFont("helvetica", "bold");
    const wrapped = pdf.splitTextToSize(text, contentW);
    pdf.text(wrapped, margin, y);
    y += wrapped.length * (size * 0.4) + 3;
  }

  function subheading(text: string) {
    newPageIfNeeded(12);
    pdf.setFontSize(11);
    pdf.setTextColor("#1f2937");
    pdf.setFont("helvetica", "bold");
    pdf.text(text, margin, y);
    y += 6;
  }

  function spacer(h = 4) {
    y += h;
  }

  // ── Cover ─────────────────────────────────────────────────────────────────

  // Accent bar at top
  pdf.setFillColor("#3b82d4");
  pdf.rect(0, 0, pageW, 3, "F");

  y = 28;
  pdf.setFontSize(7);
  pdf.setTextColor("#9ca3af");
  pdf.setFont("helvetica", "normal");
  pdf.text("STORY PITCH DECK  ·  STORYFORGE AI", margin, y);
  if (deck.genre && deck.genre !== "None") {
    pdf.text(deck.genre.toUpperCase(), pageW - margin, y, { align: "right" });
  }
  y += 10;

  heading(deck.story.title, 28, "#111827");
  spacer(2);
  body(`"${deck.story.logline}"`, { size: 11, italic: true, color: "#6b7280" });
  spacer(6);
  body(deck.story.premise, { size: 10, color: "#374151" });
  spacer(8);
  drawHRule();

  // ── Three-act outline ─────────────────────────────────────────────────────

  label("Three-Act Structure");
  spacer(1);

  const acts = [
    { title: "Act I — Setup", text: deck.story.acts.act1 },
    { title: "Act II — Conflict", text: deck.story.acts.act2 },
    { title: "Act III — Resolution", text: deck.story.acts.act3 },
  ];

  for (const act of acts) {
    subheading(act.title);
    body(act.text, { indent: 3 });
    spacer(3);
  }

  spacer(2);
  body(`Theme: ${deck.story.theme}`, { size: 9, italic: true, color: "#6b7280" });
  spacer(2);
  drawHRule();

  // ── Characters ────────────────────────────────────────────────────────────

  label("Characters");
  spacer(2);

  for (const char of deck.characters) {
    newPageIfNeeded(40);

    pdf.setFontSize(13);
    pdf.setTextColor("#111827");
    pdf.setFont("helvetica", "bold");
    pdf.text(char.name, margin, y);

    pdf.setFontSize(9);
    pdf.setTextColor("#6b7280");
    pdf.setFont("helvetica", "italic");
    pdf.text(char.role, pageW - margin, y, { align: "right" });
    y += 6;

    body(char.physicalDescription, { italic: true, color: "#6b7280", size: 9 });
    spacer(1);
    body(char.backstory, { color: "#374151", size: 9 });
    spacer(2);

    body(`Wants: ${char.motivation}`, { size: 8.5, color: "#374151" });
    body(`Fatal flaw: ${char.fatalFlaw}`, { size: 8.5, color: "#374151" });
    spacer(2);

    body(`"${char.definingQuote}"`, {
      size: 9,
      italic: true,
      color: "#4b5563",
      indent: 4,
    });
    spacer(5);
    drawHRule("#f3f4f6");
  }

  // ── World ─────────────────────────────────────────────────────────────────

  newPageIfNeeded(30);
  label("World Building");
  spacer(2);
  subheading(deck.world.settingName);
  body(deck.world.atmosphere, { italic: true, color: "#6b7280", size: 9.5 });
  spacer(3);

  const worldFields = [
    { title: "Geography & Environment", text: deck.world.geography },
    { title: "Rules & Systems", text: deck.world.rulesOrSystem },
    { title: "Culture & Society", text: deck.world.culturalFlavor },
  ];

  for (const field of worldFields) {
    body(`${field.title}:`, { size: 9, color: "#374151" });
    body(field.text, { size: 9, indent: 4, color: "#6b7280" });
    spacer(3);
  }

  drawHRule();

  // ── Concept Art ───────────────────────────────────────────────────────────

  if (deck.imageUrls.length > 0) {
    newPageIfNeeded(10);
    label("Concept Art");
    spacer(3);

    const imgW = (contentW - 6) / 2;
    const imgH = imgW; // 1:1 images

    for (let i = 0; i < Math.min(4, deck.imageUrls.length); i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const imgX = margin + col * (imgW + 6);
      const imgY =
        row === 0 ? y : y + imgH + 5;

      newPageIfNeeded(row === 0 ? imgH * 2 + 12 : 0);

      try {
        pdf.addImage(deck.imageUrls[i], "PNG", imgX, imgY, imgW, imgH);

        // Caption
        pdf.setFontSize(7);
        pdf.setTextColor("#9ca3af");
        pdf.setFont("helvetica", "normal");
        const captions = [
          "Establishing Scene",
          "Main Character",
          "World & Setting",
          "Thematic Mood",
        ];
        pdf.text(captions[i], imgX, imgY + imgH + 3.5);
      } catch {
        // Skip image if it fails to embed
      }

      if (i === 3) y = imgY + imgH + 8;
      if (i === 1) y = imgY + imgH + 8;
    }
  }

  // ── Footer on last page ───────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (pdf as any).internal.getNumberOfPages() as number;
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(7);
    pdf.setTextColor("#d1d5db");
    pdf.text(
      `Generated by StoryForge AI  ·  ${deck.story.title}  ·  Page ${p} of ${totalPages}`,
      pageW / 2,
      pageH - 8,
      { align: "center" }
    );
    // Bottom accent bar
    pdf.setFillColor("#3b82d4");
    pdf.rect(0, pageH - 2, pageW, 2, "F");
  }

  pdf.save(`${deck.story.title.replace(/\s+/g, "-").toLowerCase()}-pitch-deck.pdf`);
}

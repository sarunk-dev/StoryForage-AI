import type { PitchDeck } from "./types";

export async function exportToPDF(deck: PitchDeck): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function newPage() {
    pdf.addPage();
    y = margin;
    // Top accent bar on every new page
    pdf.setFillColor("#1a1a2e");
    pdf.rect(0, 0, pageW, 2, "F");
  }

  function ensureSpace(needed: number) {
    if (y + needed > pageH - margin - 10) newPage();
  }

  function hrule(color = "#e5e7eb") {
    pdf.setDrawColor(color);
    pdf.setLineWidth(0.25);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;
  }

  function sectionLabel(text: string) {
    ensureSpace(10);
    pdf.setFontSize(6.5);
    pdf.setTextColor("#9ca3af");
    pdf.setFont("helvetica", "bold");
    pdf.text(text.toUpperCase(), margin, y);
    y += 5;
  }

  function bodyText(
    text: string,
    opts: { size?: number; color?: string; indent?: number; italic?: boolean } = {}
  ) {
    const size = opts.size ?? 9.5;
    const indent = opts.indent ?? 0;
    pdf.setFontSize(size);
    pdf.setTextColor(opts.color ?? "#374151");
    pdf.setFont("helvetica", opts.italic ? "italic" : "normal");
    const lines = pdf.splitTextToSize(text, contentW - indent);
    const lineH = size * 0.42;
    ensureSpace(lines.length * lineH + 2);
    pdf.text(lines, margin + indent, y);
    y += lines.length * lineH + 2;
  }

  function headingText(text: string, size = 22, color = "#111827") {
    const lines = pdf.splitTextToSize(text, contentW);
    const lineH = size * 0.42;
    ensureSpace(lines.length * lineH + 4);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    pdf.setFont("helvetica", "bold");
    pdf.text(lines, margin, y);
    y += lines.length * lineH + 3;
  }

  function gap(h = 4) { y += h; }

  // ── Cover page ────────────────────────────────────────────────────────────

  // Dark header band
  pdf.setFillColor("#0f0f1a");
  pdf.rect(0, 0, pageW, 52, "F");

  // Amber accent line
  pdf.setFillColor("#f59e0b");
  pdf.rect(0, 52, pageW, 1.5, "F");

  // Header eyebrow
  pdf.setFontSize(6.5);
  pdf.setTextColor("#6b7280");
  pdf.setFont("helvetica", "bold");
  pdf.text("STORY PITCH DECK  ·  STORYFORGE AI", margin, 20);
  if (deck.genre && deck.genre !== "None") {
    pdf.text(deck.genre.toUpperCase(), pageW - margin, 20, { align: "right" });
  }

  // Title in white on dark band
  pdf.setFontSize(26);
  pdf.setTextColor("#ffffff");
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(deck.story.title, contentW);
  pdf.text(titleLines, margin, 34);

  y = 62;

  // Logline
  bodyText(`"${deck.story.logline}"`, { size: 10.5, italic: true, color: "#4b5563" });
  gap(5);
  bodyText(deck.story.premise, { size: 9.5, color: "#374151" });
  gap(6);

  // Metadata pills (drawn as text)
  pdf.setFontSize(8);
  pdf.setTextColor("#6b7280");
  pdf.setFont("helvetica", "normal");
  const themeLines = pdf.splitTextToSize(`Theme: ${deck.story.theme}`, contentW);
  pdf.text(themeLines, margin, y);
  y += themeLines.length * 4;
  const toneLines = pdf.splitTextToSize(`Tone: ${deck.story.tone}`, contentW);
  pdf.text(toneLines, margin, y);
  y += toneLines.length * 4 + 1;

  hrule("#e5e7eb");

  // ── Three-Act Structure ───────────────────────────────────────────────────

  sectionLabel("Three-Act Structure");
  gap(1);

  const acts = [
    { label: "Act I — Setup", text: deck.story.acts.act1 },
    { label: "Act II — Conflict", text: deck.story.acts.act2 },
    { label: "Act III — Resolution", text: deck.story.acts.act3 },
  ];

  for (const act of acts) {
    ensureSpace(20);
    // Left accent bar
    pdf.setFillColor("#f59e0b");
    pdf.rect(margin, y - 3.5, 2, 4.5, "F");

    pdf.setFontSize(9.5);
    pdf.setTextColor("#111827");
    pdf.setFont("helvetica", "bold");
    pdf.text(act.label, margin + 5, y);
    y += 5;
    bodyText(act.text, { indent: 5, color: "#4b5563", size: 9 });
    gap(4);
  }

  hrule();

  // ── Characters ────────────────────────────────────────────────────────────

  sectionLabel("Characters");
  gap(2);

  for (const char of deck.characters) {
    ensureSpace(45);

    // Character name row
    pdf.setFontSize(12);
    pdf.setTextColor("#111827");
    pdf.setFont("helvetica", "bold");
    pdf.text(char.name, margin, y);
    pdf.setFontSize(8.5);
    pdf.setTextColor("#6b7280");
    pdf.setFont("helvetica", "italic");
    pdf.text(char.role, pageW - margin, y, { align: "right" });
    y += 5.5;

    bodyText(char.physicalDescription, { italic: true, color: "#6b7280", size: 8.5 });
    gap(1);
    bodyText(char.backstory, { color: "#374151", size: 9 });
    gap(2);

    // Wants / Flaw row
    pdf.setFontSize(8.5);
    pdf.setTextColor("#374151");
    pdf.setFont("helvetica", "normal");
    const col1 = `Wants: ${char.motivation}`;
    const col2 = `Flaw: ${char.fatalFlaw}`;
    const halfW = (contentW - 6) / 2;
    const col1Lines = pdf.splitTextToSize(col1, halfW);
    const col2Lines = pdf.splitTextToSize(col2, halfW);
    const rowH = Math.max(col1Lines.length, col2Lines.length) * 3.8 + 6;
    ensureSpace(rowH);
    pdf.setFillColor("#f9fafb");
    pdf.roundedRect(margin, y - 3, halfW, rowH - 1, 1.5, 1.5, "F");
    pdf.roundedRect(margin + halfW + 6, y - 3, halfW, rowH - 1, 1.5, 1.5, "F");
    pdf.text(col1Lines, margin + 2, y + 1);
    pdf.text(col2Lines, margin + halfW + 8, y + 1);
    y += rowH + 1;

    // Defining quote
    bodyText(`"${char.definingQuote}"`, { size: 8.5, italic: true, color: "#6b7280", indent: 3 });
    gap(4);
    hrule("#f3f4f6");
  }

  // ── World Building ────────────────────────────────────────────────────────

  ensureSpace(30);
  sectionLabel("World Building");
  gap(2);

  headingText(deck.world.settingName, 14, "#111827");
  bodyText(deck.world.atmosphere, { italic: true, color: "#6b7280", size: 9.5 });
  gap(4);

  for (const [title, text] of [
    ["Geography & Environment", deck.world.geography],
    ["Rules & Systems", deck.world.rulesOrSystem],
    ["Culture & Society", deck.world.culturalFlavor],
  ]) {
    ensureSpace(16);
    pdf.setFontSize(8.5);
    pdf.setTextColor("#111827");
    pdf.setFont("helvetica", "bold");
    pdf.text(title, margin, y);
    y += 4.5;
    bodyText(text, { size: 9, indent: 3, color: "#4b5563" });
    gap(3);
  }

  hrule();

  // ── Concept Art ───────────────────────────────────────────────────────────
  // Fix: compute all 4 image positions absolutely before drawing any image.
  // This prevents mid-grid page breaks from corrupting the second row's Y offset.

  // Filter out empty-string slots (sparse array — slot not yet loaded) before rendering
  const loadedImages = deck.imageUrls.map((url, idx) => ({ url, idx })).filter(({ url }) => !!url);

  if (loadedImages.length > 0) {
    const captions = ["Establishing Scene", "Main Character", "World & Setting", "Thematic Mood"];
    const imgW = (contentW - 6) / 2;
    const imgH = imgW; // square — matches 768×768 generated images
    const captionH = 5;
    const rowGap = 6;
    const totalGridH = imgH * 2 + captionH * 2 + rowGap + 12;

    // Force a new page if the full 2×2 grid + captions won't fit
    if (y + totalGridH > pageH - margin - 10) newPage();

    sectionLabel("Concept Art");
    gap(3);

    const gridTop = y; // fixed anchor — never changes mid-grid

    for (let i = 0; i < Math.min(4, loadedImages.length); i++) {
      const { url: imgUrl, idx: slotIdx } = loadedImages[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const imgX = margin + col * (imgW + 6);
      const imgY = gridTop + row * (imgH + captionH + rowGap);

      try {
        pdf.addImage(imgUrl, "PNG", imgX, imgY, imgW, imgH);
        pdf.setFontSize(6.5);
        pdf.setTextColor("#9ca3af");
        pdf.setFont("helvetica", "normal");
        pdf.text(captions[slotIdx] ?? captions[i], imgX, imgY + imgH + 3.5);
      } catch {
        // If image embed fails, draw a placeholder rect
        pdf.setFillColor("#f3f4f6");
        pdf.roundedRect(imgX, imgY, imgW, imgH, 2, 2, "F");
        pdf.setFontSize(7);
        pdf.setTextColor("#9ca3af");
        pdf.text(captions[i], imgX + imgW / 2, imgY + imgH / 2, { align: "center" });
      }
    }

    // Advance y past the full grid
    y = gridTop + totalGridH;
  }

  // ── Footer on every page ──────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (pdf as any).internal.getNumberOfPages() as number;
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(6.5);
    pdf.setTextColor("#d1d5db");
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `StoryForge AI  ·  ${deck.story.title}  ·  Page ${p} of ${totalPages}`,
      pageW / 2,
      pageH - 7,
      { align: "center" }
    );
    pdf.setFillColor("#f59e0b");
    pdf.rect(0, pageH - 1.5, pageW, 1.5, "F");
  }

  pdf.save(`${deck.story.title.replace(/\s+/g, "-").toLowerCase()}-pitch-deck.pdf`);
}

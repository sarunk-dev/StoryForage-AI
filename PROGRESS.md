# StoryForge AI — Build Progress Log

> **Living document.** Updated after every meaningful work session.
> One source of truth for: what's done, what's next, decisions made, issues resolved.

| | |
|---|---|
| **Project** | StoryForge AI — Story Pitch Generator |
| **Challenge** | IBM AI Builders · July 2026 · Creative Industries theme |
| **Deadline** | July 31, 2026 @ 11:59 PM ET |
| **Solo dev** | Yes |
| **Bob token budget** | 60 tokens |
| **PRD** | [`PRD_Final.md`](PRD_Final.md) (v1.1) |

---

## 📊 Quick Status

| Area | Status | Notes |
|---|---|---|
| PRD & architecture | ✅ Done | v1.1 finalized |
| Skills installed | ✅ Done | vercel-react-best-practices, shadcn, deployment-pipeline-design |
| Next.js project scaffold | ✅ Done | `storyforge-ai/`, shadcn/ui, Tailwind, all deps |
| `lib/types.ts` | ✅ Done | All TypeScript interfaces + step types + StoryOptions (6 fields) |
| `lib/prompts.ts` | ✅ Done | 4 prompt templates — story/character/world/art; advanced options + singleArtPrompt |
| `lib/granite.ts` | ✅ Done | WatsonXAI client, generateJSON with retry, parseJSON |
| `lib/replicate.ts` | ✅ Done | Pollinations.ai (free, no key) — 768×768 FLUX, retry logic |
| `lib/pdfExport.ts` | ✅ Done | Full styled A4 jsPDF export with images; theme+tone on separate lines |
| `app/api/generate/route.ts` | ✅ Done | Sequential 4-step Granite chain with advanced options |
| `app/api/images/route.ts` | ✅ Done | Pollinations image generation, index-based dispatch |
| `app/api/narrate/route.ts` | ✅ Done | ElevenLabs TTS — per-genre voices, per-act dynamics, client-side retry |
| `app/api/regenerate/route.ts` | ✅ Done | **Beyond PRD** — per-section Granite regeneration (story/chars/world/imagePrompt) |
| `components/PromptInput.tsx` | ✅ Done | Single-row layout: Genre + Scope + Advanced panel (Tone/Ending/Audience/Era) |
| `components/LoadingPipeline.tsx` | ✅ Done | 6-step animated progress indicator (incl. audio step) |
| `components/StorySection.tsx` | ✅ Done | Story outline + per-act audio playback + Regenerate + Rollback/Keep UX |
| `components/CharacterCard.tsx` | ✅ Done | Character cards + CharactersSection + Regenerate + Rollback/Keep UX |
| `components/WorldSection.tsx` | ✅ Done | World-building display + Regenerate + Rollback/Keep UX |
| `components/ArtGrid.tsx` | ✅ Done | 2×2 square grid, per-image Regenerate, Rollback/Keep, spinner overlay |
| `components/ExportButton.tsx` | ✅ Done | PDF download trigger (lazy-loaded) |
| `components/DemoDeck.tsx` | ✅ Done | **Beyond PRD** — static sample output on landing page; judges see quality immediately |
| `app/page.tsx` | ✅ Done | Full wired UI, progressive reveal, dark mode, error states, abort controller |
| TypeScript build | ✅ Passing | `tsc --noEmit` — 0 errors |
| End-to-end pipeline test | ✅ Working | Story → characters → world → art prompts → images → audio (3 acts) → PDF |
| Audio narration (3 acts) | ✅ Fixed | All 3 acts generating; client-side retry + 2s gaps between calls |
| Image display (web) | ✅ Fixed | Square aspect ratio, object-cover, no stretch/crop |
| PDF layout | ✅ Fixed | Theme + Tone on separate lines; images square to match 768×768 output |
| **Vercel deployment** | 🚫 **SKIPPED** | **Demo recorded on localhost only — see note below** |
| README.md | ✅ Done | Submission-ready README written |
| Demo video script | ✅ Done | Full 3-minute script in Phase 6 below |
| Demo rehearsal | ⬜ Not started | Run on localhost before recording |
| Submission page | ⬜ Not started | |

> ### ⚠️ Phase 4 — Deployment SKIPPED
> **Decision:** Vercel deployment is being skipped. The demo video will be recorded on `localhost:3000`.
> All features work fully in the local dev environment. The submission will include the GitHub repo with
> complete setup instructions so the app can be run locally by anyone evaluating it.
> This avoids the risk of Vercel cold starts, environment variable misconfiguration, or deployment
> issues affecting the demo video within the remaining submission window.

**Bob tokens used:** ~20–25 / 60 _(estimated — audio fixes, UI polish, PDF fixes, image pipeline, regenerate/rollback system)_

---

## ✅ Completed Work

### Skills Installed (Pre Day 1)

| Skill | Purpose |
|---|---|
| `vercel-react-best-practices` | React/Next.js best practices guidance |
| `shadcn` | shadcn/ui component patterns |
| `deployment-pipeline-design` | Vercel deployment patterns |

---

### Pre-Build Planning (Pre Day 1)

**Replicate API integrations validated (Python test scripts):**

| File | Model | Status |
|---|---|---|
| `MytestedFiles/flux_2_pro_test.py` | `black-forest-labs/flux-2-pro` | ✅ Working |
| `MytestedFiles/flux_kontext_test.py` | `black-forest-labs/flux-kontext-pro` | ✅ Working |
| `MytestedFiles/Elevnlab_test.py` | ElevenLabs TTS v1 | ✅ Working |

**Architecture decisions:** Sequential prompt chain (not LangGraph), Next.js API routes (not FastAPI), client-side jsPDF (not html2canvas).

---

### Phase 1 — Foundation ✅ COMPLETE

- [x] Next.js scaffold + shadcn/ui + Tailwind + all deps
- [x] `lib/types.ts` — all interfaces + `StoryOptions` + `GenerationStep`
- [x] `lib/prompts.ts` — 4 prompt templates with JSON schemas
- [x] `lib/granite.ts` — WatsonXAI client, retry, parseJSON
- [x] `lib/replicate.ts` — Pollinations.ai, FLUX, 768×768, base64 output
- [x] `app/api/generate/route.ts` — sequential Granite chain
- [x] `app/api/images/route.ts` — image generation endpoint
- [x] All UI components built and wired
- [x] `app/page.tsx` — full end-to-end UI
- [x] `tsc --noEmit` passing, 0 errors

---

### Phase 2 — API Integration + Polish ✅ COMPLETE

- [x] End-to-end pipeline confirmed working (Granite + Pollinations + jsPDF)
- [x] Switched image provider: Replicate (paid) → **Pollinations.ai** (free, no API key needed)
- [x] Pollinations 429 rate-limit handling: sequential generation + exponential retry
- [x] **ElevenLabs audio narration added** — per-act TTS playback in StorySection
  - Per-genre voice profiles (George/Harry/Brian/Sarah/Callum/Charlie/Daniel)
  - Per-act dynamics overlay (stability + style tuning per act)
  - Text pre-processing for natural delivery
- [x] **Advanced story options added** — Tone, Ending, Audience, Era dropdowns in collapsible panel
- [x] **Scope selector added** — Short Story / Feature Film / TV Pilot / Video Game / Book Series
- [x] **Dark mode** toggle added to header
- [x] **PDF export** — full styled A4 with all content and 4 images
- [x] **UI redesign** — wider layout (max-w-5xl), amber accent, improved typography
- [x] **Genre expansion** — 8 genres total: Fantasy, Sci-Fi, Thriller, Horror, Romance, Historical, Mystery, Adventure

---

### Phase 3 — Bug Fixes & Polish ✅ COMPLETE

- [x] **Audio fix — all 3 acts:** Root cause was server-side retry loop with `sleep()` hitting dev-mode Node timeout; fixed by moving retry logic to client (`page.tsx`): 2 sweeps × 3s back-off, 2s gap between acts
- [x] **Image display fix:** `object-cover` + `aspect-square` (web) matched to 768×768 FLUX output — no stretch, no letterbox
- [x] **PDF fix — Tone bleeding:** Theme and Tone now on separate wrapped lines via `splitTextToSize`; no longer overflows the page border
- [x] **Image prompts reverted** to `65370ef` state — simpler, more open-ended format produced better concept art
- [x] **Prompt input layout** — collapsed to single row; Tone + Ending moved into Advanced panel; badge counter includes all 4 advanced fields
- [x] **ArtGrid** — `animate-in fade-in` on each image as it loads; stable 4-slot layout prevents shift during generation

---

### Phase 3b — Beyond-PRD Features ✅ COMPLETE

These features were not in the original PRD but were built during the sprint and significantly strengthen the demo.

- [x] **`/api/regenerate` route** — new endpoint that re-runs any single step of the Granite chain using the existing deck as context; supports targets: `story`, `characters`, `world`, `imagePrompt`
- [x] **Per-section Regenerate buttons** — Story, Characters, and World each have a Regenerate button that calls `/api/regenerate` and patches only that slice of the deck
- [x] **Per-image Regenerate** — each of the 4 concept art images has a hover Regenerate button; Granite first rewrites the art prompt for that slot, then FLUX generates the new image
- [x] **Rollback / Keep UX** — every regeneration (text sections + individual images) snapshots the previous version and shows a `Roll back / Keep new` banner until dismissed; one-click undo
- [x] **Manual "Generate Audio" button** — after story regeneration, audio is cleared and the user can explicitly re-request narration via a `Regenerate Audio` button in the three-act section
- [x] **DemoDeck component** — static hardcoded sample pitch deck shown on the landing page so judges see output quality immediately without waiting for a generation
- [x] **AbortController wiring** — re-submitting a new prompt cancels any in-flight Granite API call cleanly via `req.signal` propagation
- [x] **Parallel audio + image generation** — narration and image generation fire simultaneously after text gen; audio play buttons appear act-by-act as each finishes, without waiting for images
- [x] **IBM Granite 4 attribution badge** — prominent blue `IBM Granite 4` pill in the Story section header for judge visibility
- [x] **Example prompt chips** — 4 clickable example concepts on the landing page so judges can try the app with one click
- [x] **`singleArtPrompt` prompt template** — dedicated Granite prompt for per-image regeneration, referencing current story/characters/world state so the new image stays coherent with the deck

---

### Phase 4 — Deployment 🚫 SKIPPED

> **Intentional decision.** Demo recorded on `localhost:3000`. See ⚠️ note in Quick Status above.

---

### Phase 5 — README ✅ COMPLETE

- [x] README written at `storyforge-ai/README.md`
- [x] Problem statement
- [x] Solution description + architecture
- [x] AI approach: Granite (text) + Pollinations/FLUX (images) + ElevenLabs (audio)
- [x] How IBM Bob was used
- [x] Setup instructions (`npm install`, `.env.local` keys, `npm run dev`)
- [x] Feature list (including all beyond-PRD features)
- [x] Note on localhost demo

---

## 📋 Remaining Tasks

### Phase 6 — Demo Video Script

> Full 3-minute script for localhost recording. Practice this before recording.

---

**DEMO VIDEO — Full Script (Target: 3 minutes max)**

**Setup before recording:**
- `npm run dev` running at `localhost:3000`
- Browser at 100% zoom, window full-screen
- DemoDeck expanded (it is by default)
- Have this prompt ready to paste: *"A detective in 1920s Shanghai who can hear the last words of the dead"*

---

**[0:00 – 0:12] — Hook (voice only, screen shows landing page)**

> *"Writers and game designers have sparks of ideas constantly — but turning a concept into a shareable pitch deck takes days of writing, sourcing art, and formatting. StoryForge AI does all of it in under 60 seconds."*

---

**[0:12 – 0:30] — Show the DemoDeck (no generation yet)**

Scroll slowly through the pre-loaded sample output already on screen.

> *"This is what the output looks like. A complete story pitch deck — title, logline, three-act structure, characters, world-building, and four pieces of concept art. Generated from a single sentence. Let me show you how it's made."*

---

**[0:30 – 0:50] — Input & Options**

Type the prompt live: *"A detective in 1920s Shanghai who can hear the last words of the dead"*

Select **Thriller** from the genre dropdown.

Click **Advanced** to open the panel briefly.

> *"I'll set the genre to Thriller, and here in the Advanced panel I can dial in the tone, era, audience, and ending type. I'll set the era to Industrial / Victorian and leave the rest open."*

Close the Advanced panel.

> *"Then I hit Generate."*

---

**[0:50 – 1:50] — Generation (watch the pipeline)**

Click **Generate Pitch Deck**. Watch the 6-step progress bar.

Narrate each step as it advances:

> *"Step one — IBM Granite 4 is writing the story outline, three-act structure, logline and theme."*

> *"Step two — characters. Granite creates three fully-formed characters grounded in the acts it just wrote — names, backstory, motivation, fatal flaw."*

> *"Step three — world building. The setting, geography, rules and atmosphere — all consistent with the story."*

> *"Step four — art prompts. Granite writes four cinematic image descriptions referencing the actual character names and locations from the story."*

> *"Step five — ElevenLabs is narrating all three acts. The voice and dynamics change per genre — Thriller gets a tense, close reading."*

> *"Step six — FLUX is generating the concept art. Each image appears as it arrives."*

---

**[1:50 – 2:15] — Reveal: Story + Audio**

Scroll to the story section. Pause on the title and logline.

> *"Here's the generated pitch deck. Notice the IBM Granite 4 badge — that's confirming the IBM tech at work."*

Click the **play button** on Act I to play the audio narration.

> *"Each act has its own narration. The voice profile, stability, and delivery style are tuned to the genre."*

Stop the audio. Scroll down to characters.

> *"Three fully-formed characters — protagonist, antagonist, each with a backstory that's consistent with the three acts above them."*

---

**[2:15 – 2:35] — Reveal: Art + Regenerate**

Scroll to the concept art grid.

> *"Four concept art images from FLUX, described by Granite from the actual story content — the protagonist's physical description, the setting name, the tone."*

Hover over one image. Click the **Regenerate** icon (circular arrow, top-right of image).

> *"Every image — and every text section — can be individually regenerated. Granite rewrites the prompt, FLUX produces a new image."*

Wait for the new image. Show the **Roll back / Keep** banner.

> *"And if I don't like the new version, I can roll back to the previous one with one click."*

Click **Keep**.

---

**[2:35 – 2:50] — PDF Export**

Click **Export PDF** in the header.

> *"One click — the full pitch deck downloads as a print-ready PDF. Cover page, three acts, all three character profiles, world notes, and all four images."*

Briefly show the PDF open.

---

**[2:50 – 3:00] — Close**

> *"One prompt. A complete story pitch deck — outline, characters, world, concept art, audio narration, and an exportable PDF. All coherent, all from IBM Granite. StoryForge AI."*

---

### Phase 7 — Submission (Deadline: July 31, 11:59 PM ET)

- [ ] Make GitHub repo public
- [ ] Record final demo video on localhost (use script above)
- [ ] Complete submission page on challenge platform:
  - [ ] Project + team member details
  - [ ] GitHub repo link
  - [ ] Demo video link
- [ ] IBM SkillsBuild learning certificate uploaded
- [ ] Submit before deadline ✅

---

## 🐛 Issues & Resolutions

| Date | Issue | Root Cause | Resolution |
|---|---|---|---|
| Sprint | Replicate (paid) unavailable | No Replicate token budget | Switched to Pollinations.ai (free, no key, FLUX model) |
| Sprint | Act 2 + Act 3 audio silent | Server-side retry loop with `sleep()` hit implicit ~10s Node dev timeout | Moved retry to client: 2 sweeps + 3s back-off, 2s gaps between act calls |
| Sprint | Images stretched/zoomed in web | `object-cover` on non-square images; different per-slot aspect ratios | Reverted all slots to 768×768 square; `aspect-square` + `object-cover` = perfect fit |
| Sprint | Tone bleeding off PDF border | Theme + Tone on one unbreakable line — `pdf.text()` has no wrapping | Split into two separate `splitTextToSize` → `pdf.text()` calls |
| Sprint | Act 3 audio missing (earlier) | No retry + no `maxDuration` on route | Added `maxDuration = 30` + 500ms gaps (later superseded by client-side retry fix) |
| Sprint | Image prompts too rigid | Over-specified format with 4:3 ratio hints and per-slot rules | Reverted to simpler open-ended `65370ef` format — better outputs |

---

## 💡 Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| Pre-sprint | Sequential chain (not LangGraph) | Same coherence, far less complexity for solo 2-week build |
| Pre-sprint | Next.js API routes (not FastAPI) | One repo, one deploy, zero ops |
| Pre-sprint | jsPDF (not html2canvas) | Client-side, no CORS issues, precise layout control |
| Sprint | Switched Replicate → Pollinations.ai | Free, no API key, FLUX model, same base64 output pattern |
| Sprint | Added ElevenLabs TTS narration | Strong differentiator — audio brings the pitch deck to life |
| Sprint | Added advanced story options (Tone/Ending/Audience/Era/Scope) | More creative control → better outputs → stronger demo |
| Sprint | Audio retry moved to client-side | Server-side `sleep()` inside route hit dev-mode Node timeout; client has no such limit |
| Sprint | Image prompts reverted to `65370ef` | Simpler prompts produced better, more consistent concept art |
| Sprint | All images 768×768 square | Uniform size = perfect fit in `aspect-square` grid; no per-slot dimension complexity |
| Sprint | Added `/api/regenerate` + rollback UX | Per-section + per-image regeneration with undo is a major demo differentiator |
| Sprint | Added DemoDeck static component | Judges see output quality immediately on page load without waiting 60s |
| **Final** | **Skip Vercel deployment** | **Demo recorded on localhost — avoids deployment risk in final submission window** |

---

## 📦 Submission Checklist (Final)

- [ ] Working prototype using IBM Bob as primary dev tool
- [ ] IBM SkillsBuild learning certificate completed and uploaded
- [ ] Public GitHub repository with `README.md` containing:
  - [x] Problem statement
  - [x] Solution description
  - [x] AI approach and architecture
  - [x] Selected challenge theme (Creative Industries)
  - [x] How IBM Bob was used
- [ ] Published project page on challenge platform with:
  - [ ] Project and team member details
  - [ ] Link to GitHub repository
  - [ ] Publicly accessible demo/presentation video (max 3 minutes)

---

## 📎 Key Files Reference

| File | Purpose |
|---|---|
| [`PRD_Final.md`](PRD_Final.md) | Full product spec, architecture, build plan, Bob budget |
| [`PROGRESS.md`](PROGRESS.md) | This file — living build log |
| [`storyforge-ai/README.md`](storyforge-ai/README.md) | Submission README — setup, features, architecture, Bob usage |
| [`storyforge-ai/app/api/narrate/route.ts`](storyforge-ai/app/api/narrate/route.ts) | ElevenLabs TTS route — per-genre voices, per-act dynamics |
| [`storyforge-ai/app/api/generate/route.ts`](storyforge-ai/app/api/generate/route.ts) | Granite sequential chain |
| [`storyforge-ai/app/api/images/route.ts`](storyforge-ai/app/api/images/route.ts) | Pollinations image generation |
| [`storyforge-ai/app/api/regenerate/route.ts`](storyforge-ai/app/api/regenerate/route.ts) | Per-section + per-image Granite regeneration |
| [`storyforge-ai/lib/pdfExport.ts`](storyforge-ai/lib/pdfExport.ts) | jsPDF styled A4 export |
| [`storyforge-ai/components/StorySection.tsx`](storyforge-ai/components/StorySection.tsx) | Story outline + audio player buttons + regenerate/rollback |
| [`storyforge-ai/components/ArtGrid.tsx`](storyforge-ai/components/ArtGrid.tsx) | 2×2 image grid + per-image regenerate + rollback |
| [`storyforge-ai/components/DemoDeck.tsx`](storyforge-ai/components/DemoDeck.tsx) | Static sample pitch deck on landing page |
| [`MytestedFiles/Elevnlab_test.py`](MytestedFiles/Elevnlab_test.py) | ✅ Validated ElevenLabs TTS pattern |
| [`MytestedFiles/flux_2_pro_test.py`](MytestedFiles/flux_2_pro_test.py) | ✅ Validated Flux 2 Pro pattern (reference) |
| [`MytestedFiles/flux_kontext_test.py`](MytestedFiles/flux_kontext_test.py) | ✅ Validated Flux Kontext Pro pattern (reference) |

---

*Last updated: Phase 4 skipped (localhost demo). Phase 5 README complete. Phase 6 demo script ready. Phase 3b beyond-PRD features logged. Ready for recording and submission.*

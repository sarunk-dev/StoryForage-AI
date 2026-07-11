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
| `lib/types.ts` | ✅ Done | All TypeScript interfaces + step types + StoryOptions |
| `lib/prompts.ts` | ✅ Done | 4 prompt templates — story/character/world/art; advanced options support |
| `lib/granite.ts` | ✅ Done | WatsonXAI client, generateJSON with retry, parseJSON |
| `lib/replicate.ts` | ✅ Done | Pollinations.ai (free, no key) — 768×768 FLUX, retry logic |
| `lib/pdfExport.ts` | ✅ Done | Full styled A4 jsPDF export with images; theme+tone on separate lines |
| `app/api/generate/route.ts` | ✅ Done | Sequential 4-step Granite chain with advanced options |
| `app/api/images/route.ts` | ✅ Done | Pollinations image generation, index-based dispatch |
| `app/api/narrate/route.ts` | ✅ Done | ElevenLabs TTS — per-genre voices, per-act dynamics, client-side retry |
| `components/PromptInput.tsx` | ✅ Done | Single-row layout: Genre + Scope + Advanced panel (Tone/Ending/Audience/Era) |
| `components/LoadingPipeline.tsx` | ✅ Done | 6-step animated progress indicator (incl. audio step) |
| `components/StorySection.tsx` | ✅ Done | Story outline + per-act audio playback buttons |
| `components/CharacterCard.tsx` | ✅ Done | Character cards + CharactersSection |
| `components/WorldSection.tsx` | ✅ Done | World-building display |
| `components/ArtGrid.tsx` | ✅ Done | 2×2 square grid, object-cover, hover label overlay |
| `components/ExportButton.tsx` | ✅ Done | PDF download trigger (lazy-loaded) |
| `app/page.tsx` | ✅ Done | Full wired UI, progressive reveal, dark mode, error states |
| TypeScript build | ✅ Passing | `tsc --noEmit` — 0 errors |
| End-to-end pipeline test | ✅ Working | Story → characters → world → art prompts → images → audio (3 acts) → PDF |
| Audio narration (3 acts) | ✅ Fixed | All 3 acts generating; client-side retry + 2s gaps between calls |
| Image display (web) | ✅ Fixed | Square aspect ratio, object-cover, no stretch/crop |
| PDF layout | ✅ Fixed | Theme + Tone on separate lines; images square to match 768×768 output |
| Vercel deployment | ⬜ Not started | |
| README.md | ⬜ Not started | Required for submission |
| Demo rehearsal | ⬜ Not started | |
| Submission page | ⬜ Not started | |

**Bob tokens used:** ~15–20 / 60 _(estimated — audio fixes, UI polish, PDF fixes, image pipeline)_

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
- [x] **Dark mode** toggle added to header
- [x] **PDF export** — full styled A4 with all content and 4 images
- [x] **UI redesign** — wider layout (max-w-5xl), amber accent, improved typography

---

### Phase 3 — Bug Fixes & Polish ✅ COMPLETE

- [x] **Audio fix — all 3 acts:** Root cause was server-side retry loop with `sleep()` hitting dev-mode Node timeout; fixed by moving retry logic to client (`page.tsx`): 2 attempts × 3s back-off, 2s gap between acts
- [x] **Image display fix:** `object-cover` + `aspect-square` (web) matched to 768×768 FLUX output — no stretch, no letterbox
- [x] **PDF fix — Tone bleeding:** Theme and Tone now on separate wrapped lines via `splitTextToSize`; no longer overflows the page border
- [x] **Image prompts reverted** to `65370ef` state — simpler, more open-ended format produced better concept art
- [x] **Prompt input layout** — collapsed to single row; Tone + Ending moved into Advanced panel; badge counter includes all 4 advanced fields
- [x] **ArtGrid** — `animate-in fade-in` on each image as it loads; stable 4-slot layout prevents shift during generation

---

## 🔄 In Progress

_Nothing active. Phase 3 complete._

---

## 📋 Remaining Tasks

### Phase 4 — Deployment (Manual)

- [ ] `vercel deploy` from `storyforge-ai/` root
- [ ] Set env vars in Vercel dashboard:
  - `WATSONX_API_KEY`
  - `WATSONX_PROJECT_ID`
  - `ELEVENLABS_API_KEY`
  - _(no key needed for Pollinations)_
- [ ] Test full pipeline on live Vercel URL
- [ ] Chrome + Firefox cross-browser check
- [ ] Confirm PDF download works on deployed URL
- [ ] Confirm audio plays on deployed URL (browser autoplay policy check)

### Phase 5 — README (Required for Submission)

- [ ] Write `README.md` covering:
  - [ ] Problem statement
  - [ ] Solution description + architecture diagram
  - [ ] AI approach: Granite (text) + Pollinations/FLUX (images) + ElevenLabs (audio)
  - [ ] How IBM Bob was used (specific sessions + what it built)
  - [ ] Setup instructions (`npm install`, `.env.local` keys, `npm run dev`)
  - [ ] Live demo URL

### Phase 6 — Demo Rehearsal (Manual)

- [ ] Run full pipeline 5× with different prompts and genres
- [ ] Time each run — target ≤60s for text, ≤90s including images
- [ ] Check audio plays cleanly for all 3 acts across genres
- [ ] Record a practice run of the 90-second demo script (see PRD §H.3)
- [ ] Watch it back — fix any awkward moments

### Phase 7 — Submission (Deadline: July 31, 11:59 PM ET)

- [ ] Make GitHub repo public
- [ ] Record final demo video (max 3 minutes)
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
| Sprint | Act 2 + Act 3 audio silent | Server-side retry loop with `sleep()` hit implicit ~10s Node dev timeout | Moved retry to client: 2 attempts + 3s back-off, 2s gaps between act calls |
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
| Sprint | Added advanced story options (Tone/Ending/Audience/Era) | More creative control → better outputs → stronger demo |
| Sprint | Audio retry moved to client-side | Server-side `sleep()` inside route hit dev-mode Node timeout; client has no such limit |
| Sprint | Image prompts reverted to `65370ef` | Simpler prompts produced better, more consistent concept art |
| Sprint | All images 768×768 square | Uniform size = perfect fit in `aspect-square` grid; no per-slot dimension complexity |

---

## 📦 Submission Checklist (Final)

- [ ] Working prototype using IBM Bob as primary dev tool
- [ ] IBM SkillsBuild learning certificate completed and uploaded
- [ ] Public GitHub repository with `README.md` containing:
  - [ ] Problem statement
  - [ ] Solution description
  - [ ] AI approach and architecture
  - [ ] Selected challenge theme (Creative Industries)
  - [ ] How IBM Bob was used
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
| [`storyforge-ai/app/api/narrate/route.ts`](storyforge-ai/app/api/narrate/route.ts) | ElevenLabs TTS route — per-genre voices, per-act dynamics |
| [`storyforge-ai/app/api/generate/route.ts`](storyforge-ai/app/api/generate/route.ts) | Granite sequential chain |
| [`storyforge-ai/app/api/images/route.ts`](storyforge-ai/app/api/images/route.ts) | Pollinations image generation |
| [`storyforge-ai/lib/pdfExport.ts`](storyforge-ai/lib/pdfExport.ts) | jsPDF styled A4 export |
| [`storyforge-ai/components/StorySection.tsx`](storyforge-ai/components/StorySection.tsx) | Story outline + audio player buttons |
| [`MytestedFiles/Elevnlab_test.py`](MytestedFiles/Elevnlab_test.py) | ✅ Validated ElevenLabs TTS pattern |
| [`MytestedFiles/flux_2_pro_test.py`](MytestedFiles/flux_2_pro_test.py) | ✅ Validated Flux 2 Pro pattern (reference) |
| [`MytestedFiles/flux_kontext_test.py`](MytestedFiles/flux_kontext_test.py) | ✅ Validated Flux Kontext Pro pattern (reference) |

---

*Last updated: Phase 3 complete. Audio (all 3 acts), images, and PDF all working. Ready for deployment.*

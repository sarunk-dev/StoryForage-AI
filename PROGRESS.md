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
| Replicate API (Flux 2 Pro) | ✅ Tested & working | `MytestedFiles/flux_2_pro_test.py` |
| Replicate API (Flux Kontext Pro) | ✅ Tested & working | `MytestedFiles/flux_kontext_test.py` |
| IBM Granite integration | ⬜ Not started | |
| Next.js project scaffold | ⬜ Not started | |
| Frontend components | ⬜ Not started | |
| PDF export | ⬜ Not started | |
| End-to-end pipeline | ⬜ Not started | |
| Vercel deployment | ⬜ Not started | |
| Demo rehearsal | ⬜ Not started | |
| Submission page | ⬜ Not started | |

**Bob tokens used:** 0 / 60 _(pre-build planning phase, no code tasks started yet)_

---

## ✅ Completed Work

### Pre-Build Planning (Pre Day 1)

**Date:** Before sprint start

#### API Integrations Validated

| File | Model | Status | Key findings |
|---|---|---|---|
| `MytestedFiles/flux_2_pro_test.py` | `black-forest-labs/flux-2-pro` | ✅ Working | Uses `replicate.run()` sync; output has `.url` and `.read()` methods; supports `resolution`, `aspect_ratio`, `output_format`, `output_quality`, `safety_tolerance` params |
| `MytestedFiles/flux_kontext_test.py` | `black-forest-labs/flux-kontext-pro` | ✅ Working | Requires `input_image` as base64 data URL (`data:image/png;base64,...`); `image_to_data_url()` helper confirmed working; supports `aspect_ratio: "match_input_image"` to preserve dimensions |

**Critical pattern to port to Node.js `lib/replicate.ts`:**
```python
# Python (tested) → port this logic to TypeScript
def image_to_data_url(image_path):
    mime_type = mimetypes.guess_type(image_path)[0] or "image/png"
    with open(image_path, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"
```
In TypeScript: fetch image bytes from Flux 2 Pro URL → `Buffer.from(bytes).toString('base64')` → prepend `data:image/png;base64,`.

#### Architecture & PRD Decisions Finalized

- ✅ Switched from 8-agent StoryVerse concept → clean 5-step sequential chain (StoryForge AI)
- ✅ Dropped FastAPI backend → Next.js API routes only (one repo, one deploy)
- ✅ Dropped LangGraph → simple sequential prompt chain (same coherence, far less complexity)
- ✅ Dropped Flux Schnell → upgraded to **Flux 2 Pro** (base) + **Flux Kontext Pro** (style-matched), both confirmed working
- ✅ Image strategy confirmed: Image 1 (Flux 2 Pro) sets visual universe; Images 2–4 (Flux Kontext) are style-locked to Image 1
- ✅ Dropped S3/Supabase/ElevenLabs — zero infra overhead
- ✅ PDF export approach: html2canvas + jsPDF, client-side, images pre-fetched as base64

---

## 🔄 In Progress

_Nothing currently in active development — sprint not yet started._

---

## 📋 Build Task Checklist

Track Bob sessions and completion here. Check off as you go.

### Phase 1 — Foundation (Days 1–4)

- [ ] **Day 1 · Bob Task 1** — Next.js scaffold
  - [ ] `npx create-next-app storyforge-ai --typescript --tailwind --app`
  - [ ] Install shadcn/ui: `npx shadcn@latest init`
  - [ ] Create folder structure (`components/`, `lib/`, `app/api/`)
  - [ ] Write `lib/types.ts` — all TypeScript interfaces (`StoryOutline`, `Character`, `WorldBuilding`, `PitchDeck`)
  - [ ] Create `.env.local` with `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `REPLICATE_API_TOKEN` placeholders
  - [ ] First `git commit` — clean baseline
  - Bob tokens used this session: ___

- [ ] **Day 2 · Bob Task 2** — Granite client + prompts
  - [ ] `lib/granite.ts` — watsonx.ai SDK client, typed `generateText(prompt, systemPrompt)` helper
  - [ ] `lib/prompts.ts` — all 4 prompt templates with JSON schema embedded:
    - [ ] `storyPrompt(userInput, genre)`
    - [ ] `characterPrompt(story)`
    - [ ] `worldPrompt(story, characters)`
    - [ ] `artPromptPrompt(story, characters, world)`
  - [ ] Manual test: call each prompt with `curl` or a small `test-granite.ts` script — confirm JSON output
  - Bob tokens used this session: ___

- [ ] **Day 3 · Bob Task 3** — Generate API route
  - [ ] `app/api/generate/route.ts` — POST handler
  - [ ] Sequential chain: story → characters → world → art prompts
  - [ ] `zod` schema validation on each Granite response
  - [ ] JSON parse + retry logic (1 retry on parse failure)
  - [ ] Typed response shape matching `PitchDeck` (minus `imageUrls`)
  - Bob tokens used this session: ___

- [ ] **Day 4 · Bob Task 4** — Replicate integration
  - [ ] Install `replicate` npm package
  - [ ] `lib/replicate.ts`:
    - [ ] `flux2pro(prompt: string): Promise<string>` → returns base64 data URI
    - [ ] `fluxKontext(prompt: string, referenceImageBase64: string): Promise<string>` → returns base64 data URI
    - [ ] Helper: convert Replicate URL response → base64 data URI (port from `flux_kontext_test.py`)
  - [ ] `app/api/images/route.ts` — POST handler, receives 4 art prompts, returns 4 base64 image URIs
  - [ ] Manual test with a known prompt — confirm images return as base64
  - Bob tokens used this session: ___

### Phase 2 — UI Build (Days 5–8)

- [ ] **Days 5–6 · Bob Task 5** — Core UI Part 1
  - [ ] `components/PromptInput.tsx` — text area + genre selector + generate button
  - [ ] `components/LoadingPipeline.tsx` — 5-step progress indicator (Story → Characters → World → Art Prompts → Images)
  - [ ] `components/StorySection.tsx` — renders `StoryOutline` (title, logline, premise, acts, theme, tone)
  - [ ] Test each component with hardcoded mock data — no API calls yet
  - Bob tokens used these sessions: ___

- [ ] **Days 7–8 · Bob Task 6** — Core UI Part 2
  - [ ] `components/CharacterCard.tsx` — renders single `Character`
  - [ ] `components/WorldSection.tsx` — renders `WorldBuilding`
  - [ ] `components/ArtGrid.tsx` — 2×2 image grid with loading skeleton
  - [ ] `app/page.tsx` — assemble full layout, wire state management (useState/useReducer)
  - Bob tokens used these sessions: ___

### Phase 3 — PDF + Integration (Days 9–10)

- [ ] **Day 9 · Bob Task 7** — PDF export
  - [ ] Install `html2canvas`, `jspdf`
  - [ ] `lib/pdfExport.ts` — styled PDF generation (cover page, story, characters, world, image grid)
  - [ ] `components/ExportButton.tsx` — triggers PDF download
  - [ ] Confirm images render correctly in PDF (all images should already be base64 — no CORS)
  - Bob tokens used this session: ___

- [ ] **Day 10 · Bob Task 8** — End-to-end integration
  - [ ] Wire `PromptInput` → `/api/generate` → `/api/images` → full `PitchDeck` state
  - [ ] Update `LoadingPipeline` to reflect real async steps
  - [ ] Test 3 different prompts end-to-end (different genres)
  - [ ] Fix any JSON schema mismatches or image pipeline issues
  - Bob tokens used this session: ___

### Phase 4 — Polish + Ship (Days 11–14)

- [ ] **Day 11 · Bob Task 9** — UI polish
  - [ ] Loading skeletons for each section
  - [ ] Error states (API failure messages, retry buttons)
  - [ ] Empty state (before first generation)
  - [ ] Typography, spacing, color consistency
  - Bob tokens used this session: ___

- [ ] **Day 12** (Manual) — Deployment
  - [ ] `vercel deploy` from project root
  - [ ] Set `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `REPLICATE_API_TOKEN` in Vercel dashboard
  - [ ] Test full pipeline on live Vercel URL
  - [ ] Chrome + Firefox cross-browser check
  - [ ] Confirm PDF download works on deployed URL

- [ ] **Day 13** (Manual) — Demo rehearsal
  - [ ] Run full pipeline 5× with different prompts
  - [ ] Time the generation (target ≤60s)
  - [ ] Record a practice run of the 90-second demo script
  - [ ] Watch it back — fix any awkward moments in the flow

- [ ] **Day 14** (Manual + 1 Bob task max) — Submission
  - [ ] Write `README.md` (problem statement, solution, AI approach, architecture, how IBM Bob was used)
  - [ ] Make GitHub repo public
  - [ ] Record final demo video (max 3 minutes)
  - [ ] Complete submission page on challenge platform
  - [ ] Publish submission before July 31 @ 11:59 PM ET

---

## 🐛 Issues & Resolutions

_Log blockers, bugs, and how they were resolved here as they come up._

| Date | Issue | Resolution | Status |
|---|---|---|---|
| — | — | — | — |

---

## 💡 Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| Pre-sprint | Switched from StoryVerse (8-agent) to StoryForge AI (5-step chain) | Feasibility + reliability > ambition for solo 2-week build |
| Pre-sprint | Upgraded from Flux Schnell to Flux 2 Pro + Flux Kontext Pro | Both already tested and working; Kontext Pro makes the 4-image set visually coherent — real differentiator |
| Pre-sprint | Dropped FastAPI backend for Next.js API routes | One repo, one deploy, zero ops |
| Pre-sprint | Chose html2canvas + jsPDF for PDF export | Client-side, no server cost, handles base64 images natively |
| Pre-sprint | Use `zod` for Granite JSON response validation | Catches schema drift early, typed safety for free |
| Pre-sprint | Use Flux Schnell during dev iterations, Flux 2 Pro for final demo | Cost management during testing |

---

## 📦 Submission Checklist (Final)

Required by challenge rules — check off before July 31:

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
| [`MytestedFiles/flux_2_pro_test.py`](MytestedFiles/flux_2_pro_test.py) | ✅ Validated Flux 2 Pro integration pattern |
| [`MytestedFiles/flux_kontext_test.py`](MytestedFiles/flux_kontext_test.py) | ✅ Validated Flux Kontext Pro integration pattern |
| `prompt.txt` | Original challenge brief |
| `PRD_Draft1.md` | Original StoryVerse concept (reference only) |

---

*Last updated: Pre-sprint planning complete. Ready to begin Day 1.*

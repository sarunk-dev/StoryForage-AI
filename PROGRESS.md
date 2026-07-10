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
| Replicate API (Flux 2 Pro) | ✅ Tested & working | `MytestedFiles/flux_2_pro_test.py` |
| Replicate API (Flux Kontext Pro) | ✅ Tested & working | `MytestedFiles/flux_kontext_test.py` |
| Next.js project scaffold | ✅ Done | `storyforge-ai/`, shadcn/ui, Tailwind, all deps |
| `lib/types.ts` | ✅ Done | All TypeScript interfaces + step types |
| `lib/prompts.ts` | ✅ Done | 4 prompt templates with JSON schemas |
| `lib/granite.ts` | ✅ Done | WatsonXAI client, generateJSON with retry, parseJSON |
| `lib/replicate.ts` | ✅ Done | flux2pro() + fluxKontext() with base64 output |
| `lib/pdfExport.ts` | ✅ Done | Full styled A4 jsPDF export with images |
| `app/api/generate/route.ts` | ✅ Done | Sequential 4-step Granite chain |
| `app/api/images/route.ts` | ✅ Done | Flux 2 Pro → Flux Kontext Pro pipeline |
| `components/PromptInput.tsx` | ✅ Done | Textarea + genre selector + submit |
| `components/LoadingPipeline.tsx` | ✅ Done | 5-step animated progress indicator |
| `components/StorySection.tsx` | ✅ Done | Story outline display |
| `components/CharacterCard.tsx` | ✅ Done | Character cards + CharactersSection |
| `components/WorldSection.tsx` | ✅ Done | World-building display |
| `components/ArtGrid.tsx` | ✅ Done | 2×2 image grid with loading skeletons |
| `components/ExportButton.tsx` | ✅ Done | PDF download trigger (lazy-loaded) |
| `app/page.tsx` | ✅ Done | Full wired UI, streaming reveal, error states |
| TypeScript build | ✅ Passing | `next build` — 0 errors, 0 warnings |
| End-to-end API test | ⬜ Pending | Need real API keys in .env.local |
| UI polish pass | ⬜ Not started | |
| Vercel deployment | ⬜ Not started | |
| Demo rehearsal | ⬜ Not started | |
| Submission page | ⬜ Not started | |

**Bob tokens used:** ~0 / 60 _(scaffold completed without Bob — all tokens preserved for Granite debugging + polish)_

---

## ✅ Completed Work

### Skills Installed (Pre Day 1)

| Skill | Installs | Purpose |
|---|---|---|
| `vercel-labs/agent-skills@vercel-react-best-practices` | 540K | React/Next.js best practices guidance |
| `shadcn/ui@shadcn` | 228K | shadcn/ui component patterns |
| `wshobson/agents@deployment-pipeline-design` | 10K | Vercel deployment patterns |

---

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

⬜ Fill in real API keys in `storyforge-ai/.env.local` and run `npm run dev` to test end-to-end.

---

## 📋 Build Task Checklist

### Phase 1 — Foundation (Days 1–4) ✅ COMPLETE

- [x] **Day 1 · Scaffold** — Next.js + shadcn/ui + all dependencies installed
  - [x] `npx create-next-app storyforge-ai --typescript --tailwind --app`
  - [x] `npx shadcn@latest init` + components: button, textarea, select, badge, card, separator, progress
  - [x] `npm install zod replicate @ibm-cloud/watsonx-ai html2canvas jspdf`
  - [x] Folder structure (`components/`, `lib/`, `app/api/`)
  - [x] `lib/types.ts` — all TypeScript interfaces
  - [x] `.env.local` — template with all required keys
  - [x] First git commit
  - Bob tokens used: **0** _(done manually)_

- [x] **Day 2–3 · Granite** — client + prompts + API route
  - [x] `lib/granite.ts` — WatsonXAI client (named export fix), IamAuthenticator, generateJSON with retry
  - [x] `lib/prompts.ts` — 4 prompt templates with embedded JSON schemas
  - [x] `app/api/generate/route.ts` — sequential chain, typed response
  - Bob tokens used: **0** _(done manually)_

- [x] **Day 4 · Replicate** — image pipeline
  - [x] `lib/replicate.ts` — flux2pro() + fluxKontext(), URL→base64 helper, DEV_IMAGE_MODEL swap
  - [x] `app/api/images/route.ts` — Flux 2 Pro → Flux Kontext Pro pipeline
  - Bob tokens used: **0** _(done manually)_

- [x] **UI — all components** — built and wired
  - [x] `components/PromptInput.tsx`
  - [x] `components/LoadingPipeline.tsx`
  - [x] `components/StorySection.tsx`
  - [x] `components/CharacterCard.tsx` + `CharactersSection`
  - [x] `components/WorldSection.tsx`
  - [x] `components/ArtGrid.tsx`
  - [x] `components/ExportButton.tsx`
  - [x] `app/page.tsx` — full wired UI
  - Bob tokens used: **0** _(done manually)_

- [x] **Build validation** — `npm run build` PASSING, 0 TypeScript errors

### Phase 2 — API Key Test + Polish (Days 5–11)

- [ ] **Next step** — Fill API keys → `npm run dev` → test full pipeline end-to-end
  - [ ] Add `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `REPLICATE_API_TOKEN` to `.env.local`
  - [ ] Set `DEV_IMAGE_MODEL=schnell` for cheap dev iterations
  - [ ] Test: story generation (check JSON output)
  - [ ] Test: image generation (check base64 data URIs return correctly)
  - [ ] Test: PDF export (check images embed, PDF downloads)
  - Bob tokens target: **5–8** (use Bob for any Granite response debugging)

### Phase 3 — PDF + Integration (Days 9–10)

- [ ] **UI polish pass**
  - [ ] Verify loading skeletons render during image generation
  - [ ] Verify error state shows correct message
  - [ ] Check typography + spacing on all sections
  - [ ] Test ⌘+Enter keyboard shortcut
  - Bob tokens target: **3–5**

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

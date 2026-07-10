# PRD: StoryForge AI — Story Pitch Generator

**One prompt becomes a complete, beautiful story pitch deck — outline, characters, world-building, concept art, and a downloadable styled PDF — powered by IBM Granite.**

| | |
|---|---|
| **Owner** | Solo developer |
| **Status** | Final (Hackathon Build) |
| **Timeline** | 2-week sprint · Deadline: July 31, 2026 |
| **Challenge** | IBM AI Builders — July Challenge: Reimagine Creative Industries with AI |
| **Document version** | 1.0 |

---

## 1. Summary

StoryForge AI takes a single line of user input — e.g. *"A blind cartographer discovers the world is flat"* — and generates a complete, publication-quality **Story Pitch Deck**: a structured story outline, three character profiles, world-building lore, four concept art images, and a one-click export to a beautifully styled PDF. It is a polished single-page web application with a minimal Python backend, IBM Granite as the sole LLM, and Replicate (Flux) as the sole image API.

The project is intentionally scoped to be **completable solo in 2 weeks with ≤60 Bob tokens**, while still being genuinely impressive to judges and real users.

---

## 2. Problem Statement

Creators — writers, game designers, indie filmmakers, worldbuilders — have sparks of ideas constantly, but turning a concept into a shareable, presentable pitch takes hours: writing the premise, inventing characters, designing the world, sourcing placeholder art, and formatting it all into something you can actually hand to a collaborator or publisher.

Existing AI tools (ChatGPT, Midjourney, etc.) solve these pieces in isolation and in different tabs. Nobody stitches them into one coherent, downloadable creative document automatically.

---

## 3. Goals

- Produce a **working, polished demo** that runs end-to-end without error in under 60 seconds.
- Demonstrate **AI as a creative partner**: output is coherent across story, character, world, and art — they all match each other.
- Score highly on all five judging criteria (see Section H.2).
- Ship solo in 2 weeks using ≤60 Bob tokens.
- Keep the architecture simple enough that a judge who reads the GitHub repo immediately understands how it works.

---

## 4. Non-Goals (Explicitly Out of Scope)

- User authentication / accounts
- Persistent storage (database) — single-session generation only
- Real-time multi-user collaboration
- AI-generated video or audio
- Mobile app
- Payments / billing
- Multi-step agentic pipeline with visible agent UI (this is not the approach — see Section 7)
- Custom model fine-tuning

---

## 5. Target User

Writers, indie game designers, tabletop RPG creators, hobbyists, and anyone with a creative concept they want to quickly prototype into a shareable pitch — without assembling a team or spending hours in multiple AI tools.

---

## 6. Core Product Experience

1. User lands on a clean, inviting single-page app.
2. User types a creative concept (one sentence or a few words).
3. User optionally selects a **genre** (Fantasy, Sci-Fi, Thriller, Horror, Romance, Historical) to guide tone.
4. User clicks **"Generate Pitch Deck"**.
5. Results stream in progressively on-screen: Story Outline → Characters → World → Art.
6. The full pitch deck is displayed as a beautiful, readable layout.
7. User clicks **"Export PDF"** — a styled, print-ready PDF with all content and images downloads instantly.

The entire generation completes in **~45–60 seconds** (text is fast via Granite; 4 images take the bulk of time via Replicate async).

---

## 7. Architecture (Simple & Justified)

This project deliberately uses a **sequential prompt chain**, not a multi-agent framework like LangGraph. Here is why:

- A sequential chain (prompt 1 → output 1 → prompt 2 that includes output 1 as context) achieves the same coherence as a multi-agent pipeline for this use case.
- LangGraph adds real complexity for a solo build (graph state management, tool registration, debugging) that buys nothing extra for a demo of this size.
- Simplicity is itself a strength: the codebase is readable, the demo is reliable, and the architecture is easy to explain in the README and the 3-minute video.

```
User Prompt + Genre
        │
        ▼
[Step 1] Story Agent  ← Granite: premise, 3-act outline, theme, tone
        │
        ▼
[Step 2] Character Agent  ← Granite: 3 characters, each with name/role/backstory/motivation
        │ (receives story context)
        ▼
[Step 3] World Agent  ← Granite: setting name, geography, rules, atmosphere
        │ (receives story + character context)
        ▼
[Step 4] Art Prompt Agent  ← Granite: generates 4 descriptive image prompts
        │ (receives all above)
        ▼
[Step 5] Image Generation  ← Replicate (Flux Schnell): 4 images in parallel
        │
        ▼
Final Pitch Deck (assembled in-browser)
        │
        ▼
PDF Export (html2canvas + jsPDF)
```

### 7.1 System Architecture

```
Next.js 15 (App Router, React, TypeScript, Tailwind CSS)
        │
        │ API routes (server-side, no separate backend process)
        │
  ┌─────┴──────────────┐
  │                    │
IBM Granite          Replicate API
(watsonx.ai)         (Flux Schnell)
Text generation      Image generation
  │
Sequential prompt chain
(story → characters → world → art prompts)
```

**Why Next.js API routes instead of a separate FastAPI backend:**
- One repo, one deploy, zero infra to manage.
- API routes run server-side (secrets stay off the client).
- Vercel deploys it for free with one command.
- This is the fastest path to a working, deployed demo.

---

## 8. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend + Backend | **Next.js 15** (App Router), TypeScript, Tailwind CSS, shadcn/ui | One repo, one deploy, polished UI fast |
| LLM | **IBM Granite** (Granite 3.3 Instruct) via watsonx.ai SDK | Required IBM tech; excellent for structured creative text |
| Images | **Replicate — Flux Schnell** | Fast (3–5s/image), cheap, high quality, simple API |
| PDF Export | **html2canvas + jsPDF** | Client-side, no server needed, produces styled PDF with images |
| Deployment | **Vercel** (frontend + API routes) | Zero-ops, free tier, one-command deploy |
| Dev tooling | **IBM Bob** | Mandatory per hackathon requirements |

**No database. No separate backend. No message queue. No Docker.**

---

## 9. Feature Specification

### 9.1 Input Panel
- Single large text input: "Describe your story concept..."
- Genre selector: Fantasy · Sci-Fi · Thriller · Horror · Romance · Historical · (None)
- "Generate Pitch Deck" button with loading state

### 9.2 Story Outline Section
Granite output, structured:
- **Title** (generated)
- **Logline** (1-sentence hook)
- **Premise** (2–3 sentences)
- **Three-act outline**: Act 1 setup, Act 2 conflict, Act 3 resolution
- **Central theme**
- **Tone**

### 9.3 Character Cards (×3)
For each character, Granite produces:
- Name + Role
- Physical description (2 sentences)
- Backstory (3 sentences)
- Core motivation
- Fatal flaw
- One defining quote

### 9.4 World-Building Section
- Setting name
- Geography / environment (2–3 sentences)
- Unique rules or magic/technology system
- Cultural flavor
- Atmosphere / mood

### 9.5 Concept Art (×4 images)
- Granite generates 4 detailed image prompts based on the story content
- Replicate Flux Schnell generates each image
- Images displayed in a 2×2 grid:
  1. Key scene / establishing shot
  2. Main character portrait
  3. World / environment
  4. Mood / thematic image

### 9.6 PDF Export
- Full pitch deck rendered to a beautifully styled PDF
- Includes: title, logline, premise, outline, character cards, world notes, all 4 images
- Styled with colors, typography, and layout matching the web UI
- Download triggered client-side (html2canvas → jsPDF)
- No server round-trip required for export

---

## 10. Folder Structure

```
storyforge-ai/
  app/
    page.tsx                    ← Main UI page
    layout.tsx
    api/
      generate/
        route.ts                ← POST: runs full text generation chain
      images/
        route.ts                ← POST: calls Replicate for image generation
  components/
    PromptInput.tsx             ← Input panel
    StorySection.tsx            ← Story outline display
    CharacterCard.tsx           ← Single character card
    WorldSection.tsx            ← World-building display
    ArtGrid.tsx                 ← 2×2 image grid
    ExportButton.tsx            ← PDF export trigger
    LoadingPipeline.tsx         ← Step-by-step progress indicator
  lib/
    granite.ts                  ← watsonx.ai client + prompt helpers
    replicate.ts                ← Replicate client + image call
    prompts.ts                  ← All prompt templates (centralized)
    pdfExport.ts                ← html2canvas + jsPDF logic
    types.ts                    ← TypeScript types for all data models
  README.md
  .env.local                    ← WATSONX_API_KEY, REPLICATE_API_TOKEN
```

---

## 11. Data Models (TypeScript)

```ts
// types.ts

interface StoryOutline {
  title: string;
  logline: string;
  premise: string;
  acts: { act1: string; act2: string; act3: string };
  theme: string;
  tone: string;
}

interface Character {
  name: string;
  role: string;
  physicalDescription: string;
  backstory: string;
  motivation: string;
  fatalFlaw: string;
  definingQuote: string;
}

interface WorldBuilding {
  settingName: string;
  geography: string;
  rulesOrSystem: string;
  culturalFlavor: string;
  atmosphere: string;
}

interface PitchDeck {
  prompt: string;
  genre: string;
  story: StoryOutline;
  characters: Character[];
  world: WorldBuilding;
  imagePrompts: string[];
  imageUrls: string[];
}
```

---

## 12. Prompt Engineering Strategy

All prompts live in [`lib/prompts.ts`](storyforge-ai/lib/prompts.ts). Key principles:

1. **Ask Granite for JSON output** — every prompt ends with "Respond only with valid JSON matching this schema: {...}". This eliminates parsing brittleness.
2. **Pass prior outputs as context** — each prompt in the chain receives the previous outputs as a structured system context block, ensuring character names, world names, and tone stay consistent.
3. **Genre-guided system prompt** — all generation calls include a system message that sets the genre tone, so a "Horror" pitch feels unmistakably different from a "Fantasy" one.
4. **Image prompts are the final text step** — Granite generates cinematic image prompts that reference the character names, setting, and visual style from the established lore. This is what makes images feel like they *belong* to the story.

---

## 13. Success Metrics

- **Functional completeness**: all 6 sections (outline, 3 characters, world, 4 images, PDF export) generate without error in a single run.
- **Generation time**: full pipeline completes in ≤60 seconds.
- **Coherence**: generated character names, world name, and visual style are consistent across all sections.
- **PDF quality**: exported PDF is presentable as a real pitch document.
- **Demo reliability**: runs 3 consecutive times without failure during rehearsal.

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Granite returns malformed JSON | Wrap parse in try/catch; retry once with a correction prompt; fall back to raw text display |
| Replicate image generation is slow (>15s/image) | Call all 4 images in parallel (`Promise.all`); show a progress indicator so the wait feels intentional |
| Replicate API rate limits | Use Flux Schnell (fastest, cheapest model); generate only 4 images total |
| html2canvas misrenders images in PDF (CORS) | Fetch images server-side, convert to base64 data URIs before PDF render |
| Vercel cold start on API route | Pre-warm during demo; Vercel Pro not needed — Hobby tier is sufficient |
| Bob token overrun | See Section H.4 |

---

## 15. Open Questions (Resolved)

| Question | Decision |
|---|---|
| LangGraph vs. sequential chain? | Sequential chain — simpler, equally coherent for this scope |
| FastAPI vs. Next.js API routes? | Next.js API routes — one repo, one deploy |
| Database for persistence? | No database — single-session, in-memory state only |
| PDF library? | html2canvas + jsPDF — client-side, no server cost |
| Image model? | Replicate Flux Schnell — fast + cheap + high quality |
| React Flow agent visualization? | Not needed — a simple step progress bar is sufficient and cleaner |

---

# Hackathon-Specific Details

## H.1 Mandatory Requirement: IBM Bob

IBM Bob is used as the **primary development tool** throughout the build. Every significant code section (API route, prompt chain, PDF export logic, component architecture) is built with Bob. See Section H.4 for token budget strategy.

## H.2 Judging Criteria Alignment

| Criterion | How StoryForge AI addresses it |
|---|---|
| **Technical Execution** | Sequential LLM prompt chain with structured JSON outputs; server-side API routes with proper secret management; parallel image generation; client-side PDF rendering — clean, correct, production-quality code |
| **Innovation** | Combines structured story generation + coherent world-building + AI concept art + one-click styled PDF export into a single seamless flow — no existing tool does all four together |
| **Challenge Fit** | Directly embodies "AI as a creative partner" — the AI doesn't just generate content, it maintains creative coherence across five interdependent outputs |
| **Feasibility** | Single repo, one free-tier deployment, two API keys, zero infrastructure — could be used by real creators today |
| **Real-World Impact** | Writers, game designers, and indie creators spend hours creating pitches manually. This turns that into 60 seconds and produces a shareable, professional document |

## H.3 Demo Script (Target: ~90 seconds)

1. **Hook (5s)**: *"Writers have ideas. Turning one into a pitch deck takes days. We do it in 60 seconds."*
2. **Input (5s)**: Type prompt live — e.g. *"A detective in 1920s Shanghai who can hear the last words of the dead."* Select genre: Thriller.
3. **Generation (50s)**: Show the step progress indicator advancing through: Story → Characters → World → Art Prompts → Images. Narrate what each step is doing.
4. **Reveal (20s)**: Scroll through the complete pitch deck — title, logline, three-act outline, character cards, world section, four concept art images.
5. **PDF export (5s)**: Click "Export PDF" — styled PDF downloads instantly. Hold it up / show it.
6. **Close (5s)**: *"One prompt. A complete story pitch deck. Export it, share it, pitch it."*

## H.4 Bob Token Budget Strategy (60 tokens)

**Allocation plan:**

| Task | Estimated tokens | Notes |
|---|---|---|
| Project scaffold (Next.js, folder structure, types, env setup) | 3–4 | One task, one session |
| Granite integration (`lib/granite.ts` + `lib/prompts.ts` + `/api/generate/route.ts`) | 8–10 | Most complex backend task |
| Replicate integration (`lib/replicate.ts` + `/api/images/route.ts`) | 4–5 | Simpler, well-documented API |
| PDF export logic (`lib/pdfExport.ts` + CORS image handling) | 5–7 | html2canvas quirks can need iteration |
| Core UI components (PromptInput, LoadingPipeline, StorySection, CharacterCard, WorldSection, ArtGrid) | 10–14 | Largest surface area; use one Bob task per component group |
| ExportButton + end-to-end wiring | 3–4 | |
| Debugging + polish | 8–10 | Reserve this; don't spend it early |
| README + submission materials | 2–3 | Write manually where possible |
| **Total** | **43–57** | Leaves a safety buffer of 3–17 |

**Session hygiene (same rules as the original PRD, carried forward):**
1. One Bob task per concern — scaffold, Granite, Replicate, PDF, UI components are separate tasks/sessions.
2. Reference files by exact path (`@/lib/prompts.ts:15-40`) not whole-folder context.
3. Close a task when it works. Don't reopen it.
4. Write boilerplate (env files, README, config) manually — these are not worth tokens.

**Budget checkpoints:**

| Day | Target Bob usage | Action if over |
|---|---|---|
| Day 4 | ≤ 20 tokens spent | On track |
| Day 4 | > 28 tokens spent | Cut scope: defer PDF styling; ship plain PDF |
| Day 10 | ≤ 45 tokens spent | Proceed to polish |
| Day 10 | > 52 tokens spent | Freeze Bob for new features; finish manually |

**Fallback if tokens run out:** Bob is a dev tool, not a runtime dependency. Finish remaining work manually; ensure all Bob-assisted sessions are exported for the submission, as judging includes demonstrated Bob usage.

## H.5 Two-Week Build Plan

| Days | Focus | Bob tasks |
|---|---|---|
| 1 | Project scaffold: Next.js setup, folder structure, Tailwind + shadcn, TypeScript types, env setup | 1 task |
| 2–3 | IBM Granite integration: watsonx.ai client, prompt chain (story → characters → world → art prompts), `/api/generate` route, JSON parsing + retry logic | 2 tasks |
| 4 | Replicate Flux Schnell integration: image generation, parallel calls, `/api/images` route | 1 task |
| 5–6 | Core UI: PromptInput, LoadingPipeline progress indicator, StorySection, CharacterCard components | 2 tasks |
| 7–8 | WorldSection, ArtGrid (2×2 image display), ExportButton, overall page layout | 2 tasks |
| 9 | PDF export: html2canvas + jsPDF, image CORS handling, styled PDF layout | 1–2 tasks |
| 10 | End-to-end integration: wire all API routes to UI, fix data flow, test full generation run | 1 task |
| 11 | UI polish: typography, spacing, colors, loading states, error states, empty states | 1 task |
| 12 | Cross-browser testing, Vercel deployment, .env production config | Manual |
| 13 | Demo rehearsal: run pipeline 5 times, fix any flakiness, rehearse 90-second script | Manual |
| 14 | Buffer: fix anything that breaks, final README, submission page, demo video recording | Manual + 1 Bob task max |

## H.6 Explicitly Skipped

- User authentication
- Database / persistent storage
- Real-time collaboration
- AI video or audio generation
- Custom model fine-tuning
- Multi-agent framework (LangGraph)
- Mobile app
- Payments

---

## Appendix: Why This Wins

The judges are evaluating five criteria. Here is the honest scoring:

| Criterion | Score | Why |
|---|---|---|
| **Technical Execution** | ★★★★☆ | Sequential prompt chain is clean and correct; parallel image generation; proper secret management; type-safe throughout |
| **Innovation** | ★★★★☆ | Coherent multi-modal output (text + images) in one flow, exported as a styled PDF, is genuinely novel |
| **Challenge Fit** | ★★★★★ | Cannot be more directly aligned — this IS "AI as creative partner for story creation" |
| **Feasibility** | ★★★★★ | Single repo, two API keys, one Vercel deploy, zero infrastructure — maximum feasibility score |
| **Real-World Impact** | ★★★★☆ | Directly saves writers/designers hours; immediately useful; shareable output format |

The previous StoryVerse PRD was strongest on **Innovation** and **Technical Execution** at the cost of **Feasibility** and **Real-World Impact** (because an 8-agent pipeline that's half-broken scores worse on all five than a clean 5-step chain that works perfectly). This design flips that trade-off deliberately.

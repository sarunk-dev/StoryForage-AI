# Cleanup, Security & Bug-Fix Plan

## Top-Level Overview

Eight targeted fixes across security hardening, logic correctness, dead code removal, and dependency cleanup. No new features. No refactors beyond what is required. The application's current behaviour is preserved — these changes only close gaps, fix silent bugs, and reduce bundle weight.

**Affected files:**
- `app/api/generate/route.ts`, `app/api/regenerate/route.ts`, `app/api/images/route.ts`, `app/api/narrate/route.ts` — security
- `app/page.tsx` — logic (imageUrls index, isLoading guard)
- `components/StorySection.tsx` — audio cleanup
- `components/DemoDeck.tsx` — UX (remove broken badge)
- `lib/prompts.ts` — dead constant
- `components/ui/card.tsx` — dead file
- `public/` — dead assets
- `package.json` — dead/misplaced dependencies

---

## Sub-Tasks

---

### Sub-Task 1 — Server-side prompt length cap on all 4 API routes (Security)

**Intent**
Every API route currently accepts an unbounded `prompt` / `text` string from the client and feeds it straight into Granite or ElevenLabs. A malicious or accidental payload of hundreds of kilobytes could attempt to override the system prompt (prompt injection) and wastes IBM quota. A hard 2000-character cap on the user-facing prompt and 4000-character cap on act text (which is already Granite-generated, not user input) closes this surface with zero UX impact — no real story concept or act text is longer than these limits.

**Expected Outcomes**
- `/api/generate` — if `prompt.trim().length > 2000`, return 400 with `"Prompt too long (max 2000 characters)"`
- `/api/regenerate` — same 2000-char cap on the `prompt` field; `target:"imagePrompt"` also validates `index` is integer 0–3 (already done — keep as-is)
- `/api/images` — cap `prompt` at 4000 chars (it's a Granite-generated art prompt, not raw user input, but still worth capping)
- `/api/narrate` — cap `text` at 4000 chars (act text, Granite-generated)
- All caps applied with `.slice()` — never throw on length, just truncate silently after logging, OR return 400 — choose 400 for the user-facing prompt, silent truncation for internal fields

**Todo List**
1. In `app/api/generate/route.ts`: after the existing `!prompt?.trim()` check, add `if (prompt.trim().length > 2000) return 400 "Prompt too long"`
2. In `app/api/regenerate/route.ts`: same 2000-char check on `prompt` after the existing check
3. In `app/api/images/route.ts`: silently truncate `prompt` to 4000 chars before passing to `pollinationsImage`
4. In `app/api/narrate/route.ts`: silently truncate `text` to 4000 chars before passing to `prepareNarrationText`

**Relevant Context**
- Files: all four in `storyforge-ai/app/api/`
- Existing check pattern to extend: `if (!prompt?.trim()) { return NextResponse.json(..., { status: 400 }); }`
- The 2000 / 4000 split: 2000 for direct user input (prompt), 4000 for Granite-generated content passed back through the API

**Status:** [ ] pending

---

### Sub-Task 2 — Fail-fast check for missing `ELEVENLABS_API_KEY` (Security)

**Intent**
`const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!` at module level silently evaluates to `undefined` if the env var is missing — the `!` only suppresses TypeScript. The key is then passed as the literal string `"undefined"` in the `xi-api-key` header, which ElevenLabs rejects with a 401 that the caller misreads. A runtime guard at request time gives an immediate, clear error instead of a confusing downstream failure.

**Expected Outcomes**
- At the top of the `POST` handler in `app/api/narrate/route.ts`, before any logic, check `if (!ELEVENLABS_API_KEY)` and return a 500 with `"ELEVENLABS_API_KEY is not configured"` — same pattern as Granite's `getClient()` guard
- Module-level constant stays; only a request-time guard is added

**Todo List**
1. In `app/api/narrate/route.ts`, inside the `POST` function as the very first statement, add: `if (!ELEVENLABS_API_KEY) return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured" }, { status: 500 });`

**Relevant Context**
- File: `storyforge-ai/app/api/narrate/route.ts`
- Reference pattern: `lib/granite.ts` `getClient()` which throws `new Error("WATSONX_API_KEY is not set")` — same intent, adapted to a Next.js response return

**Status:** [ ] pending

---

### Sub-Task 3 — Fix `imageUrls` index drift (Logic Bug)

**Intent**
`deck.imageUrls` is currently stored as a **filtered dense array** — `urls.filter(Boolean)`. This means if slot 1 fails to load, `imageUrls[0]` = slot 0, `imageUrls[1]` = slot 2, `imageUrls[2]` = slot 3. Every handler that reads or writes by slot index (`handleRetryImage`, `handleRegenerateImage`, `handleRollbackImage`) then silently targets the wrong image.

The fix is to keep `imageUrls` as a **fixed-length 4-slot sparse array** of `string | ""` where empty string means "not loaded". `ArtGrid` already accesses by index (`imageUrls[idx]`) so it works correctly with a sparse array — only the `hasImages` check and the PDF export need slight adjustment.

**Expected Outcomes**
- `deck.imageUrls` is always exactly 4 elements: `["", "", "", ""]` initially, slots filled as images arrive
- `setDeck` calls that currently do `.filter(Boolean)` are changed to write directly by index into a fixed 4-slot array
- `hasImages` changes from `length > 0` to `imageUrls.some(url => url.length > 0)`
- PDF export in `lib/pdfExport.ts` filters out empty strings before iterating images (already does `.length > 0` check via `deck.imageUrls.length` — update to filter empties)
- `ArtGrid` receives `imageUrls: string[]` same as before — just now index-stable

**Todo List**
1. In `page.tsx` `handleGenerate`, change initial `imageUrls: []` to `imageUrls: ["", "", "", ""]`
2. In `page.tsx` `fetchAllImages`, change the `setDeck` inside the loop: instead of building a `snapshot` with filter, directly write `urls[i] = imageUrl` and set `deck.imageUrls` as `[...urls]` (the local `urls` array is already 4-slot `(string | null)[]` — change it to `string[]` initialized with `["","","",""]`)
3. In `page.tsx` `handleRetryImage`, remove `.filter(Boolean)` — write directly by index
4. In `page.tsx` `handleRegenerateImage`, remove `.filter(Boolean)` — write directly by index; same in rollback
5. In `page.tsx`, change `hasImages` to `(deck?.imageUrls?.some(u => !!u) ?? false)`
6. In `lib/pdfExport.ts`, change `deck.imageUrls.length > 0` to `deck.imageUrls.some(u => !!u)` and filter empties when iterating
7. Verify `ArtGrid` — it reads `imageUrls[idx]` directly so it already works; the `if (url)` check handles empty string as falsy

**Relevant Context**
- File: `storyforge-ai/app/page.tsx` — lines 99, 187–188, 378–380, 405–461, 473–475, 495
- File: `storyforge-ai/lib/pdfExport.ts` — the image grid section near the bottom
- `ArtGrid.tsx` line 88: `const url = imageUrls[idx]` — empty string is falsy, so `if (url)` already handles it correctly — no change needed there

**Status:** [ ] pending

---

### Sub-Task 4 — Guard text-section Regenerate with `!isLoading` (Logic)

**Intent**
Text section Regenerate buttons currently appear as soon as `hasText` is true, which includes while images are still streaming. If the user regenerates Story mid-generation, `deck.story` changes while the audio pipeline (still running in `narrateAllActs`) holds a stale reference to the old story text. The audio generation uses the `story` captured in the closure at the start of `handleGenerate` — not `deck.story` — so it won't break, but the UX is confusing: the user regenerates a story and then audio for the old story arrives. The simplest guard is `hasText && !isLoading`.

**Expected Outcomes**
- All three `onRegenerate` props on `StorySection`, `CharactersSection`, `WorldSection` are only non-undefined when `hasText && !isLoading`
- `onGenerateAudio` already gated on `isDone` — no change needed

**Todo List**
1. In `page.tsx` JSX, change the three `onRegenerate` lines:
   - `onRegenerate={hasText ? handleRegenerateStory : undefined}` → `onRegenerate={hasText && !isLoading ? handleRegenerateStory : undefined}`
   - Same for Characters and World

**Relevant Context**
- File: `storyforge-ai/app/page.tsx` lines 633, 643, 652
- `isLoading` is already defined: `const isLoading = step !== "idle" && step !== "done" && step !== "error"`

**Status:** [ ] pending

---

### Sub-Task 5 — Clean up `HTMLAudioElement` on unmount / base64 change (Logic)

**Intent**
`useActAudio` in `StorySection.tsx` creates a `new Audio(...)` stored in a ref. When `base64` changes (user regenerates audio), the hook keeps the old `audioRef.current` pointing to the old audio object — if it was playing, it keeps playing. When the component unmounts (e.g. user generates a new deck), the audio also keeps playing. Adding a `useEffect` cleanup that pauses and nulls the ref when `base64` changes or the component unmounts fixes both cases.

**Expected Outcomes**
- When `base64` prop changes, the old `HTMLAudioElement` is paused and `audioRef.current` is set to `null` so the next `toggle()` creates a fresh instance with the new audio
- When the component unmounts, any playing audio stops immediately
- `playing` state is reset to `false` on cleanup

**Todo List**
1. In `StorySection.tsx`, add `useEffect` to `useActAudio`:
   ```ts
   useEffect(() => {
     return () => {
       audioRef.current?.pause();
       audioRef.current = null;
       setPlaying(false);
     };
   }, [base64]);
   ```
   This runs on mount, on every `base64` change, and on unmount — pausing + clearing the old audio each time

**Relevant Context**
- File: `storyforge-ai/components/StorySection.tsx`
- `useActAudio` function starting at line 28 — add `useEffect` import alongside existing `useState, useRef`
- The `useEffect` import is already present at the top of the file (`useState, useRef` from react) — add `useEffect` to that import

**Status:** [ ] pending

---

### Sub-Task 6 — Remove broken IBM badge from `DemoDeck` header (UX)

**Intent**
The demo header pill contains a `<Cpu>` icon badge with empty text content — it renders as a small blue pill with only an icon and a trailing space. The Story section badge below it correctly shows "IBM Granite 4". The header badge is either a leftover from an incomplete edit or was meant to say "IBM Granite 4" too. Per user instruction: just remove this badge entirely from the header row.

**Expected Outcomes**
- The broken empty badge `<span className="inline-flex ... bg-[#0f62fe]"><Cpu .../> </span>` in the `DemoDeck` header row is deleted
- The rest of the `DemoDeck` header (Sample Output label + prompt text) is unchanged

**Todo List**
1. In `components/DemoDeck.tsx`, remove the empty IBM badge span from the header row (the one immediately after the "Sample Output" text span)

**Relevant Context**
- File: `storyforge-ai/components/DemoDeck.tsx`
- The badge is in the first `<div className="flex items-center gap-2">` inside the demo header

**Status:** [ ] pending

---

### Sub-Task 7 — Remove dead code: `SLOT_ROLES`, `card.tsx`, public SVGs (Dead Code)

**Intent**
Three categories of dead code with zero risk — they are simply never referenced:
- `SLOT_ROLES` constant in `lib/prompts.ts` — declared but superseded by the inline `slotInstructions` array in the same function
- `components/ui/card.tsx` — shadcn component, never imported anywhere
- 5 default Next.js SVGs in `public/` — leftover from `create-next-app`, never referenced in any component

**Expected Outcomes**
- `SLOT_ROLES` const block (7 lines) removed from `lib/prompts.ts`
- `components/ui/card.tsx` file deleted
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` deleted

**Todo List**
1. In `lib/prompts.ts`, delete the `const SLOT_ROLES = [...] as const;` block (lines 306–312)
2. Delete file `components/ui/card.tsx`
3. Delete the 5 SVG files from `public/`

**Relevant Context**
- `SLOT_ROLES` is at line 306 in `lib/prompts.ts` — 7 lines total, immediately followed by the `export function singleArtPrompt`
- `card.tsx` confirmed unused via grep across all `.ts`/`.tsx` files
- SVGs confirmed unused via grep across all components

**Status:** [ ] pending

---

### Sub-Task 8 — Remove unused / misplaced npm dependencies (Dependencies)

**Intent**
Four packages in `package.json` are completely unused in the codebase. One is in the wrong dependency category. Removing them reduces install size and eliminates false attack surface.

| Package | Issue |
|---|---|
| `replicate` | In `dependencies`, never imported — `lib/replicate.ts` uses plain `fetch`, not the Replicate SDK |
| `html2canvas` | In `dependencies`, never imported anywhere — leftover from an early PDF export attempt |
| `zod` | In `dependencies`, zero imports anywhere in the codebase |
| `shadcn` | In `dependencies` — this is a CLI tool, not a runtime library; should be in `devDependencies` |

**Expected Outcomes**
- `replicate`, `html2canvas`, `zod` removed from `dependencies` in `package.json`
- `shadcn` moved from `dependencies` to `devDependencies`
- `package.json` is otherwise unchanged (no version bumps, no other moves)

**Todo List**
1. In `package.json`, remove `"replicate"`, `"html2canvas"`, `"zod"` from the `dependencies` block
2. Move `"shadcn": "^4.13.0"` from `dependencies` to `devDependencies`
3. Note: `node_modules` and `package-lock.json` will need `npm install` to sync — remind the user to run this after the plan is implemented

**Relevant Context**
- File: `storyforge-ai/package.json`
- `replicate` confirmed unused: no `from 'replicate'` import anywhere
- `html2canvas` confirmed unused: no import anywhere; was likely an early PDF approach
- `zod` confirmed unused: no `from 'zod'` import anywhere
- `shadcn` is the CLI scaffolding tool (run via `npx shadcn add ...`), not a runtime import

**Status:** [ ] pending

---

## Implementation Notes

- Sub-Tasks 1–5 are the substantive changes; Sub-Tasks 6–8 are pure removals with no logic changes
- Sub-Tasks 1, 2, 4 can all be implemented in a single pass through `page.tsx` and the API route files
- Sub-Task 3 (imageUrls fix) is the most cross-cutting change and should be done carefully — read the exact current state of `page.tsx` before editing
- After Sub-Task 8, the user must run `npm install` in `storyforge-ai/` to update `node_modules` and `package-lock.json`
- TypeScript build (`npx tsc --noEmit`) must pass after all sub-tasks complete

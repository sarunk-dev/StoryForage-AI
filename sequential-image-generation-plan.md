# Sequential Image Generation Plan

## Top-Level Overview

**Goal**: Align the concept art generation in the production app with the exact pattern demonstrated in `MytestedFiles/poli.py` — request one image, **block until it is fully generated**, commit it to UI state, then move to the next image, and repeat until all 4 are done.

**Scope**:
1. Harden per-image blocking in `lib/replicate.ts` with server-side timing logs.
2. Add `imageProgress` state to `page.tsx` and thread it into the existing `LoadingPipeline` so the "Generating concept art" step label dynamically reads **"Generating concept art (1 of 4)"**.
3. Confirm each image is committed to UI state immediately on arrival (stream-render inside the loop).
4. Surface per-image errors in `ArtGrid` as a **retry button** on the failed slot so the user can re-request that single image without restarting the whole pipeline.

**Non-goals**: Switching image provider, changing prompt logic, altering narration flow, disk persistence.

---

## Sub-Tasks

---

### Sub-Task 1 — Add timing logs to `lib/replicate.ts`

**Intent**
Mirror `poli.py`'s `print(f"Generating image {i}…")` on the server side. Right now `pollinationsImage()` already blocks correctly on `res.arrayBuffer()` — this sub-task just adds structured console logs to make the blocking behaviour observable in server output, confirming the pattern is working as designed.

**Expected Outcomes**
- Server log shows `[image N] starting…` before the fetch and `[image N] done in Xms` after the buffer is read.
- No behaviour change — purely observability.

**Todo List**
1. In `pollinationsImage()`, accept `index` (already a param, currently voided) and use it in the log messages.
2. Record `Date.now()` before `fetchWithRetry` and log elapsed ms after `res.arrayBuffer()` resolves.
3. Remove the `void index` statement so the index is live.

**Relevant Context**
- [`pollinationsImage()`](storyforge-ai/lib/replicate.ts:33) — `index` parameter already exists but is voided on line 39.
- [`fetchWithRetry()`](storyforge-ai/lib/replicate.ts:19) — already loops on 429 and only returns a full `Response`.

**Status**: [x] done

---

### Sub-Task 2 — Add `imageProgress` state and wire into `LoadingPipeline`

**Intent**
`poli.py` prints `"Generating image 1…"` before each HTTP request. The production UI should show the same in the existing progress bar — specifically, while the `"images"` step is active in `LoadingPipeline`, the label should read **"Generating concept art (1 of 4)"** and increment to 2, 3, 4 as each image starts.

**Design decisions**
- New state: `const [imageProgress, setImageProgress] = useState(0)` in `page.tsx`. Value `0` = not started, `1–4` = image N is currently being fetched.
- `setImageProgress(i + 1)` is called **before** `fetch("/api/images", …)` in the `fetchAllImages` loop so the label updates the moment a new image request is fired.
- `LoadingPipeline` receives a new optional `imageProgress?: number` prop.
- Inside `LoadingPipeline`, when the active step key is `"images"` and `imageProgress > 0`, the displayed label becomes `"Generating concept art (${imageProgress} of 4)"` instead of the static `"Generating concept art"` from `GENERATION_STEPS`.
- No change to `GENERATION_STEPS` in `lib/types.ts` — the override is purely in the render logic of `LoadingPipeline`.

**Expected Outcomes**
- During concept art generation the progress bar label dynamically shows which image is being fetched.
- Before images start (`imageProgress === 0`) or for all other steps, the label falls back to the static value.
- `imageProgress` resets to `0` on each new `handleGenerate` call.

**Todo List**
1. Add `const [imageProgress, setImageProgress] = useState(0)` in `page.tsx` (alongside the other `useState` declarations).
2. Reset `setImageProgress(0)` at the start of `handleGenerate` (near `setStep("story")`).
3. In `fetchAllImages`, call `setImageProgress(i + 1)` at the top of the loop, **before** the `fetch(…)` call.
4. Pass `imageProgress={imageProgress}` as a prop to `<LoadingPipeline>` in the JSX.
5. In `LoadingPipeline`, add `imageProgress?: number` to `LoadingPipelineProps`.
6. In the step label render, when `step.key === "images"` and `imageProgress > 0`, display `"Generating concept art (${imageProgress} of 4)"` instead of `step.label`.

**Relevant Context**
- [`LoadingPipeline`](storyforge-ai/components/LoadingPipeline.tsx:14) — `step.label` is rendered on line 59; this is where the conditional override goes.
- [`LoadingPipelineProps`](storyforge-ai/components/LoadingPipeline.tsx:8) — add `imageProgress` here.
- [`fetchAllImages()`](storyforge-ai/app/page.tsx:152) — loop to add `setImageProgress` call.
- [`<LoadingPipeline>`](storyforge-ai/app/page.tsx:5) — usage site for new prop.
- [`GENERATION_STEPS`](storyforge-ai/lib/types.ts:65) — NOT changed; label override is local to the component.

**Status**: [x] done

---

### Sub-Task 3 — Confirm per-image stream-render (commit to UI inside loop)

**Intent**
Matches `poli.py`'s `Save image_X.png` step: as soon as image N is fully downloaded it is persisted/rendered before image N+1 starts. In the web app this means `setDeck(…)` is called **inside** the loop after each successful fetch — not once after the loop finishes.

**Expected Outcomes**
- The `ArtGrid` renders each image slot as it arrives (slot 1 fills → slot 2 fills → …).
- Code inspection confirms `setDeck((prev) => …)` is inside the `if (imgRes.ok)` block, which is inside the `for` loop.
- No change needed if the existing code already does this (it does — this sub-task is a verification + no-op or micro-fix).

**Todo List**
1. Re-read `fetchAllImages` (lines 152–176 of `page.tsx`).
2. Confirm `setDeck(…)` is called inside the loop after each `imgRes.ok` check (it is, on lines 168–170).
3. If confirmed: mark done. If not: move the `setDeck` call inside the loop.

**Relevant Context**
- [`fetchAllImages()`](storyforge-ai/app/page.tsx:152-176) — lines 168–170 already call `setDeck` per image.

**Status**: [x] done

---

### Sub-Task 4 — Add per-slot retry button to `ArtGrid`

**Intent**
`poli.py` continues the loop when one image fails. The web app should do the same, but additionally give the user a way to recover a failed slot without restarting the entire pipeline — a retry button on the failed image card.

**Design decisions**
- New state: `const [imageErrors, setImageErrors] = useState<(string | null)[]>([null, null, null, null])` in `page.tsx`.
- In the `catch` block of `fetchAllImages`, call `setImageErrors((prev) => { const next = [...prev]; next[i] = "Failed"; return next; })`.
- A new `handleRetryImage(index: number)` async function in `page.tsx` re-calls `/api/images` for a single slot, clears its error entry, and commits the result to `deck.imageUrls[index]`.
- `ArtGrid` receives two new optional props: `imageErrors?: (string | null)[]` and `onRetry?: (index: number) => void`.
- In `ArtGrid`, when `imageUrls[idx]` is absent AND `imageErrors[idx]` is set AND `isLoading` is true, render an error card with a "Retry" button instead of the pulsing skeleton.
- `imageErrors` resets to `[null, null, null, null]` at the start of each `handleGenerate` call.

**Expected Outcomes**
- A failed image slot shows a small error card with a **"↺ Retry"** button.
- Clicking retry fires `handleRetryImage(idx)` which calls `/api/images` for that slot only.
- On success the slot fills with the image; on failure the error card remains.
- Successful slots and the overall generation flow are unaffected.

**Todo List**
1. Add `const [imageErrors, setImageErrors] = useState<(string | null)[]>([null, null, null, null])` in `page.tsx`.
2. Reset `setImageErrors([null, null, null, null])` at the start of `handleGenerate`.
3. In `fetchAllImages` `catch` block, call `setImageErrors` to set the error for slot `i`.
4. Add `handleRetryImage(index: number)` function in `page.tsx` — it clears the error, calls `/api/images`, and on success patches `deck.imageUrls` for that slot.
5. Pass `imageErrors={imageErrors}` and `onRetry={handleRetryImage}` to `<ArtGrid>`.
6. Add `imageErrors?: (string | null)[]` and `onRetry?: (index: number) => void` to `ArtGridProps` in `ArtGrid.tsx`.
7. In `ArtGrid`, add an `ImageErrorCard` sub-component that renders a muted card with a "↺ Retry" button calling `onRetry?.(index)`.
8. In the grid map: when `!url && imageErrors?.[idx]`, render `<ImageErrorCard>` instead of `<ImageSkeleton>`.

**Relevant Context**
- [`fetchAllImages() catch`](storyforge-ai/app/page.tsx:172) — currently `// Non-fatal — continue to next image` with empty catch body.
- [`ArtGrid`](storyforge-ai/components/ArtGrid.tsx:29) — props interface and grid map logic.
- [`ImageSkeleton`](storyforge-ai/components/ArtGrid.tsx:19) — pattern to follow for `ImageErrorCard`.
- [`<ArtGrid>` usage site`](storyforge-ai/app/page.tsx) — where new props are passed in.

**Status**: [x] done

---

## Execution Order

```
Sub-Task 1   verify + log blocking in pollinationsImage
     ↓
Sub-Task 3   confirm per-image stream-render (likely no-op)
     ↓
Sub-Task 2   add imageProgress → LoadingPipeline label
     ↓
Sub-Task 4   imageErrors + retry button in ArtGrid
```

Sub-Tasks 1 and 3 are low-risk confirmatory steps. Sub-Tasks 2 and 4 are the visible new features.

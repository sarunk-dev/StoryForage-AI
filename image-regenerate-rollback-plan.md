# Image Regenerate & Rollback Plan

---

### Sub-Task 0 — Make text-section Regenerate buttons visible as soon as text is ready

**Intent**
The three `onRegenerate` props on `StorySection`, `CharactersSection`, and `WorldSection` are currently gated on `isDone` (which requires all images to finish). Switching the gate to `hasText` (which is true the moment the text generation step completes) makes the buttons available immediately — while images are still generating — without any other side effects.

**Expected Outcomes**
- Regenerate buttons on Story, Characters, and World sections appear as soon as text content is visible, regardless of image generation state
- `onGenerateAudio` remains gated on `isDone` (audio regen should not trigger mid-pipeline)

**Todo List**
1. In `page.tsx`, change `isDone ? handleRegenerateStory` → `hasText ? handleRegenerateStory`
2. Change `isDone ? handleRegenerateCharacters` → `hasText ? handleRegenerateCharacters`
3. Change `isDone ? handleRegenerateWorld` → `hasText ? handleRegenerateWorld`

**Relevant Context**
- File: `storyforge-ai/app/page.tsx` lines 534, 544, 553
- `hasText` is already defined: `const hasText = deck?.story && deck?.characters && deck?.world`

**Status:** [ ] pending

---

## Top-Level Overview

Add per-image regeneration and rollback to the Concept Art section. Each of the 4 image slots gets a hover-reveal **Regenerate** button. Clicking it first calls Granite (via a new `target:"imagePrompt"` case in `/api/regenerate`) to write a fresh, context-aware art prompt using the **current** story/characters/world, then calls `/api/images` with that new prompt to get the new image. After the new image lands, a **rollback banner** appears below the grid so the user can revert or confirm — identical UX pattern to the text section rollbacks already built.

**Scope:**
- `lib/prompts.ts` — new `singleArtPrompt()` function
- `app/api/regenerate/route.ts` — new `target:"imagePrompt"` case
- `app/page.tsx` — new state + handler
- `components/ArtGrid.tsx` — hover Regenerate button + rollback banner

**Non-goals:** Regenerating all 4 images at once, changing the initial generation flow, touching the narration/audio pipeline.

---

## Sub-Tasks

---

### Sub-Task 1 — Add `singleArtPrompt()` to `lib/prompts.ts`

**Intent**
The existing `artPromptGenerator()` asks Granite to write all 4 prompts in one call. For per-image regeneration we need a version that asks for exactly **one** prompt at a specific index, so the output is a single string (not an array). This keeps Granite's context window small and the response format simple.

Each slot has a fixed semantic role:
- Index 0 — Establishing Scene (cinematic wide shot, key moment from the acts)
- Index 1 — Character Portrait (protagonist, using their physical description)
- Index 2 — Key Location (specific place from world.settingName)
- Index 3 — Thematic Mood (symbolic, abstract, captures the theme)

The prompt must embed the current story/characters/world so the output is coherent with the latest deck state — this is what makes it "in sync".

**Expected Outcomes**
- A new exported function `singleArtPrompt(index: number, story: StoryOutline, characters: Character[], world: WorldBuilding, opts: StoryOptions): string` exists in `lib/prompts.ts`
- The function builds a Granite user-prompt that includes: story title, logline, acts, protagonist name+description, world setting name+atmosphere, tone, genre/era notes (same notes as `artPromptGenerator`), and a clear per-slot instruction describing which type of image to produce
- It instructs Granite to return **only a single JSON string** (not an array) — e.g. `"A lone warrior standing on..."`
- The slot-specific instruction for index 1 explicitly names the protagonist and their physical description; index 2 explicitly names `world.settingName`; etc. — matching the per-slot rules already in `artPromptGenerator`

**Todo List**
1. Open `lib/prompts.ts` and read the tail (lines 230–301) — already done in investigation
2. After the existing `artPromptGenerator` function, add `export function singleArtPrompt(...)` 
3. Inside: extract protagonist (by role, fallback index 0) and antagonist — same logic as `artPromptGenerator`
4. Build the same `genreStyleNote`, `toneColorNote`, `eraVisualNote` strings as `artPromptGenerator`
5. Define a `SLOT_INSTRUCTIONS` array of 4 strings, one per slot role, each referencing live data (protagonist name, world name, story theme, etc.)
6. Return a prompt string that gives Granite the story context block, the slot instruction, and asks for `Return ONLY a single JSON string (no array, no markdown, just the quoted string)`

**Relevant Context**
- File: `storyforge-ai/lib/prompts.ts`
- Reference: `artPromptGenerator` at line 237 — reuse its context block structure and genre/tone/era note helpers exactly
- Types needed: `StoryOutline`, `Character`, `WorldBuilding`, `StoryOptions` — all already imported at the top of the file

**Status:** [ ] pending

---

### Sub-Task 2 — Add `target:"imagePrompt"` to `/api/regenerate/route.ts`

**Intent**
Extend the existing regenerate route with a new discriminated-union case that accepts the full current deck context plus an image slot index, calls Granite via `generateJSON<string>` with `singleArtPrompt`, and returns the resulting prompt string. The caller (`page.tsx`) will then immediately forward it to `/api/images`.

**Expected Outcomes**
- The route accepts `{ target: "imagePrompt", index: number, story, characters, world, options? }` in the POST body
- It validates that `index` is 0–3, `story`, `characters`, and `world` are present
- It calls `generateJSON<string>(singleArtPrompt(index, story, characters, world, opts), sys, { maxTokens: 256, signal })`
- Returns `{ imagePrompt: string }`
- The TypeScript discriminated union type for `target` is updated to include `"imagePrompt"`

**Todo List**
1. Open `app/api/regenerate/route.ts`
2. Import `singleArtPrompt` from `@/lib/prompts` alongside the existing imports
3. Update the `target` type in the body destructure to `"story" | "characters" | "world" | "imagePrompt"`
4. Add `WorldBuilding` to the imported types (needed to type the body)
5. After the `if (target === "world")` block, add `if (target === "imagePrompt")`:
   - Destructure `index` (number), `story`, `characters`, `world` from body
   - Validate all four are present; validate `index` is 0–3
   - Call `generateJSON<string>` with `singleArtPrompt(index, story, characters, world, opts)`, `sys`, `{ maxTokens: 256, signal }`
   - Return `NextResponse.json({ imagePrompt })`

**Relevant Context**
- File: `storyforge-ai/app/api/regenerate/route.ts`
- Pattern to follow: the existing `target === "world"` block (lines 76–88) — exact same structure
- `maxTokens: 256` is sufficient for a single image prompt string (vs 1024–2048 for text sections)

**Status:** [ ] pending

---

### Sub-Task 3 — Add state and handler to `page.tsx`

**Intent**
Add the client-side state and logic that orchestrates the two-step regenerate flow (Granite → FLUX) for a single image slot. Also add the rollback state mirroring the pattern already used for text sections.

**Expected Outcomes**
- `regeneratingImageIndex` state: `number | null` — tracks which slot (0–3) is currently regenerating; `null` means none
- `previousImageUrls` state: `(string | null)[]` with 4 slots — stores the pre-regeneration URL for rollback
- `handleRegenerateImage(index: number)` handler:
  1. Guard: if `!deck?.story || !deck?.characters || !deck?.world || regeneratingImageIndex !== null` return
  2. Snapshot `deck.imageUrls[index] ?? null` into `previousImageUrls[index]`
  3. Set `regeneratingImageIndex = index`
  4. POST to `/api/regenerate` with `{ target:"imagePrompt", index, story, characters, world, options }`
  5. On success: update `deck.imagePrompts[index]` with the new prompt
  6. POST that new prompt to `/api/images` with `{ prompt, index, genre, tone }`
  7. On success: update `deck.imageUrls[index]` with the new URL; set `previousImageUrls[index]` to the snapshotted old URL (making rollback available)
  8. Clear `regeneratingImageIndex = null` in `finally`
- `handleRollbackImage(index: number)`: restore `deck.imageUrls[index]` from `previousImageUrls[index]`; clear that slot in `previousImageUrls`
- `handleKeepImage(index: number)`: just clear that slot in `previousImageUrls`
- `previousImageUrls` is reset to `[null,null,null,null]` in `handleGenerate` alongside the other resets
- All new props are passed to `<ArtGrid />`

**Todo List**
1. Add `const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null);` with the other state declarations
2. Add `const [previousImageUrls, setPreviousImageUrls] = useState<(string | null)[]>([null, null, null, null]);`
3. In `handleGenerate`, add `setPreviousImageUrls([null, null, null, null])` alongside `setDeck(null)`
4. Add `handleRegenerateImage` as described above — the two-step fetch chain, with snapshot before step 1
5. Add `handleRollbackImage` and `handleKeepImage`
6. Update `<ArtGrid />` JSX to pass: `onRegenerate={isDone ? handleRegenerateImage : undefined}`, `regeneratingIndex={regeneratingImageIndex}`, `previousImageUrls={previousImageUrls}`, `onRollback={handleRollbackImage}`, `onKeep={handleKeepImage}`

**Relevant Context**
- File: `storyforge-ai/app/page.tsx`
- `handleRetryImage` (line ~311) — reference for how a single image slot update works; `handleRegenerateImage` follows the same `setDeck` update pattern
- `deck.imageUrls` is a `string[]` (filtered, no nulls); index-based access must handle the sparse case where the slot may be undefined
- The `handleRollbackStory` pattern (added in the previous rollback implementation) is the direct model for `handleRollbackImage`
- `deck.imagePrompts` is typed as `string[]` on `PitchDeck` — update it immutably with a spread

**Status:** [ ] pending

---

### Sub-Task 4 — Update `ArtGrid.tsx` — hover Regenerate button + rollback banner

**Intent**
Wire the new props into the component. Add a Regenerate button to each image's hover overlay (using the existing `group-hover` infrastructure already in place). Add a rollback banner below the 2×2 grid for any slot that has a previous version available. Show a loading overlay on the slot that is currently regenerating.

**Expected Outcomes**

**Hover overlay on each rendered image:**
- A small circular Regenerate button appears at the top-right corner of the image on hover (alongside the existing bottom label)
- While that slot is regenerating (`regeneratingIndex === idx`), the button is replaced by a spinning `Loader2` icon and the old image remains visible (no blank flash)
- The button is disabled / hidden during any regeneration (`regeneratingIndex !== null`) to prevent double-triggering

**Rollback banner:**
- Rendered below the 2×2 grid (not on-image) — same style as the text section rollback banners
- One banner per slot that has a `previousImageUrls[idx] !== null`
- Banner text: `"[LABEL] updated — keep it or roll back to the previous version."`
- Two buttons: **↩ Roll back** and **✓ Keep new** — identical styling to the existing rollback banners in `StorySection`, `CharacterCard`, and `WorldSection`

**New props added to `ArtGridProps`:**
```ts
onRegenerate?: (index: number) => void;
regeneratingIndex?: number | null;
previousImageUrls?: (string | null)[];
onRollback?: (index: number) => void;
onKeep?: (index: number) => void;
```

**Todo List**
1. Add `RefreshCw` is already imported — also import `Loader2`, `Undo2`, `Check` from `lucide-react`
2. Add the 5 new optional props to `ArtGridProps` interface
3. Destructure the new props in `ArtGrid`'s function signature
4. In the rendered-image branch (`if (url)`): 
   - Add a top-right absolutely-positioned button inside the `group` container: hidden by default (`opacity-0`), fades in on `group-hover:opacity-100`
   - If `regeneratingIndex === idx`: show `<Loader2 className="animate-spin">` instead, always visible (not hover-only), slightly dimmed overlay on image
   - If `regeneratingIndex !== null && regeneratingIndex !== idx`: disable the button (another slot is busy)
   - Button `onClick`: call `onRegenerate?.(idx)`
5. After the closing `</div>` of the 2×2 grid, add a rollback banners block:
   - Map over `IMAGE_LABELS` — for each index where `previousImageUrls?.[idx]` is non-null, render the rollback banner
   - Each banner: `"[label] updated — …"` + Roll back + Keep new buttons
   - Use `animate-in fade-in` consistent with other rollback banners

**Relevant Context**
- File: `storyforge-ai/components/ArtGrid.tsx`
- Existing hover overlay structure (lines 90–95) — the gradient + label already use `opacity-0 group-hover:opacity-100 transition-opacity` — the Regenerate button slots into this same pattern
- Rollback banner HTML/class structure: copy exactly from `StorySection.tsx` (the `{hasPrevious && (...)}` block) — same border, bg, button styles, icons
- `IMAGE_LABELS` array is already defined — use it for the banner label text

**Status:** [ ] pending

---

## Implementation Notes

- **`generateJSON<string>`** — the existing `generateJSON` in `lib/granite.ts` is generic, so `generateJSON<string>` works fine. Granite will return a JSON string literal like `"A lone warrior standing on..."` which `parseJSON` handles correctly since it finds the first `"` and last `"`.
- **Sparse `imageUrls` array** — `deck.imageUrls` filters out nulls, so `deck.imageUrls[index]` may be `undefined` if an earlier slot failed. The snapshot in `handleRegenerateImage` should use `deck.imageUrls[index] ?? null` safely.
- **`deck.imagePrompts` update** — update it immutably: `const updated = [...(deck.imagePrompts as string[])]; updated[index] = newPrompt; setDeck(prev => ({ ...prev, imagePrompts: updated }))` — this keeps the other slots' prompts intact.
- **Only one regeneration at a time** — `regeneratingImageIndex !== null` guards all entry points. No need for a separate per-slot loading array.
- **Rollback does not restore `imagePrompts`** — rolling back the URL is enough for the user. The prompt slot stays updated (it was already correct for the new content). If the user rolls back and then regenerates again, a fresh Granite call will produce a new prompt anyway.

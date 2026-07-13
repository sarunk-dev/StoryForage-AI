# Rollback Regenerate Plan

## Top-Level Overview

When a user clicks **Regenerate** on any section (Story, Characters, World), the new content immediately overwrites the old. This plan adds a **one-level-deep rollback** — once new content arrives, the user sees two inline action buttons ("Roll Back" and "Keep New") directly below the section header. Choosing Roll Back restores the previous version from local state; choosing Keep New discards the snapshot. No new API calls, no new components — just a small snapshot state and an inline confirmation banner threaded through existing props.

**Scope:** `page.tsx`, `StorySection.tsx`, `CharacterCard.tsx`, `WorldSection.tsx`.
**Non-goals:** Multi-level undo, rollback of audio, rollback of image URLs.

---

## Sub-Tasks

---

### Sub-Task 1 — Add `previousVersions` state and snapshot logic to `page.tsx`

**Intent**
Add a single piece of state that stores the pre-regeneration snapshot of whichever section was just regenerated, and wire it up in the three regenerate handlers. Also clear it on every fresh full generation.

**Expected Outcomes**
- `previousVersions` holds `{ story?: StoryOutline; characters?: Character[]; world?: WorldBuilding; } | null`
- Before each `setDeck(...)` in `handleRegenerateStory`, `handleRegenerateCharacters`, and `handleRegenerateWorld`, the old value is snapshotted into `previousVersions`
- `handleGenerate` resets `previousVersions` to `null` alongside `setDeck(null)`
- Three new handlers exist: `handleRollbackStory`, `handleKeepStory`, `handleRollbackCharacters`, `handleKeepCharacters`, `handleRollbackWorld`, `handleKeepWorld`
  - Each rollback handler: restores from snapshot → clears snapshot
  - Each keep handler: just clears snapshot (no deck mutation)

**Todo List**
1. In `page.tsx`, import `StoryOutline`, `Character`, `WorldBuilding` (already imported via the existing `import type` line — verify)
2. Add `const [previousVersions, setPreviousVersions] = useState<{ story?: StoryOutline; characters?: Character[]; world?: WorldBuilding; } | null>(null);` alongside the other `useState` declarations
3. In `handleGenerate`, add `setPreviousVersions(null)` next to `setDeck(null)`
4. In `handleRegenerateStory`: save `deck.story` to `previousVersions` BEFORE calling `setDeck`. After the fetch succeeds, snapshot then overwrite.
5. In `handleRegenerateCharacters`: save `deck.characters` to `previousVersions` BEFORE `setDeck`
6. In `handleRegenerateWorld`: save `deck.world` to `previousVersions` BEFORE `setDeck`
7. Add `handleRollbackStory` / `handleKeepStory` — rollback restores `story` from snapshot and calls `setPreviousVersions(null)`; keep just calls `setPreviousVersions(null)`
8. Add `handleRollbackCharacters` / `handleKeepCharacters` — same pattern for `characters`
9. Add `handleRollbackWorld` / `handleKeepWorld` — same pattern for `world`

**Relevant Context**
- File: `storyforge-ai/app/page.tsx`
- Existing handlers to modify: `handleRegenerateStory` (line ~168), `handleRegenerateCharacters` (line ~183), `handleRegenerateWorld` (line ~198)
- Existing `handleGenerate` (line ~55) — add `setPreviousVersions(null)` alongside `setDeck(null)` at line ~65
- All three types (`StoryOutline`, `Character`, `WorldBuilding`) are already imported via the existing `import type` line at the top of the file

**Status:** [x] done

---

### Sub-Task 2 — Thread rollback props into the JSX in `page.tsx`

**Intent**
Pass the new rollback/keep handlers and the "has previous" flag down to each section component via their existing prop surfaces.

**Expected Outcomes**
- `StorySection` receives `hasPrevious`, `onRollback`, `onKeep` props
- `CharactersSection` receives `hasPrevious`, `onRollback`, `onKeep` props
- `WorldSection` receives `hasPrevious`, `onRollback`, `onKeep` props
- The three `<SectionComponent ... />` usages in the JSX results block all pass the new props

**Todo List**
1. Locate the `<StorySection .../>` usage in the JSX (inside the `hasText && deck` block) and add:
   - `hasPrevious={!!previousVersions?.story}`
   - `onRollback={handleRollbackStory}`
   - `onKeep={handleKeepStory}`
2. Do the same for `<CharactersSection />`:
   - `hasPrevious={!!previousVersions?.characters}`
   - `onRollback={handleRollbackCharacters}`
   - `onKeep={handleKeepCharacters}`
3. Do the same for `<WorldSection />`:
   - `hasPrevious={!!previousVersions?.world}`
   - `onRollback={handleRollbackWorld}`
   - `onKeep={handleKeepWorld}`

**Relevant Context**
- File: `storyforge-ai/app/page.tsx`
- JSX results block at the bottom of the component, inside the `{hasText && deck && (` guard
- `StorySection`, `CharactersSection`, `WorldSection` component calls are already there — only adding new props

**Status:** [x] done

---

### Sub-Task 3 — Update `StorySection` to accept and render the rollback banner

**Intent**
Add the three new optional props to `StorySectionProps` and render a small inline banner between the section header and the title block when `hasPrevious` is true.

**Expected Outcomes**
- `StorySectionProps` has `hasPrevious?: boolean; onRollback?: () => void; onKeep?: () => void;`
- When `hasPrevious` is true, a compact two-button banner renders just below the section label row
- Banner contains:  "↩ Roll back" (ghost-styled) and "✓ Keep new" (primary-tinted)
- Banner disappears when `hasPrevious` becomes false (user chose an action)
- No layout shift when banner is absent

**Todo List**
1. Add `hasPrevious`, `onRollback`, `onKeep` to `StorySectionProps` interface in `StorySection.tsx`
2. Destructure the new props in the function signature
3. After the section-label `<div>` (the row with "Story Outline" + IBM badge + Regenerate button), insert a conditional banner:
   ```
   {hasPrevious && (
     <div className="...inline banner styles...">
       <button onClick={onRollback}>↩ Roll back</button>
       <button onClick={onKeep}>✓ Keep new</button>
     </div>
   )}
   ```
4. Style the banner to be compact and visually unobtrusive — amber/muted tint consistent with the existing `hover:text-primary` and `border-primary/20` patterns used in the Regenerate button. Use `animate-in fade-in` so it doesn't snap in abruptly.

**Relevant Context**
- File: `storyforge-ai/components/StorySection.tsx`
- Existing `StorySectionProps` interface at the top of the file
- Section label row starts at the `<div className="flex items-center justify-between gap-2 flex-wrap">` element
- Design language: `text-[11px] font-medium`, `rounded-lg px-2.5 py-1.5`, `border border-primary/20`, `text-primary` — match the existing Regenerate button style exactly

**Status:** [x] done

---

### Sub-Task 4 — Update `CharactersSection` to accept and render the rollback banner

**Intent**
Same as Sub-Task 3 but for the Characters section. `CharactersSection` is defined inside `CharacterCard.tsx`.

**Expected Outcomes**
- `CharactersSectionProps` has `hasPrevious?: boolean; onRollback?: () => void; onKeep?: () => void;`
- Rollback banner renders in the section header row, identical styling to `StorySection`

**Todo List**
1. Add `hasPrevious`, `onRollback`, `onKeep` to `CharactersSectionProps` in `CharacterCard.tsx`
2. Destructure the new props in `CharactersSection`'s function signature
3. Insert the conditional banner after the `<div className="flex items-center justify-between">` header row — same HTML/class structure as Sub-Task 3
4. Ensure the banner is identical in visual style to the one in `StorySection`

**Relevant Context**
- File: `storyforge-ai/components/CharacterCard.tsx`
- `CharactersSectionProps` interface and `CharactersSection` function near the bottom of the file
- The header `<div>` wraps the "Characters" label and the existing Regenerate button

**Status:** [x] done

---

### Sub-Task 5 — Update `WorldSection` to accept and render the rollback banner

**Intent**
Same pattern as Sub-Tasks 3 and 4 but for the World Building section.

**Expected Outcomes**
- `WorldSectionProps` has `hasPrevious?: boolean; onRollback?: () => void; onKeep?: () => void;`
- Rollback banner renders in the section header row with identical styling

**Todo List**
1. Add `hasPrevious`, `onRollback`, `onKeep` to `WorldSectionProps` in `WorldSection.tsx`
2. Destructure the new props in the function signature
3. Insert the conditional banner after the section header row — same structure as Sub-Tasks 3 and 4

**Relevant Context**
- File: `storyforge-ai/components/WorldSection.tsx`
- `WorldSectionProps` interface and `WorldSection` function

**Status:** [x] done

---

## Implementation Notes

- The rollback banner should use the `Undo2` and `Check` icons from `lucide-react` (already a dependency) for the two buttons — visually cleaner than text-only
- `previousVersions` state keys are mutually exclusive in practice (only one section regenerates at a time due to the `regenerating` guard), but the state shape supports all three simultaneously without any issue
- Audio is NOT rolled back — when the story rolls back, `actAudioUrls` stays as the cleared empty object `{}`, which correctly shows the "Regenerate Audio" button already present in `StorySection`
- TypeScript types for the new props should use `?:` (optional) so existing call-sites without rollback (e.g. `DemoDeck`) don't break

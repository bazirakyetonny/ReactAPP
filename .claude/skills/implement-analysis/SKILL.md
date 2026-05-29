---
name: implement-analysis
description: >
  Guide for working with the ReactAPP analysis feature — adding new URL sources to check,
  adding new sync content checks (e.g. title length rules), adding entirely new issue categories,
  and understanding how the two-pass debounce architecture works. Use this skill whenever the
  user wants to extend what the analysis scans for, change the issue shape, touch AnalysisPanel,
  useAnalysis, or analysisUtils — even if they phrase it as "add a check for X" or "flag Y in
  the analysis" without naming the files directly.
---

# Analysis Feature Implementation Guide

The analysis feature runs automatically whenever content changes and surfaces issues in the
NavBar + AnalysisPanel. It is split into two independent debounce paths so that fast (sync)
checks update the badge immediately while slow (HTTP) URL checks don't block the count.

---

## Architecture — two-pass debounce

```
infoContent / navContents / versionId change
         │
         ├─ 300 ms → runSyncChecks() → setSyncIssues(…)   ← tile text, future sync rules
         │
         └─ 4 000 ms → runUrlChecks() → setUrlIssues(…)   ← HTTP HEAD requests

return { issues: [...urlIssues, ...syncIssues], isAnalyzing, rerun }
```

- **Sync path** (`fastTimerRef`, `runSyncChecks`): pure in-memory checks, returns immediately.
  Add new sync checks here so the badge updates without waiting for HTTP.
- **URL path** (`slowTimerRef`, `runUrlChecks`): fires `gatherUrlCandidates` then
  `checkUrlCandidates` (Promise.all of `checkLink` calls). `cancelRef` aborts stale runs.
- On **version switch** a `useEffect` on `versionId` immediately clears `urlIssues` so the
  badge doesn't show stale data while the slow path re-runs.

---

## Key files

| File | Responsibility |
|---|---|
| `src/utils/analysisUtils.ts` | All check logic — `gatherUrlCandidates`, `checkUrlCandidates`, `checkTileText`; also exports `AnalysisHighlight` |
| `src/hooks/useAnalysis.ts` | Debounce wiring; returns `{ issues, isAnalyzing, rerun }` |
| `src/components/AnalysisPanel.tsx` | Portal panel — two collapsible sections, one per category |
| `src/components/AnalysisPanel.css` | Panel styles; section color variants live here |
| `src/components/tile/TileGrids.tsx` | Renders `phone-tile-analysis-label` on highlighted tiles |
| `src/components/tile/DraggableScreen.tsx` | Passes `analysisHighlight` down; renders `block-analysis-label` on CTA + image blocks |
| `src/App.tsx` | Builds `analysisHighlight` from `currentAnalysisIssue`; passes to `MainCanvas` |
| `src/components/MainCanvas.css` | CSS for `phone-tile-analysis-label`, `block-analysis-label`, outline highlight |
| `docs/analysis.md` | Authoritative rules (text limits, URL sources, issue shape) |

---

## AnalysisIssue shape

```ts
interface AnalysisIssue {
  id: string;           // unique React key — use a stable prefix + blockId + index
  category: 1 | 2;     // 1 = invalid URL, 2 = long text  (extend union for new categories)
  subcategory: 'invalid-url' | 'long-text';
  pageId: string;
  pageName: string;
  blockId: string;
  subItemId?: string;   // tile.Id when the issue is a specific tile within a TileGrid
  location: string;     // human label, e.g. "Tile 'My Title' link", "CTA 'Call us' image"
  detail: string;       // sentence shown in the panel row
  value: string;        // the raw URL or text that triggered the issue
}
```

## AnalysisHighlight shape

Exported from `analysisUtils.ts` and used by `DraggableScreen` / `TileGrids` to draw the
in-canvas highlight on the currently selected issue:

```ts
export interface AnalysisHighlight {
  blockId: string;
  tileId?: string;   // set when the issue targets a specific tile inside a TileGrid
  message: string;   // short label shown on the element — "Invalid URL" or "Text too long"
}
```

Built in `App.tsx` from `currentAnalysisIssue`:

```ts
const analysisHighlight = currentAnalysisIssue ? {
  blockId: currentAnalysisIssue.blockId,
  tileId: currentAnalysisIssue.subItemId,
  message: currentAnalysisIssue.category === 1 ? 'Invalid URL' : 'Text too long',
} : null;
```

When adding a new category, add a new branch to the ternary for its short label.

---

## How to extend

### Add a new URL source

Open `src/utils/analysisUtils.ts` → `gatherUrlCandidates`. Add an `if` branch for the new
block type and push a `UrlCandidate`:

```ts
if (block.InfoType === 'NewBlockType') {
  const url = block.SomeUrlField?.trim();
  if (url)
    candidates.push({
      url,
      pageId,
      pageName,
      blockId: block.InfoId,
      location: `NewBlockType '${block.SomeLabel || block.InfoId}'`,
    });
}
```

The URL is automatically checked by `checkUrlCandidates` — no other files need changes.
The image/weblink type is inferred by file extension regex in `checkUrlCandidates`.

---

### Add a new sync check (fast path)

Write a `checkXxx(blocks, pageId, pageName): AnalysisIssue[]` function in `analysisUtils.ts`,
then call it inside `runSyncChecks` in `useAnalysis.ts`:

```ts
// In useAnalysis.ts → runSyncChecks():
issues.push(...checkXxx(content, homeId, homeName));
for (const [pid, blocks] of Object.entries(nav)) { … issues.push(...checkXxx(blocks, pid, name)); }
```

The badge updates at 300 ms — no HTTP involved.

---

### Add a new category (full pipeline)

1. **Extend the type** — in `analysisUtils.ts`:
   ```ts
   category: 1 | 2 | 3;
   subcategory: 'invalid-url' | 'long-text' | 'your-subcategory';
   ```

2. **Write the check function** — `checkYyy(blocks, pageId, pageName): AnalysisIssue[]`
   in `analysisUtils.ts`. If it needs HTTP, add a `gatherYyyCandidates` + async checker pair
   and wire into the slow path (`runUrlChecks`). If it's sync-only, wire into `runSyncChecks`.

3. **Add a section to `AnalysisPanel.tsx`**:
   ```tsx
   const cat3 = issues.filter(i => i.category === 3);
   // …inside the body:
   <Section label="Category 3 — Your Label" count={cat3.length} open={openCat.has(3)}
     onToggle={() => toggleCat(3)} colorClass="ap-section--blue">
     {cat3.map(issue => <IssueRow key={issue.id} issue={issue} />)}
   </Section>
   ```

4. **Add the color class** in `AnalysisPanel.css`:
   ```css
   .ap-section--blue { border-left-color: #3b82f6; }
   .ap-section--blue .ap-section-header { color: #1d4ed8; }
   ```

5. **Update `docs/analysis.md`** — add the new category's rules table.

---

## Tile text limits (Category 2 rules)

These are encoded in `maxCharsForTile` in `analysisUtils.ts`. Do not duplicate them elsewhere.

| Columns | Tiles per column | Max chars |
|---|---|---|
| ≥ 3 | any | 12 |
| 2 | any | 15 |
| 1 | 1 | 30 |
| 1 | > 1 | 15 |

`colCount = block.Columns.length`, `tileCount = col.Tiles.length`.

---

## Current URL sources (Category 1)

| Block type | Field |
|---|---|
| `Images` | `img.InfoImageValue` |
| `TileGrid` tile | `tile.BGImageUrl` |
| `TileGrid` tile | `tile.Action.ObjectUrl` where `ObjectType === 'WebLink'` or `'DynamicForm'` |
| `Cta` | `attrs.CtaButtonImgUrl` |
| `Cta` | `attrs.CtaAction` where `CtaType === 'Weblink'` |
| `Cta` | `attrs.CtaObjectUrl` where `CtaType === 'Form'` |

---

## Pages scanned

Every page in the loaded app version is scanned on startup — not just visited pages.
`allNavPages()` in `useAnalysis.ts` iterates `pages` (from `currentVersion.Page`), skips the
home page and module pages, and for each one:
- uses `navContents[pageId]` if the user has visited it (live, reflects unsaved edits)
- otherwise parses `page.PageStructure` from the version data (available immediately on load)

Module page types (`BulletinBoard`, `Calendar`, `MyActivity`, `Map`) are skipped — they have
no editable content blocks to analyse. The home page is always covered by `infoContent`.

---

## In-canvas highlight rendering

When the user navigates to an issue in `AnalysisPanel`, the highlighted element gets a red
solid outline and a short label badge overlapping its bottom border.

### CSS classes (in `MainCanvas.css`)

| Class | Applied to | Effect |
|---|---|---|
| `phone-tile-wrap--analysis` | `.phone-tile-wrap` | `outline: 2px solid #ef4444` on the inner `.phone-tile` |
| `phone-tile-analysis-label` | `div` inside `.phone-tile-wrap` | Badge at `bottom: -7px`, centered, overlaps the tile's bottom border |
| `phone-cta-block--analysis` | `.phone-cta-block` | Ring on fullwidth CTA; outline on round CTA |
| `block--analysis-highlight` | wrapper `div` around image/CTA blocks | `position: relative` + ring on image elements |
| `block-analysis-label` | `div` inside the wrapper | Same badge style as tile label, at `bottom: -7px` |

### Where labels are rendered

- **Tiles** — `TileGrids.tsx`: renders `<div className="phone-tile-analysis-label">` inside
  `.phone-tile-wrap` when `isAnalysisHighlight && analysisHighlightMessage`.
- **Round CTAs** — `DraggableScreen.tsx`: renders `<div className="block-analysis-label">` inside
  the per-CTA wrapper div (which has `style={{ position: 'relative' }}`).
- **Fullwidth CTAs** — `DraggableScreen.tsx`: same pattern on the single-CTA wrapper div.
- **Image blocks** — `DraggableScreen.tsx`: renders inside the `.block--analysis-highlight`
  wrapper (which already has `position: relative` from CSS).

### Prop flow

```
App.tsx  →  analysisHighlight  →  MainCanvas  →  DraggableScreen
                                                    ├─ TileGrids  (analysisHighlightTileId, analysisHighlightMessage)
                                                    ├─ CtaBlock   (isAnalysisHighlight)
                                                    └─ label div  (block-analysis-label)
```

When adding highlight support for a **new block type**:
1. Add a `<div style={{ position: 'relative' }}>` wrapper around the block component.
2. Render `<div className="block-analysis-label">{analysisHighlight.message}</div>` inside it
   when `analysisHighlight?.blockId === block.InfoId`.
3. Pass `isAnalysisHighlight={analysisHighlight?.blockId === block.InfoId}` to the block
   component if it renders its own visual ring.

---

## Pitfalls

- **Do not call `checkLink` directly from components.** All URL checking flows through
  `checkUrlCandidates` in `analysisUtils.ts` so results are batched in a single `Promise.all`.
- **Sync checks must be pure.** `runSyncChecks` is called inside a 300 ms `setTimeout` with
  no `await`. Any async work belongs in the slow path.
- **`cancelRef` guards stale async results.** After every `await` in `runUrlChecks`, check
  `if (cancelRef.current) return;` before calling `setUrlIssues`.
- **`block--analysis-highlight` requires `position: relative`** in CSS. Without it the
  `block-analysis-label` (which is `position: absolute`) escapes to the nearest positioned
  ancestor and won't appear on the element.
- **File size limit is 400 lines.** If `analysisUtils.ts` grows large, split check functions
  into domain-specific files (e.g. `src/utils/analysisTileChecks.ts`) and re-export from
  `analysisUtils.ts`.

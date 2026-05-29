# Analysis Feature

The analysis feature scans the loaded app version for two categories of content issues and surfaces them in a dedicated panel accessible from the NavBar.

---

## Trigger

- **On version load** — runs automatically after a 4-second debounce once `infoContent`, `navContents`, or `versionId` changes.
- **On demand** — clicking the Re-run button inside the Analysis panel runs it immediately.

---

## Category 1 — Invalid URLs

Checks whether URLs embedded in content blocks are reachable. Uses the same `checkLink()` helper as the link checker.

### Sources scanned

| Block type | Field checked |
|---|---|
| `Images` | Each `img.InfoImageValue` |
| `TileGrid` tile | `tile.BGImageUrl` |
| `TileGrid` tile | `tile.Action.ObjectUrl` where `ObjectType === 'WebLink'` or `'DynamicForm'` |
| `Cta` | `attrs.CtaButtonImgUrl` (image-type button) |
| `Cta` | `attrs.CtaAction` where `CtaType === 'Weblink'` |
| `Cta` | `attrs.CtaObjectUrl` where `CtaType === 'Form'` |

### Pages scanned

- Home page (`infoContent` from `App.tsx`)
- All nav pages (`navContents` — one entry per linked page)

---

## Category 2 — Long Text

Covers both tile text and CTA label length checks.

### 2a — Long Tile Text

Checks whether the `Text` field of each tile exceeds the maximum allowed length for its grid layout.

| Grid columns | Tiles per column | Max chars |
|---|---|---|
| 3 | any | 12 |
| 2 | any | 15 |
| 1 | 1 | 30 |
| 1 | > 1 | 15 |

Column count = `block.Columns.length`. Tile count = `col.Tiles.length` per column.

### 2b — Long CTA Label

Checks whether the `CtaLabel` field of each CTA block exceeds the maximum allowed length for its button type and, for Round buttons, the number of buttons sharing the same row.

**Round buttons** — consecutive Round CTAs are grouped into rows of up to 3 (matching the canvas rendering logic):

| Buttons in row | Max chars |
|---|---|
| 3 | 8 |
| 2 | 15 |
| 1 | 30 |

**Other button types:**

| Button type | Max chars |
|---|---|
| FullWidth | 30 |
| Icon | 20 |
| Image | 20 |

Implementation: `checkCtaText` in `src/utils/analysisUtils.ts`. Runs on the fast sync path (300 ms debounce) alongside tile text checks.

---

## Issue shape

```ts
interface AnalysisIssue {
  id: string;                          // unique React list key
  category: 1 | 2;
  subcategory: 'invalid-url' | 'long-text';
  pageId: string;
  pageName: string;
  blockId: string;
  location: string;   // e.g. "Tile 'My Title'", "CTA 'Call us' link"
  detail: string;     // human-readable description shown in the panel
  value: string;      // the URL or text that triggered the issue
}
```

---

## Implementation files

| File | Role |
|---|---|
| `src/utils/analysisUtils.ts` | `gatherUrlCandidates`, `checkUrlCandidates`, `checkTileText`, `checkCtaText` |
| `src/hooks/useAnalysis.ts` | Debounced scan; returns `{ issues, isAnalyzing, rerun }` |
| `src/components/AnalysisPanel.tsx` | Floating portal panel with two collapsible sections |
| `src/components/AnalysisPanel.css` | Panel styles |

---

## Extending the feature

### Add a new URL source

In `analysisUtils.ts` → `gatherUrlCandidates`, add a new `if` branch for the block type and push a `UrlCandidate` object with `url`, `pageId`, `pageName`, `blockId`, and `location`.

### Add a new category

1. Add a new `category` value to `AnalysisIssue` (e.g. `3`).
2. Write a `checkXxx(blocks, pageId, pageName): AnalysisIssue[]` function in `analysisUtils.ts`.
3. Call it inside `runAnalysis` in `useAnalysis.ts` and merge the results into `setIssues`.
4. Add a new `<Section>` in `AnalysisPanel.tsx` with a matching color class.
5. Add the color class to `AnalysisPanel.css` (e.g. `.ap-section--blue`).

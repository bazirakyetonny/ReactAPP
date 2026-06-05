---
noteId: "bd40207060f011f1a58cdfe0d3109bca"
tags: []

---

# Multi-Select Feature

Multi-select lets users drag a marquee rectangle across the canvas to select multiple content blocks — tiles, CTAs, images, and descriptions — spanning one or more page frames. Selected items can then be copied, cut, and pasted via action buttons and the Add Block menu.

---

## Activation and Exit

Multi-select mode is toggled by a button in the toolbar that calls `toggleMultiSelectMode()` from `useMultiSelect`. While active the canvas becomes read-only (all editing interactions are disabled).

Exit conditions:
- Clicking the same toolbar button again
- Pressing `Escape`
- Clicking an empty area of the canvas without dragging (tap-to-dismiss)
- Clicking **Copy** or **Cut** in the selection overlay

---

## State — `src/hooks/useMultiSelect.ts`

All selection state lives in a single custom hook:

```ts
{
  isMultiSelectMode: boolean
  selectedTileIds: Set<string>        // individual tile IDs (not grid IDs)
  selectedCtaIds: Set<string>         // block InfoIds for Cta blocks
  selectedImageIds: Set<string>       // block InfoIds for Images blocks
  selectedDescriptionIds: Set<string> // block InfoIds for Description blocks

  toggleMultiSelectMode()  // enters or exits; clears all sets on exit
  exitMultiSelectMode()    // always exits and clears all sets
  setSelectedTileIds(set)
  setSelectedCtaIds(set)
  setSelectedImageIds(set)
  setSelectedDescriptionIds(set)
}
```

`App.tsx` consumes the hook and threads the state/setters down to `MainCanvas` and `SidebarRight`.

---

## Marquee Selection — `src/components/MainCanvas.tsx`

When `isMultiSelectMode` is true the canvas root element handles three mouse events:

| Event | Action |
|---|---|
| `mousedown` | Records the drag origin in `marqueeOriginRef` and initialises `marquee` state |
| `mousemove` | Updates `marquee` state, driving the visible selection rectangle |
| `mouseup` | Finalises the selection or exits mode (if no drag occurred) |

On `mouseup`, if the movement exceeded 5 px in either axis, the handler queries the entire canvas DOM for all four block types and checks each element's bounding rect against the marquee bounds:

```ts
canvasEl.querySelectorAll("[data-tile-id]")        // → selectedTileIds
canvasEl.querySelectorAll("[data-cta-id]")         // → selectedCtaIds
canvasEl.querySelectorAll("[data-image-id]")       // → selectedImageIds
canvasEl.querySelectorAll("[data-description-id]") // → selectedDescriptionIds
```

The four resulting sets are passed to `onSelectionChange(tileIds, ctaIds, imageIds, descIds)` which calls the four setters from `useMultiSelect`. Because the canvas contains all visible frames, IDs from all open page frames are included in a single drag.

### Read-only canvas

While multi-select mode is active, `interactionsLocked` is set to `true` for all `DraggableScreen` instances, preventing any tile or block editing.

---

## DOM Data Attributes

Each selectable element carries a data attribute used both for marquee hit-testing and for overlay bounds computation:

| Block type | DOM attribute | InfoType value |
|---|---|---|
| Tile | `data-tile-id="{tile.Id}"` | (nested in `TileGrid`) |
| CTA | `data-cta-id="{block.InfoId}"` | `"Cta"` |
| Image | `data-image-id="{block.InfoId}"` | `"Images"` |
| Description | `data-description-id="{block.InfoId}"` | `"Description"` |

These attributes are set on the root element of each block component:
- `src/components/tile/TileGrids.tsx` — `[data-tile-id]` on the tile wrapper
- `src/components/phone/CtaBlock.tsx` — `[data-cta-id]` on the block root
- `src/components/phone/ImageBlock.tsx` — `[data-image-id]` on the block root
- `src/components/phone/DescriptionBlock.tsx` — `[data-description-id]` on the block root

---

## Per-item Highlight

When an item is selected it receives a `--multi-selected` modifier class that applies a teal `outline`:

```css
/* example — same rule pattern for all four types */
.phone-cta-block--multi-selected,
.phone-image-block--multi-selected,
.phone-desc-block--multi-selected { outline: 2px solid #14b8a6; outline-offset: 2px; }
```

Tile highlight uses `phone-tile-wrap--multi-selected` (defined in `MainCanvas.css`). The class is applied inside each block component when the corresponding `isMultiSelected` prop is true. `DraggableScreen` computes this prop by checking the relevant selection set: e.g. `isMultiSelected={multiSelectedImageIds?.has(block.InfoId)}`.

---

## Selection Overlay — `src/components/tile/SelectionOverlay.tsx`

Each `DraggableScreen` renders a `SelectionOverlay` as the last child of `.phone-screen`. The overlay computes a **per-page bounding box** that encloses all selected items on that page.

### Bounding-box algorithm (`useLayoutEffect`)

After every paint the overlay:

1. Queries `containerRef` (the `.phone-screen` div) for all four data-attribute element types.
2. For each element whose ID is in the corresponding selection set it measures the element's position relative to the container, accounting for scroll.
3. For block types whose root element has horizontal padding (CTA, Image, Description), the **visual child** element is measured instead of the root, so the outline stays within the phone border:

| Block type | Visual child queried |
|---|---|
| Tile | root element (no padding issue) |
| CTA | `.phone-cta-fullwidth` or `.phone-cta-round-wrap` |
| Image | `.phone-image-single`, `.phone-image-carousel`, or `.phone-image-empty` |
| Description | `.phone-desc-content` |

4. A 5 px padding is added around the computed min/max rectangle to produce the final `bounds`.
5. If no selected items are found (IDs are from a different page frame), `bounds` is `null` and the overlay renders nothing.

### Overlay markup

```
.selection-outline-container   (position: absolute, z-index: 50)
  └── svg.selection-outline-svg
        └── rect.marching-ants   (animated dashed stroke — "marching ants")
  └── .selection-actions
        ├── button.selection-action-btn  [Copy]
        └── button.selection-action-btn  [Cut]
```

`onMouseDown` and `onMouseUp` on the container call `stopPropagation` so that clicks on the overlay do not trigger the canvas marquee logic or the tap-to-dismiss handler.

### CSS — `src/components/tile/SelectionOverlay.css`

The marching-ants animation:

```css
.marching-ants { animation: marchAnts 0.5s linear infinite; }
@keyframes marchAnts { to { stroke-dashoffset: -12; } }
```

Action buttons sit 38 px below the bottom edge of the overlay, centred horizontally.

---

## Prop Threading

```
App.tsx
  ↓ selectedTileIds / selectedCtaIds / selectedImageIds / selectedDescriptionIds
  ↓ onCopySelected / onCutSelected / hasClipboard / onPasteBlocks
MainCanvas.tsx
  ↓ multiSelectedTileIds / multiSelectedCtaIds / multiSelectedImageIds / multiSelectedDescriptionIds
  ↓ onCopySelected / onCutSelected / hasPaste / onPasteBlocks
DraggableScreen.tsx
  ├── passes isMultiSelected to each block component
  ├── passes sets to SelectionOverlay
  └── wraps copy/cut callbacks: onCopy={() => onCopySelected?.(infoContent)}
```

`onSelectionChange` flows upward from `MainCanvas` → `App.tsx` via the same prop.

---

## Copy

`handleCopySelected(sourceBlocks: any[])` in `App.tsx`:

1. Calls `collectClipboardItems(sourceBlocks)` which scans only the blocks belonging to the page whose overlay button was clicked.
2. For each selected tile it wraps the tile in a standalone single-tile `TileGrid` block so the clipboard is a flat array of top-level blocks.
3. Stores the result in `clipboard` state (`useState<any[]>([])`).
4. Calls `exitMultiSelectMode()`.

Clipboard state persists across mode changes until overwritten by a new Copy or Cut.

---

## Cut

`handleCutSelected(sourceBlocks: any[])` in `App.tsx`:

1. Populates the clipboard via `collectClipboardItems(sourceBlocks)` (same as Copy).
2. Builds per-type delete transforms from the current selection sets.
3. Identifies which page `sourceBlocks` belongs to using **reference equality**:
   - If `sourceBlocks === infoContent` → calls `setInfoContent(applyDeletes)`
   - Otherwise finds the matching `navContents[pageId]` entry → calls `setNavContents` for that page only
4. Calls `exitMultiSelectMode()`.

This scoping ensures that only the page where Cut was clicked is mutated, even if the global selection sets contain IDs from other pages.

---

## Paste — `src/utils/contentTransforms.ts` + `AddBlockMenu`

### Triggering paste

The `+` button between blocks opens `AddBlockMenu`. When `clipboard.length > 0` (passed as `hasPaste`) a **Paste** item appears at the bottom of the menu. Clicking it calls `onPaste()` which routes to:

- Home page: `handlePasteToHome(insertBeforeInfoId)` → `setInfoContent`
- Linked pages: `frame.onPasteBlocks(insertBeforeInfoId)` built in `src/utils/linkedFrames.ts` → `navUpdater(pageId)`

Both call `applyPasteBlocks` from `contentTransforms.ts`.

### `applyPasteBlocks`

Regenerates fresh IDs for every pasted block to prevent ID collisions on repeated pastes:

| Block type | New ID format |
|---|---|
| `TileGrid` | `grid-p{ts}{i}`, nested `ColId` and tile `Id` also regenerated |
| `Cta` | `cta-p{ts}{i}` |
| `Images` | `img-p{ts}{i}` |
| `Description` | `desc-p{ts}{i}` |

Blocks are inserted sequentially before `insertBeforeInfoId` (or appended if `null`). Because each block is inserted before the same target, the original order is preserved.

### Stale-closure prevention

`linkedFrames.ts` receives `getClipboard: () => any[]` (a callback, not the clipboard value directly) so that each linked frame's `onPasteBlocks` always reads the current clipboard at call time rather than a stale closure value.

---

## File Reference

| File | Role |
|---|---|
| `src/hooks/useMultiSelect.ts` | Selection state and mode management |
| `src/components/MainCanvas.tsx` | Marquee drag logic; `onSelectionChange` callback |
| `src/components/tile/SelectionOverlay.tsx` | Per-page bounding-box overlay with Copy/Cut buttons |
| `src/components/tile/SelectionOverlay.css` | Marching-ants animation and action button styles |
| `src/components/tile/DraggableScreen.tsx` | Wires selection sets to block components and SelectionOverlay |
| `src/components/phone/CtaBlock.tsx` | `data-cta-id` attribute; `isMultiSelected` class |
| `src/components/phone/ImageBlock.tsx` | `data-image-id` attribute; `isMultiSelected` class |
| `src/components/phone/DescriptionBlock.tsx` | `data-description-id` attribute; `isMultiSelected` class |
| `src/components/phone/AddBlockMenu.tsx` | Paste menu item (visible when clipboard is non-empty) |
| `src/utils/contentTransforms.ts` | `applyPasteBlocks` — ID regeneration and insertion |
| `src/utils/linkedFrames.ts` | `onPasteBlocks` per linked frame; `getClipboard` callback |
| `src/App.tsx` | `collectClipboardItems`, `handleCopySelected`, `handleCutSelected`, `handlePasteToHome`, `clipboard` state |
| `src/components/MainCanvas.css` | `--multi-selected` outline rules for all block types |

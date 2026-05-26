# TileGrid — Structure, Layout Rules, and Drag Behaviour

## Data structure

A `TileGrid` is a building block (`InfoType: "TileGrid"`) inside a page's `InfoContent` array. It holds an ordered array of columns; each column holds an ordered array of tiles.

```json
{
  "InfoId": "abc123",
  "InfoType": "TileGrid",
  "Columns": [
    {
      "ColId": "col1",
      "Tiles": [
        {
          "Id": "tile1",
          "Text": "Tile label",
          "Color": "#ffffff",
          "Align": "center",
          "Icon": "library",
          "IconId": null,
          "IconCodeName": null,
          "IconSVG": null,
          "BGColor": "accentColor",
          "BGImageUrl": "",
          "Opacity": 0,
          "Height": "",
          "Action": {
            "ObjectType": "Information",
            "ObjectId": "<PageId>",
            "ObjectUrl": ""
          }
        }
      ]
    }
  ]
}
```

### Tile fields

| Field | Description |
|---|---|
| `Id` | Unique tile ID |
| `Text` | Label text rendered on the tile |
| `Color` | Text colour (hex) |
| `Align` | `"center"` (default) or `"left"` |
| `Icon` / `IconCodeName` | Icon name — resolved by `resolveIconSVG()` against `themeIcons` |
| `IconId` | Numeric icon ID — also used by `resolveIconSVG()` |
| `IconSVG` | Raw SVG string — fallback if no `themeIcons` match |
| `BGColor` | Theme colour key (`"accentColor"`, `"secondaryColor"`, `"backgroundColor"`, `"textColor"`) or empty |
| `BGImageUrl` | Background image URL; when set, `BGColor` is ignored |
| `Opacity` | Background image dim overlay — `0` = none, `1` = fully dimmed |
| `Height` | Stored height in px (string or number); `""` / `0` = default 80 px |
| `Action` | Navigation action on tap — see below |

### Tile action types

| `ObjectType` | Behaviour |
|---|---|
| `Information` | Navigate to a linked `Information` page (opens a new frame) |
| `BulletinBoard` / `Calendar` / `MyActivity` / `Map` | Navigate to the corresponding module page |
| `WebLink` | Opens the URL from `Action.ObjectUrl` in the `WebLink` page iframe |
| `DynamicForm` | Opens a form; `Action.FormId` carries the form ID |
| `""` / empty | No navigation — tile is decorative |

---

## Layout constraints

### Column limit

- **Maximum 3 columns** per TileGrid.
- The **"Add column" button** is only shown when:
  - The grid has fewer than 3 columns, **and**
  - It is not the case that the grid already has 2 columns where any column has more than 1 tile.

In short: a 3rd column can only be added when both existing columns are single-tile.

### Tile limit per column

- **Maximum 3 tiles** per column.

### Derived constraints in practice

| Grid shape | Can add column? | Can resize tile? |
|---|---|---|
| 1 col × 1 tile | Yes | Yes |
| 1 col × 2-3 tiles | Yes (adds 2nd col) | No (resize only for single-tile col) |
| 2 cols × 1 tile each | Yes (adds 3rd col) | Yes |
| 2 cols, one col has >1 tile | No | Yes (single-tile col only) |
| 3 cols | No | No |

---

## Height system

### Constants (`src/constants.ts`)

| Constant | Value | Meaning |
|---|---|---|
| `TILE_H` | `80` px | Default tile height and base unit |
| `TILE_GAP` | `6` px | Gap between stacked tiles in the same column |

### Auto-stretch (derived height)

When a 2-column grid has one column with **1 tile** and the other with **multiple tiles**, the single tile automatically stretches to match the total height of the tall column. This is computed at render time — the height is not stored in data:

```
derived height = (oppositeCount × 80) + ((oppositeCount − 1) × 6)
```

| Opposite col tiles | Derived height |
|---|---|
| 2 | 166 px |
| 3 | 252 px |

### Stored height

For standalone (single-column) tiles, the height is stored in `tile.Height` after a resize. Valid stored values snap to `[80, 120, 160]` px.

---

## Resize behaviour

Resizing is triggered by dragging the **resize handle** at the bottom of a selected tile. The handle is only shown when the tile is the **only tile in its column** and the grid has **1 or 2 columns**.

Three resize modes exist depending on the grid shape:

### 1. Simple mode (1-column grid)

The tile height snaps to the nearest of `[80, 120, 160]` px. A **soft snap zone of ±12 px** is used during drag — within 12 px of a snap point it locks to it; outside that zone it moves freely (pixel-rounded). On mouse-up the final value hard-snaps.

### 2. Split mode (2-column grid, both sides have 1 tile)

Dragging the lone tile in one column resizes it and simultaneously shows **skeleton slots** in the opposite column, previewing how many tiles will be created there. Snaps to:

| Snap value | Means |
|---|---|
| 80 px | 1 tile in opposite col (no change) |
| 166 px | 2 tiles in opposite col |
| 252 px | 3 tiles in opposite col |

On release, new tiles are added to the opposite column to fill the snapped count. Any "passed-through" zones that were shown but then retreated past generate standalone tiles added to the page.

### 3. Free-resize mode (2-column grid, this side 1 tile, other side has >1 tile)

Dragging this lone tile resizes it and shows/hides ghost slots on the opposite column. The ghost slots preview how many of the existing opposite tiles remain visible at that height. Snaps to the same `[80, 166, 252]` values. On release, `onFreeResizeRelease` is called with the snap height and zone count; it restores the opposite column's tile array to match.

---

## Tile drag behaviour

Dragging a tile (mousedown on the tile body, not on buttons or the resize handle) shows a floating ghost and computes a live drop target. Movement less than **4 px** does not start the drag.

When drag starts, DOM bounding rects for all columns, grids, and block wrappers are **snapshot once** and reused for the entire drag (no layout thrashing during mousemove).

### Drop target rules

Drop target logic (`calcDropTarget`) evaluates each TileGrid by hovering:

#### Within the same grid and same column (`sameGrid && hoverCol === fromCol`)

- Source column has only **1 tile**: invalid (would be a no-op).
- Source column has **>1 tiles**: reorder. The column is divided into zones excluding the no-op insert positions (above and below the current tile), and the insert index is determined from the cursor Y position.

#### Within the same grid, different column (`sameGrid && hoverCol !== fromCol`)

- Source column has **1 tile** (the whole tile is moving): **column swap** — the two columns exchange positions. A ghost slot of the source tile's height is shown in the target column.
- Source column has **>1 tiles** and target column has **1 tile**: invalid (would leave an asymmetric multi/single split).
- Other combinations: not handled (returns null).

#### Cross-grid (different TileGrid, same or different frame)

- Target grid **all-single-tile** columns:
  - < 3 columns: drop creates a **new column** in the target grid. Position is determined by cursor X relative to column midpoints.
  - 3 columns: invalid.
- Target grid **has a multi-tile column**:
  - Hover column has exactly **2 tiles**: insert as the 3rd tile in that column.
  - Hover column has 1 or ≥3 tiles: invalid.

#### Drop as a new block (between grids)

If the cursor is in the gap between two TileGrids (or at the top/bottom of the content area), the tile is extracted from its source grid and inserted as a **new standalone TileGrid** at that position. The inner 24 px of each grid's top and bottom edges remain in "tile-drop" mode; only the true gaps trigger block-insert.

#### Cross-frame drops

Tiles can be dragged across linked-page frames (the horizontal carousel of pages visible in the canvas). Cross-frame drops follow the same grid rules as above, applied to the target frame's content. A tile can also be dropped onto an empty frame, which inserts it as the first TileGrid there.

### Ghost

While dragging, a floating `phone-tile-ghost` div follows the cursor, offset by the initial grab position within the tile. It renders the tile's background, icon, and text using the same styles as the real tile.

---

## Block drag behaviour

Entire content blocks (TileGrid, Description, Image, Cta) can be reordered by dragging the block's drag handle. Movement less than **4 px** does not start the drag.

Drop position uses **midpoint detection**: the boundary between two adjacent blocks is at the midpoint of the upper block's bounding rect. The block being dragged is excluded from drop-target consideration (cannot drop onto itself).

Block drag also supports cross-frame movement: if the cursor moves into a different frame, the drop target switches to that frame's content order.

A `phone-block-ghost` follows the cursor during drag, rendering a full preview of the block content.

---

## Icon resolution

`resolveIconSVG(tile, themeIcons)` in `src/utils/tileUtils.ts` tries these sources in order:

1. Match `tile.IconId` against `themeIcons[].IconId`
2. Match `tile.IconCodeName` against `themeIcons[].IconCodeName`
3. Match `tile.Icon` (name string) against `themeIcons[].IconCodeName`
4. Fall back to `tile.IconSVG` (raw embedded SVG)
5. Return `null` (no icon rendered)

If `themeIcons` is not passed to `TileGrids`, only step 4 works — tiles that reference icons by ID or code name render blank.

---
name: linked-pages
description: >
  Guide for retrieving all linked pages of the current app version from the data store.
  Linked pages are all pages reachable via BFS from the Home page through tile navigation
  actions. Use this skill whenever the task involves iterating over pages the user has
  wired up, checking which pages are reachable, building page lists, or doing anything
  that requires "all pages connected to Home".
---

# Getting All Linked Pages from the Data Store

Linked pages = all pages reachable from the Home page by following tile navigation links
(depth-first or BFS). Orphan pages (not linked from any tile) are excluded.

---

## Data store keys

```ts
import { dataStore } from '../data/datastore';

const currentVersion = dataStore.get('Current_Version');
const allPages: any[] = currentVersion?.Page ?? [];
```

`Current_Version.Page` is the authoritative page list for the loaded version. It is kept
in sync throughout the session — every page create/delete/rename updates both the React
state and the data store.

---

## Identifying the Home page

```ts
const homePage = allPages.find((p: any) => p.PageName?.toLowerCase() === 'home');
const homeId   = homePage?.PageId ?? '';
```

There is exactly one Home page per version. It is identified solely by name — `"home"` in
any casing. It has no special `PageType` field.

---

## Page content resolution

Each page's content blocks can come from two sources, in priority order:

```ts
function blocksForPage(pageId: string, navContents: Record<string, any[]>): any[] {
  // 1. Live in-memory edits (reflects unsaved changes the user has made this session)
  if (navContents[pageId] !== undefined) return navContents[pageId];

  // 2. Stored PageStructure (available immediately for all pages, even unvisited ones)
  const page = allPages.find((p: any) => p.PageId === pageId);
  if (!page?.PageStructure) return [];
  try { return JSON.parse(page.PageStructure).InfoContent ?? []; }
  catch { return []; }
}
```

The Home page's live content is `infoContent` (passed separately from navContents in App.tsx).

---

## Page link types

Tiles link to pages via `tile.Action`. Only these `ObjectType` values navigate to another page:

```ts
const PAGE_LINK_TYPES = new Set([
  'Information',   // regular content page
  'BulletinBoard', // module page
  'Calendar',      // module page
  'MyActivity',    // module page
  'Map',           // module page
]);
```

The linked page id is `tile.Action.ObjectId`.

---

## Extracting direct child links from blocks

```ts
function linkedPageIds(blocks: any[]): string[] {
  const ids: string[] = [];
  for (const block of blocks) {
    if (block.InfoType !== 'TileGrid') continue;
    for (const col of block.Columns ?? []) {
      for (const tile of col.Tiles ?? []) {
        if (PAGE_LINK_TYPES.has(tile.Action?.ObjectType) && tile.Action?.ObjectId) {
          ids.push(tile.Action.ObjectId);
        }
      }
    }
  }
  return ids;
}
```

---

## BFS to get all reachable pages

This is the canonical pattern, mirrored by `reachablePages()` in `src/hooks/useAnalysis.ts`:

```ts
function getLinkedPages(
  homeContent: any[],
  navContents: Record<string, any[]>,
  allPages: any[],
): Array<{ pageId: string; pageName: string; blocks: any[] }> {
  const homePage = allPages.find((p: any) => p.PageName?.toLowerCase() === 'home');
  const homeId   = homePage?.PageId ?? '';

  const result: Array<{ pageId: string; pageName: string; blocks: any[] }> = [];
  const visited = new Set<string>([homeId]);
  const queue   = linkedPageIds(homeContent);   // seed from home's tiles

  while (queue.length > 0) {
    const pageId = queue.shift()!;
    if (visited.has(pageId)) continue;
    visited.add(pageId);

    const page = allPages.find((p: any) => p.PageId === pageId);
    if (!page) continue;

    const blocks = blocksForPage(pageId, navContents);
    result.push({ pageId, pageName: page.PageName ?? pageId, blocks });

    for (const childId of linkedPageIds(blocks)) {
      if (!visited.has(childId)) queue.push(childId);
    }
  }
  return result;   // does NOT include the home page itself
}
```

The result excludes the Home page — it contains only descendants.

---

## Existing implementations to reuse

| Location | What it provides |
|---|---|
| `src/hooks/useAnalysis.ts` → `reachablePages()` | BFS over all linked pages; used by both sync and URL analysis passes |
| `src/components/tree/usePageGraph.ts` → `usePageGraph()` | Full directed graph (nodes + edges) with orphan detection and shortest-path helper; used by the page tree visualisation |

Prefer `reachablePages()` when you only need the page list + blocks (no graph structure).
Prefer `usePageGraph()` when you need to know parent–child relationships, detect orphans,
or compute paths.

---

## Module page types

Module pages (`BulletinBoard`, `Calendar`, `MyActivity`, `Map`) are valid link targets and
appear in BFS results. They have no editable content blocks — their `blocks` array will
always be empty or `[]`. Skip them if you only care about editable content:

```ts
const MODULE_TYPES = new Set(['BulletinBoard', 'Calendar', 'MyActivity', 'Map']);

const editableLinkedPages = getLinkedPages(...).filter(
  ({ pageId }) => {
    const page = allPages.find((p: any) => p.PageId === pageId);
    return !MODULE_TYPES.has(page?.PageType);
  }
);
```

---

## Pitfalls

- **Do not use `navContents` alone** — it only contains pages the user has visited in this
  session. Always fall back to `page.PageStructure` for unvisited pages.
- **Home page is not in the BFS result.** Its content is passed as `infoContent`/`homeContent`
  separately. If you need to iterate Home too, handle it outside the BFS loop.
- **`Current_Version.Page` can be stale** between React renders — prefer reading it via
  `dataStore.get('Current_Version')?.Page` inside async callbacks (same pattern used in
  `useAutoSave.ts`, `useNavigation.ts`). Inside render/hooks, use the `currentVersion` React
  state or the `pages` prop so the component re-renders on changes.
- **Cycles are impossible in practice** (the UI prevents linking a page back to its ancestor),
  but the BFS `visited` set guards against infinite loops regardless.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with HMR
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

No test runner is configured in this project.

## Architecture

This is a **React 19 + Vite 8** app structured as an **embeddable widget**, not a standalone SPA. The public API is a `createWidget` function exported from [src/main.tsx](src/main.tsx) that accepts rich host-provided configuration and mounts the React tree into `#root`.

### Widget entry contract

`createWidget` receives all external data as parameters (themes, suppliers, services, forms, media, language config, user roles, etc.) — there is no separate API layer or data-fetching in the app itself. The typed signatures live in [src/types.ts](src/types.ts).

- [src/main.tsx](src/main.tsx) — TypeScript entry with proper types (canonical version)
- [src/main.jsx](src/main.jsx) — older duplicate with `any` types; should be reconciled or removed

### i18n

`i18n-js` is installed as a dependency. Internationalization support is part of the widget contract (`currentLanguage`, `isMultiLanguageSupported`, `supportedLanguages` params in `createWidget`), but implementation is not yet wired up.

### Linting

ESLint is configured for `.js`/`.jsx` files with `react-hooks` and `react-refresh` plugins. TypeScript files (`.ts`/`.tsx`) are not yet covered by the ESLint config — extend `eslint.config.js` if TypeScript linting is needed.

### Services

All API calls live in `src/services/`. Each module wraps one domain. All import from `apiClient.ts` which provides `getBaseUrl()`, `apiGet()`, `apiPost()`, and `checkError()`. Never call `fetch()` directly — use these helpers so auth errors are caught uniformly.

### State hooks

`App.tsx` delegates state and handlers to five hooks:
- `useNavigation` — navStack + navContents for the linked-page frame stack
- `useContentHandlers` — all tile/block/CTA/image mutation callbacks
- `useUndoRedo` — snapshot-based undo/redo; `onRestorePages` fires the rename API on undo/redo
- `useAutoSave` — debounces saves 1.5 s after the last change; `runSave(fn)` for immediate saves (renames, URL edits)
- `useAnalysis` — two-pass debounce: sync checks (300 ms) update the badge fast; URL checks (4 s) run separately so HTTP latency doesn't block the count

## Docs

- [docs/page_structure.md](docs/page_structure.md) — data model for app versions, pages, and page content building blocks (TileGrid, Cta, Description, Image, BulletinBoard, Calendar, MyActivity, Map)
- [docs/app-versions.md](docs/app-versions.md) — app version and template lifecycle: roles, ownership rules, DB schema (`trn_appversion`), template creation flow, mood/color selection
- [docs/end-points.md](docs/end-points.md) — Toolbox API endpoint reference: all REST routes for app versions, pages, publish, theme, translation, media, trash, and services
- [docs/tilegrid.md](docs/tilegrid.md) — TileGrid data structure, layout constraints, height/resize rules, tile drag and block drag behaviour
- [docs/analysis.md](docs/analysis.md) — analysis feature: categories, URL sources, tile text limits, issue shape, how to extend

## Component & File Organisation Rules

### File size limit
Keep every source file under **400 lines**. When a file approaches this limit, extract sub-components or utilities before adding more code.

### Folder structure
```
src/
  constants.ts                    # Shared numeric/string constants (TILE_H, TILE_GAP, …)
  types.ts                        # All shared TypeScript interfaces and types
  data/
    ctaIcons.ts                   # SVG icon catalogue for CTA buttons
  hooks/
    useAutoSave.ts                # Debounced API save; runSave(fn) for immediate saves
    useUndoRedo.ts                # Snapshot-based undo/redo with onRestorePages callback
    useNavigation.ts              # navStack + navContents for linked-page frame stack
    useContentHandlers.ts         # All tile/block/CTA/image mutation callbacks
    useAnalysis.ts                # Two-pass debounced analysis: 300 ms fast (sync) + 4 s slow (URL); returns issues + isAnalyzing
  utils/
    contentTransforms.ts          # Pure content-array transform functions (apply*)
    tileUtils.ts                  # Tile rendering helpers (resolveColor, resolveIconSVG)
    linkedFrames.ts               # Assembles linked-frame array for MainCanvas from navStack
    linkChecker.ts                # Extracts image/weblink/form URLs from content blocks
    analysisUtils.ts              # gatherUrlCandidates, checkUrlCandidates, checkTileText, checkCtaText, extractUrlFingerprint
  services/                       # All API calls; each module wraps one domain
    apiClient.ts                  # Base: getBaseUrl, apiGet, apiPost, checkError, AuthError
    pagesApi.ts                   # savePage, updatePageTitle
    appVersionsApi.ts             # App version CRUD and lifecycle
    mediaApi.ts                   # getMedia, uploadMedia, deleteMedia
    translationApi.ts             # translateAppVersion, getTranslatedPage, updateTranslatedPage
    (+ publishApi, themeApi, servicesApi, trashApi follow the same pattern)
  components/
    phone/                        # Phone chrome UI (status bar, headers, menus)
      StatusBar.tsx
      PhoneHeaders.tsx
      AddBlockMenu.tsx
      CtaBlock.tsx                # CTA button renderer (Round / FullWidth / Icon / Image)
      AddCtaModal.tsx             # Modal for adding / editing a CTA block
      MediaLibraryModal.tsx       # Image picker with upload support
      TileImageModal.tsx          # Tile background image picker
      WeblinkFrame.tsx            # Iframe wrapper for web links; shows fallback when X-Frame-Options blocks
    tile/                         # Tile drag-and-drop system
      TileGrids.tsx               # Stateless tile grid renderer
      DraggableScreen.tsx         # Drag/resize state + event wiring
      TileActionMenu.tsx          # Context menu for tile actions (delete, link, resize)
    appversion/                   # App version management modals (Create, Duplicate, Rename, Trash, …)
    translation/
      TranslationSideBar.tsx      # Per-language content editor sidebar
    tree/
      usePageGraph.ts             # Directed page→page graph for nav link visualization
    widgets/
      MultiSelect.tsx             # Reusable multi-select dropdown
    MainCanvas.tsx                # Orchestrator: frame registry, scroll, thumbnails
    AnalysisPanel.tsx             # Floating portal panel: Category 1 (invalid URLs) + Category 2 (long tile text)
    NavBar.tsx
    SidebarRight.tsx
    SidebarCtaControls.tsx        # CTA sidebar controls (extracted from SidebarRight)
    BulletinBoardPage.tsx         # Module page — fixed UI, no editable content blocks
    CalendarPage.tsx
    MapPage.tsx
    MyActivityPage.tsx
```

### Rules to follow
- **One responsibility per file.** UI components live in `components/`, pure functions in `utils/`, shared types in `types.ts`, and magic numbers in `constants.ts`.
- **No inlining large sub-trees.** If a JSX subtree exceeds ~40 lines or has its own props interface, extract it to its own component file.
- **Shared constants go in `src/constants.ts`.** Never duplicate a magic number across files — define it once and import it.
- **Shared types go in `src/types.ts`.** Types used by more than one file belong there, not re-defined locally.
- **Pure transform functions go in `src/utils/`.** Functions that take data and return new data (no side-effects, no React) belong in utils, not in components.
- **No barrel index files.** Import directly from the source file (e.g. `'./tile/TileGrids'`), not from a re-exporting `index.ts`.
- **CSS stays with its owning component.** Component-specific CSS files (e.g. `MainCanvas.css`) live alongside the component that imports them.

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

`createWidget` receives all external data as parameters (themes, suppliers, services, forms, media, language config, user roles, etc.) — there is no separate API layer or data-fetching in the app itself. The typed signatures live in `src/types` (file not yet created; types are referenced in [src/main.tsx](src/main.tsx)).

- [src/main.tsx](src/main.tsx) — TypeScript entry with proper types (canonical version)
- [src/main.jsx](src/main.jsx) — older duplicate with `any` types; should be reconciled or removed

### i18n

`i18n-js` is installed as a dependency. Internationalization support is part of the widget contract (`currentLanguage`, `isMultiLanguageSupported`, `supportedLanguages` params in `createWidget`), but implementation is not yet wired up.

### Linting

ESLint is configured for `.js`/`.jsx` files with `react-hooks` and `react-refresh` plugins. TypeScript files (`.ts`/`.tsx`) are not yet covered by the ESLint config — extend `eslint.config.js` if TypeScript linting is needed.

## App Builder

- [Page Structure](app_builder/page_structure.md) — data model for app versions, pages, and page content building blocks (TileGrid, Cta, Description, Image)

## Component & File Organisation Rules

### File size limit
Keep every source file under **400 lines**. When a file approaches this limit, extract sub-components or utilities before adding more code.

### Folder structure
```
src/
  constants.ts                    # Shared numeric/string constants (TILE_H, TILE_GAP, …)
  types.ts                        # All shared TypeScript interfaces and types
  utils/
    contentTransforms.ts          # Pure content-array transform functions (apply*)
    tileUtils.ts                  # Tile rendering helpers (resolveColor, resolveIconSVG)
  components/
    phone/                        # Phone chrome UI (status bar, headers, menus)
      StatusBar.tsx
      PhoneHeaders.tsx
      AddBlockMenu.tsx
    tile/                         # Tile drag-and-drop system
      TileGrids.tsx               # Stateless tile grid renderer
      DraggableScreen.tsx         # Drag/resize state + event wiring
    MainCanvas.tsx                # Orchestrator: frame registry, scroll, thumbnails
    NavBar.tsx
    SidebarRight.tsx
```

### Rules to follow
- **One responsibility per file.** UI components live in `components/`, pure functions in `utils/`, shared types in `types.ts`, and magic numbers in `constants.ts`.
- **No inlining large sub-trees.** If a JSX subtree exceeds ~40 lines or has its own props interface, extract it to its own component file.
- **Shared constants go in `src/constants.ts`.** Never duplicate a magic number across files — define it once and import it.
- **Shared types go in `src/types.ts`.** Types used by more than one file belong there, not re-defined locally.
- **Pure transform functions go in `src/utils/`.** Functions that take data and return new data (no side-effects, no React) belong in utils, not in components.
- **No barrel index files.** Import directly from the source file (e.g. `'./tile/TileGrids'`), not from a re-exporting `index.ts`.
- **CSS stays with its owning component.** Component-specific CSS files (e.g. `MainCanvas.css`) live alongside the component that imports them.

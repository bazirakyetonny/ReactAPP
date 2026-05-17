# App Builder Widget

A **React 19 + Vite** embeddable widget for visually building and previewing mobile app layouts. It renders a live phone-frame canvas where pages, tile grids, icons, and colors can be edited in real time.

## Tech Stack

| | |
|---|---|
| UI | React 19 |
| Build | Vite 5 |
| Language | TypeScript |
| i18n | i18n-js 4 |
| Linting | ESLint 10 |

## Architecture

The widget exposes a single `createWidget(...)` function (see [src/main.tsx](src/main.tsx)) that accepts all host-provided data and mounts the React tree into `#root`. There is **no internal data fetching** — everything is passed in at mount time.

```ts
createWidget(
  themes,
  suppliers,
  services,
  forms,
  media,
  currentThemeId,
  currentVersion,      // page structure lives here
  organisationLogo,
  currentLanguage,
  hasMultiLingualSupport,
  supportedLanguages,
  userRoles,
  residentPackages,
  moods,
  templatesCollection,
  templateTransactionCollection,
)
```

### Key components

| Component | Role |
|---|---|
| `App.tsx` | Root state — nav stack, tile edits, theme resolution |
| `MainCanvas` | Phone-frame canvas, linked frames, thumbnail strip |
| `SidebarLeft` | Page tree, structure tools |
| `SidebarRight` | Tile editor — color palette, icon picker, text/align |

### Canvas navigation model

Pages are stored in `navStack: string[]`. Clicking a nav tile calls `handleTileNavigate(pageId, parentIndex)` which slices the stack at `parentIndex + 1` and appends the target page — so sibling tiles replace rather than stack, and clicking the same tile again collapses its descendants.

### Data model

Page content is described by `InfoContent` blocks of type `TileGrid`, `Cta`, `Description`, or `Image`. See [app_builder/page_structure.md](app_builder/page_structure.md) for the full schema.

## Development

```bash
npm install
npm run dev        # Dev server with HMR at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Serve production build locally
npm run lint       # ESLint (JS/JSX files)
```

No test runner is configured.

---
name: project-widget-architecture
description: Core architectural facts about the widget contract, data flow, and build config that inform every review session
metadata:
  type: project
---

The app is a React 19 + Vite 5 embeddable widget (IIFE build output). The sole public entry is `createWidget(UC: any[])` in `src/main.tsx`. All host data is expected to flow through that parameter and is stashed in the `DataStore` singleton (`src/data/datastore.ts`).

**Current state (as of first review session):**
- `createWidget` accepts a single `UC: any[]` parameter — the full typed widget contract (themes, suppliers, services, forms, media, language config, user roles) is NOT yet wired up; the parameter is typed `any[]` and immediately written to the store as `"UC"`.
- `DataStore` stores values as `Map<string, any>` — no type safety at all.
- Components (`NavBar`, `MainCanvas`, `SidebarRight`) are fully static/hardcoded — they do not read from the DataStore or receive props from `App`.
- `NavBar` defines `NavBarProps` (version, theme, onPublish) but `App.tsx` passes none of them — props are always undefined.
- `SidebarRight` has hardcoded `SERVICES` and `CONTACTS` arrays with JSX inside module-level `const` — these are stable object references but contain JSX elements, which is a React anti-pattern (JSX should be created at render time inside components, not at module init).
- The `types.ts` file imports `DateTime` from `i18n-js` for the `TrashItem.DeletedAt` field — the only i18n usage so far.
- `vite.config.js` has a typo in the output filename: `reajctJs-${format}.js` (should be `reactJs`).

**Why:** This context shapes whether a finding is "missing widget contract wiring" (expected gap — the widget contract is still being built) vs. a genuine regression.

**How to apply:** When reviewing new code, flag divergence from the contract (e.g., internal API calls, hardcoded data that belongs in params) and flag `any` in the contract surface as High severity because it defeats the typed contract goal.

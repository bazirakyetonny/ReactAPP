---
noteId: "fa2efa40542211f1aa4195a423e6fe30"
tags: []
name: "implement-feature"
description: "Implement a new feature in the ReactAPP widget project end-to-end, following the project's coding standards and architecture patterns. Use this skill whenever the user asks to add a feature, build something new, implement functionality, create a new capability, or says things like \"I want X to do Y\" or \"add support for Z\". Also trigger when the user describes a requirement or user story that needs to be turned into working code.\n"

---

# Implement Feature — ReactAPP Widget

This project is a **React 19 + Vite 8** embeddable widget. There is no router, no global store, no
backend fetching in the app — all data arrives via `createWidget()` parameters. All HTTP goes
through `src/services/apiClient.ts` helpers (`apiGet`, `apiPost`). Never call `fetch()` directly.

Work through every phase below in order. Skip a phase only if it genuinely does not apply to the
feature (e.g. no new API call → skip D/E). When in doubt, include it.

---

## Phase 1 — Understand before writing

Before touching any file:

**A. Read the data model**
Read `src/types.ts` in full. Understand the existing interfaces — `AppVersion`, `Page`,
`InfoContent`, `InfoType`, `Tile`, `CtaAttributes`, `Action`. The data model is the single source
of truth. Adding logic before understanding the model leads to duplicate or conflicting fields.

**B. Read the relevant docs**
- `docs/page_structure.md` — block types (TileGrid, Cta, Description, Image, BulletinBoard, etc.)
- `docs/end-points.md` — all REST routes; check here before inventing an API path
- `docs/tilegrid.md` — tile layout constraints, height/resize rules, drag behaviour
- `docs/analysis.md` — if the feature involves content validation or URL checking
- `docs/app-versions.md` — if the feature touches version lifecycle or publishing

**C. Identify the owning hook**
`App.tsx` delegates all state and side-effects to five hooks. Find which one owns the domain:
- `useContentHandlers` — tile/block/CTA/image mutations → most features land here
- `useNavigation` — navStack, linked-page frame navigation
- `useUndoRedo` — undo/redo snapshot logic
- `useAutoSave` — debounced saves; `runSave(fn)` for immediate saves
- `useAnalysis` — content issue scanning (invalid URLs, long text)

If no existing hook owns the domain, a new hook is needed (Phase 3).

---

## Phase 2 — Data model

**D. Extend `src/types.ts` first**
If the feature needs a new field, interface, or union member, add it to `src/types.ts` before
writing any logic. Never define feature-specific types inline in a component or hook — `types.ts`
is the contract all files share.

Magic numbers that accompany new types belong in `src/constants.ts`, not inline.

---

## Phase 3 — State / hooks

**E. Add logic to the owning hook**
Extend the appropriate hook with new state, handlers, or effects. Keep each hook focused on its
single domain — do not add navigation logic to `useContentHandlers`, etc.

**F. Create a new hook (if genuinely new domain)**
Place it at `src/hooks/useYourFeature.ts`. Follow this shape:

```ts
export function useYourFeature(params: YourParams) {
  const [state, setState] = useState<YourType>(initialValue);

  // effects / callbacks here

  return { state, doSomething };
}
```

Rules:
- One responsibility per hook
- No direct DOM manipulation — that belongs in a React component
- Wire the new hook into `App.tsx` alongside the existing five

---

## Phase 4 — Service layer

**G. Add a typed response interface**
For every new API endpoint, add the response type to `src/types.ts`:

```ts
export interface YourActionResponse {
  Message: string;
  // fields exactly as described in docs/end-points.md
}
```

Never use `any` for service responses.

**H. Add the method to the correct service module**
All HTTP calls live in `src/services/`. Use the existing module for the domain, or create a new
`src/services/yourApi.ts`. Always import from `apiClient.ts`:

```ts
import { apiGet, apiPost, checkError } from './apiClient';

export async function yourAction(payload: YourPayload): Promise<YourActionResponse> {
  const data = await apiPost<YourActionResponse>('/api/toolbox/your-endpoint', payload);
  checkError(data);
  return data;
}
```

- `apiGet` / `apiPost` handle auth errors uniformly — never call `fetch()` directly
- Use the URL patterns documented in `docs/end-points.md` — do not invent paths

---

## Phase 5 — UI

**I. Create a React component (if needed)**
Place it in `src/components/` (or the relevant subfolder: `phone/`, `tile/`, `appversion/`).
Follow these rules:
- Extract a sub-component when a JSX subtree exceeds ~40 lines or has its own props interface
- **400-line hard limit per file** — if a file approaches this, extract before adding more
- CSS lives alongside its component: `YourComponent.tsx` + `YourComponent.css` in the same folder
- Import directly from the source file; no barrel `index.ts` re-exports
- Use `src/constants.ts` for shared numbers; `src/types.ts` for shared types

**J. Module page vs editable page**
If the feature is a fixed-UI page with no editable content blocks (like Calendar, Map,
BulletinBoard), use the module page pattern:
- Create `src/components/YourPage.tsx` that renders its own fixed UI
- Register it as a `PageType` in the page routing — see `add-module-page` skill for the full
  wiring checklist

**K. JSX security**
- Never `dangerouslySetInnerHTML` with user-supplied content
- Validate/sanitise at the boundary before rendering untrusted URLs

---

## Phase 6 — Analysis (if feature adds new content with URLs or text)

**L. Extend the analysis feature**
If the feature introduces new block types that contain URLs or user-visible text:
- Add URL extraction in `src/utils/analysisUtils.ts` → `gatherUrlCandidates()`
- Add text-length checks in `analysisUtils.ts` → add a `checkYourText()` function
- Wire new checks into `src/hooks/useAnalysis.ts`
- See `docs/analysis.md` and the `implement-analysis` skill for the full extension guide

---

## Phase 7 — i18n

**M. i18n is not yet wired**
`i18n-js` is installed but translation is not implemented. Use plain string literals for now.
When i18n is wired up in a future session, all user-visible labels will need keys — use
descriptive variable names for labels so they are easy to find and extract later.

---

## Phase 8 — Verification

Work through all of these before declaring the feature done:

**N. Lint**
```bash
npm run lint
```
Note: ESLint currently only covers `.js`/`.jsx`. TypeScript files are not linted — fix any
TypeScript compiler errors (`npm run build`) separately.

**O. Test in the browser**
```bash
npm run dev
```
Type checking does not verify feature correctness. Always exercise the golden path manually:
- Does the feature work on first load?
- Does it survive a page navigation and back?
- Does undo/redo leave the state consistent?
- Does auto-save fire after the change?

**P. Check the 400-line limit**
For every file you touched, confirm it is under 400 lines. If not, extract before merging.

---

## No test runner

There is no test runner configured in this project. Do **not** invoke the `write-tests` skill —
it will find nothing to run.

---

## Quick reference — where things live

| What you're adding | Where it goes |
|---|---|
| New type / interface | `src/types.ts` |
| New magic number / constant | `src/constants.ts` |
| New hook | `src/hooks/useYourFeature.ts` |
| New API method | `src/services/yourApi.ts` (or existing domain module) |
| New component | `src/components/YourComponent.tsx` |
| New component CSS | `src/components/YourComponent.css` (alongside the component) |
| New pure util function | `src/utils/yourUtils.ts` |
| New module page | `src/components/YourPage.tsx` + `add-module-page` skill |
| New analysis check | `src/utils/analysisUtils.ts` + `src/hooks/useAnalysis.ts` |
| New SVG icon for CTA | `src/data/ctaIcons.ts` |

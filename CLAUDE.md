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

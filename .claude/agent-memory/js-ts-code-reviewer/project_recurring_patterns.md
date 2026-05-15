---
name: project-recurring-patterns
description: Recurring anti-patterns and code quality issues found in this codebase across review sessions
metadata:
  type: project
---

Patterns observed as of the first full review session (May 2026):

1. **`any` typed widget contract surface** — `createWidget(UC: any[])` and `DataStore.set/get` are all `any`. This is the highest-priority recurring type gap.

2. **JSX elements in module-level constants** — `SidebarRight.tsx` defines `SERVICES` and `CONTACTS` as `const` arrays at module scope containing JSX (`<WifiIcon />` etc.). These are created once at module load, not at render time. React reconciler can handle this, but it is an anti-pattern that makes testing and theming harder. Should be replaced with component references or factory functions.

3. **Props defined but never passed** — `NavBar` has a full `NavBarProps` interface (`version`, `theme`, `onPublish`) but `App.tsx` renders `<NavBar />` with no props, so all three are always `undefined`. This will be a latent bug once the widget contract is wired up if the consuming code does not pass them.

4. **Hardcoded UI data** — Colors (`PALETTE`), service list (`SERVICES`), contact list (`CONTACTS`), the static tab state (PAGE/TEMPLATE), and the hardcoded "100 %" zoom label in `SidebarRight` should all eventually flow from the widget contract.

5. **`console.log` left in production entry point** — `main.tsx:11` logs `UC` on every `createWidget` call. Will leak host data in production browser consoles.

6. **No error boundary** — `App.tsx` has no React error boundary wrapping the component tree.

7. **ESLint gap** — `eslint.config.js` only lints `**/*.{js,jsx}`, so all `.ts`/`.tsx` files are silently unlinked. TypeScript strict mode is on in `tsconfig.json` but ESLint hook rules are not enforced on TSX.

8. **`noUnusedLocals: false` and `noUnusedParameters: false`** in tsconfig — dead code is not caught by the compiler.

9. **CSS design tokens ignored in component files** — `NavBar.css`, `MainCanvas.css`, `SidebarRight.css` all use raw hex values (e.g. `#ffffff`, `#374151`) instead of the CSS custom properties defined in `index.css` (e.g. `var(--bg)`, `var(--text)`). Themes defined in `index.css` do not propagate to components.

10. **`Action?: {}` and `Permissions?: []` in types.ts** — `CtaAttributes.Action` is typed as `{}` (structurally equivalent to `object`, bypasses type safety) and `Tile.Permissions` is typed as `[]` (empty tuple, can never hold elements). Both are latent type bugs.

11. **`ThemeIcon.IconSVG` is a raw SVG string** — if this value is ever rendered via `dangerouslySetInnerHTML` in a consuming component it becomes a High/Critical XSS vector. Flag any downstream usage.

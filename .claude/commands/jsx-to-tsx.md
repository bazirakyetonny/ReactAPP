# Convert all JSX files to TSX

Convert every `.jsx` file in `src/` to `.tsx`. For each file:

1. **Read** the `.jsx` file.
2. **Add TypeScript types** — prop interfaces for every component, typed `useState`/`useRef`/event handlers, return types where non-obvious. Infer types from usage; don't use `any`.
3. **Write** the typed content to the same path but with the `.tsx` extension.
4. **Delete** the original `.jsx` file.
5. **Update all imports** across the codebase that referenced the old `.jsx` path (or relied on the extension being resolved) to use `.tsx` (or drop the extension if the bundler resolves it).

Special cases for this repo:
- `src/main.jsx` is a duplicate of `src/main.tsx` with `any` types. **Do not create a second `main.tsx`** — instead reconcile any differences between the two files into the existing `src/main.tsx`, then delete `src/main.jsx`.
- After conversion, ensure `src/types.ts` exists and exports all types referenced in `src/main.tsx` (UC, Theme, Supplier, ProductService, Form, Media, AppVersion, SupportedLanguages, ResidentPackage, Mood, CategoryTemplates, PageTemplate).

After all conversions:
- Run `npm run lint` and fix any TypeScript-related lint errors.
- Confirm no `.jsx` files remain under `src/`.

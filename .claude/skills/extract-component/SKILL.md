---
noteId: "6dea38a05a8611f19b94499e3375953b"
tags: []
name: "extract-component"
description: "Extract a highlighted section of JSX/TSX from a parent component into its own standalone file. Use whenever the user highlights code and says \"extract this into a component\", \"pull this out\", \"make this a separate component\", \"move this to its own file\", or names a target component and/or folder to extract into. Also use when a file is approaching its line-count limit and the user wants to split it, or when they point at a section and say \"this should live in [folder]\"."

---

# Extract React Component

Extract a selected section of JSX/TSX from a parent component into a new, self-contained component file — moving its exclusive state, hooks, helpers, and CSS with it, and wiring the parent to use the new component.

## Phase 1: Analyse before touching any file

Read the full parent component file and trace every identifier used inside the selected section. Getting this right is the most important step — a wrong dependency analysis leads to broken code.

For each identifier in the selection, determine which bucket it falls into:

| Bucket | Move? | Action |
|--------|-------|--------|
| State/hook used **only** in the selection | ✓ | Move into new component |
| Derived value / useMemo used **only** in the selection | ✓ | Move into new component |
| Helper function called **only** from the selection | ✓ | Move into new component |
| Utility component (e.g. local SVG function) used **only** in the selection | ✓ | Move above the new component |
| Value the selection **reads from the parent** (state, prop, callback) | ✗ | Becomes a prop of the new component |
| Anything used **elsewhere** in the parent too | ✗ | Stays in parent, passed as prop |

Also scan the parent's CSS file: for each class used in the selection, check whether it appears anywhere else in the parent's rendered JSX. If a class is exclusive to the extracted section, move it to the new CSS file.

Write out the plan before writing any code:
- **Moving in**: list of state, hooks, helpers, utility components, CSS classes
- **Becoming props**: list of values/callbacks the selection borrows from the parent

## Phase 2: Create the new component file

Target path: `<folder>/<ComponentName>.tsx` (user-specified or inferred from context).

```tsx
import { useState, useMemo } from "react"; // only hooks actually needed
import type { Foo } from "../../types";    // only types actually needed
import "./<ComponentName>.css";            // only if a CSS file is being created

// Moved utility components (SVG icons, etc.) go here, above the export
function HelperIcon() { ... }

interface <ComponentName>Props {
  // one prop per external value the selection borrows from the parent
  onEditTile?: (id: string, patch: Record<string, any>) => void;
  selectedTile?: any;
}

export function <ComponentName>({ ... }: <ComponentName>Props) {
  // moved useState calls
  // moved useMemo / derived values
  // moved helper functions

  return (
    // the extracted JSX, unchanged
    // use <> fragment wrapper if the selection had multiple root elements
  );
}
```

Only import hooks, types, and utilities that are actually used in this file.

## Phase 3: Create a CSS file (if needed)

Only create `<ComponentName>.css` if there are CSS rules to move. Copy the relevant rule blocks verbatim from the parent CSS into the new file.

## Phase 4: Update the parent component — four targeted edits

Make all four edits to the parent; none should be skipped:

1. **Add import** — place near other component imports:
   ```tsx
   import { <ComponentName> } from "./<folder>/<ComponentName>";
   ```

2. **Remove moved declarations** — delete the state variables, derived values, helper functions, and utility component definitions that moved.

3. **Clean up unused hook imports** — if `useMemo`, `useCallback`, etc. are no longer used in the parent, remove them from the React import line.

4. **Replace the JSX block** with the new component, passing only the props identified in Phase 1:
   ```tsx
   <ComponentName
     selectedTile={selectedTile}
     onEditTile={onEditTile}
   />
   ```

## Phase 5: Update the parent CSS

Remove every CSS rule block whose selector matches a class moved to the new CSS file. Do not remove rules for classes that remain in the parent's JSX.

## Validation checklist

After all edits, verify:
- [ ] Parent file has no references to removed variables (no TypeScript errors)
- [ ] New component file has no unresolved imports
- [ ] New component's props interface covers every external value it uses
- [ ] React hook imports in the parent are accurate (no unused imports)
- [ ] Parent file is meaningfully shorter than before

## Common pitfalls

- **Don't move shared state.** If a state variable is used both inside and outside the extracted section, it stays in the parent and gets passed as a prop.
- **Don't move shared helpers.** Same rule — if a function is called from multiple places in the parent, keep it there.
- **Don't over-prop.** If a value is only ever used inside the extracted section and derives from nothing the parent owns, it should be internal state — not a prop.
- **Match the project's CSS co-location convention.** In this project, each component in `src/components/sidebar_right/` owns a `.css` file with the same name (e.g. `ColorPalette.tsx` → `ColorPalette.css`).

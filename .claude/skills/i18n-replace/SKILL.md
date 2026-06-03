---
noteId: "9e7e85805e8111f18ebbebf5438c97bf"
tags: []
name: "i18n-replace"
description: "Wire up i18n-js and replace hard-coded UI strings in React components with translation keys from the project's English/Dutch dictionary. Use this skill whenever the user says \"add translations\", \"replace hard-coded strings\", \"wire up i18n\", \"internationalise [component]\", \"add Dutch translations\", \"make the UI translatable\", or asks to connect the language setting from createWidget to displayed text.\n"

---

# Replace Hard-Coded Strings with i18n Keys

The project already has a complete translation dictionary at
[src/i18n/i18n.ts](../../../src/i18n/i18n.ts) with English (`en`) and Dutch (`nl`) keys for
most standard UI strings — but components still render hard-coded string literals and the locale
is not yet wired. This skill replaces those literals with `i18n.t('key.path')` calls and connects
`Current_Language` from the host to the i18n module.

---

## Phase 0 — Read the translation file first

Read [src/i18n/i18n.ts](../../../src/i18n/i18n.ts) **in full** before touching any component.
It is 922 lines — read all of it.

There are two exports:
- `i18nModule` — a small flat dictionary used **only** by `BulletinBoardPage.tsx`. Do not add
  keys here; it exists for a legacy reason.
- `i18n` — the main hierarchical dictionary. **All new component strings go here.**

Top-level namespaces inside `i18n`:
`tree`, `navbar`, `publish`, `sidebar`, `cta_modal_forms`, `tile`, `section`, `messages`,
`translation`, `template`, `analysis`, `appversion`, `media`

Before adding any new key, search the file for the English string — it may already exist.

---

## Phase 1 — Wire the locale (one-time setup)

Check [src/App.tsx](../../../src/App.tsx) for an existing `i18n.locale` assignment. If it is
already there, skip this phase.

If not, add the locale assignment at the **top of the App component body**, after the `dataStore`
reads and before the first `return`. This ensures locale is set before any child renders.

```tsx
// At the top of the file with other imports:
import { i18n } from "./i18n/i18n";

// Inside the App component, after dataStore reads:
i18n.locale = (dataStore.get("Current_Language") as string) || "en";
```

`Current_Language` from the host is `"en"` or `"nl"` — these match the top-level keys in
`i18n.ts`. Do **not** put this in `useEffect`; setting locale reactively causes flash-of-wrong-
language on first render.

---

## Phase 2 — Identify hard-coded string candidates

If the user named a specific component, target only that file. For a broader scan of all
components, use Grep to find JSX string literals that look like UI labels:

```
pattern: >[A-Z][a-zA-Z ]{2,}<   (JSX text nodes)
pattern: title="[A-Z]            (title attributes)
pattern: placeholder="[A-Z]      (placeholder attributes)
pattern: aria-label="[A-Z]       (aria labels)
```

**Include as candidates:**
- Button text (`Save`, `Cancel`, `Delete`, `Rename`, `Confirm`)
- Modal titles and section headings
- `placeholder`, `title`, `aria-label` attribute values
- Inline error and confirmation messages

**Exclude — do not replace these:**
- CSS class name strings
- URL paths and API route strings
- Data field values (not visible as UI text)
- Strings passed to third-party library config
- `data-testid` or `id` attributes

Build a list of `(file, line, string, proposed_key_path)` before making any edits.

---

## Phase 3 — Map strings to existing keys

For each candidate string, search `src/i18n/i18n.ts` for a matching English value before
creating a new key. If a match exists, use that key path. Prefer reuse over new keys.

When multiple matches exist (e.g. `"cancel"` appears under several namespaces), pick the path
whose namespace best fits the component's domain:

| Component area | Preferred namespace |
|---|---|
| NavBar buttons | `navbar.*` |
| Publish/unpublish flow | `navbar.publish.*` |
| Modal buttons shared across modals | `navbar.publish.modal_cancel` / `cta_modal_forms.save` |
| Translation sidebar | `translation.*` |
| Analysis panel | `analysis.*` |
| App version modals | `appversion.*` |
| Tile/grid controls | `tile.*` |
| Sidebar controls | `sidebar.*` |
| Media library | `media.*` |
| Delete page confirmation | `messages.delete_page_warning_message` |

**Common quick-reference mappings:**

| String | Key path |
|---|---|
| `"Cancel"` | `navbar.publish.modal_cancel` |
| `"Save"` | `cta_modal_forms.save` |
| `"Publish"` | `navbar.publish.label` |
| `"Unpublish"` | `navbar.publish.un_publish` |
| `"Translation"` | `navbar.translation.label` |
| `"History"` | `navbar.history.label` |
| `"Overview"` | `navbar.tree` |
| `"Undo"` | `navbar.undo.label` |
| `"Redo"` | `navbar.redo.label` |
| `"Delete"` (page) | `navbar.delete.label` |
| `"Share"` | `navbar.share.label` |

---

## Phase 4 — Add missing keys to i18n.ts

For strings with no existing match, add them to **both** the `en` and `nl` blocks inside the
`i18n` export (not `i18nModule`).

**Naming rules:**
- Use `snake_case` for key names
- Group under the component's domain namespace
- For modal-specific strings: `{domain}.{modal_identifier}.{element}`
  — e.g. `appversion.rename.title`, `appversion.rename.placeholder`

**Dutch quick-reference for common words:**

| English | Dutch |
|---|---|
| Cancel | Annuleer |
| Save | Opslaan |
| Delete | Verwijderen |
| Close | Sluiten |
| Confirm | Bevestigen |
| Back | Terug |
| Next | Volgende |
| Edit | Bewerken |
| Add | Toevoegen |
| Rename | Hernoemen |
| Duplicate | Dupliceren |
| Publish | Publiceren |
| Unpublish | Depubliceren |
| History | Geschiedenis |
| Translation | Vertaling |
| Loading | Laden |
| Error | Fout |

For phrases where you are uncertain of the Dutch, add a `// TODO: nl` comment on that line so it
can be reviewed by a native speaker.

---

## Phase 5 — Replace strings in components

Add the import at the top of each affected file:
```tsx
import { i18n } from "../../i18n/i18n"; // adjust depth: phone/ → ../../, appversion/ → ../../
```

**Replacement patterns:**

| Before | After |
|---|---|
| `>Cancel</button>` | `>{i18n.t('navbar.publish.modal_cancel')}</button>` |
| `title="Save"` | `title={i18n.t('cta_modal_forms.save')}` |
| `placeholder="Enter name"` | `placeholder={i18n.t('appversion.rename.placeholder')}` |
| `"Are you sure?"` (in JS) | `i18n.t('appversion.confirm_message')` |
| `` `Delete ${name}?` `` | `i18n.t('appversion.delete.confirm', { name })` |

For **interpolated strings**, use i18n-js `%{variable}` syntax in the key value:
```ts
// In i18n.ts:
en: { appversion: { delete: { confirm: "Delete %{name}?" } } }
nl: { appversion: { delete: { confirm: "%{name} verwijderen?" } } }

// In component:
i18n.t('appversion.delete.confirm', { name: versionName })
```

Work **one component at a time**. After replacing strings, check the file line count — stop and
extract a sub-component if the file is approaching 400 lines.

---

## Phase 6 — Verify

1. Run `npm run lint` and fix any import path errors.
2. Start the dev server (`npm run dev`) and visually confirm all replaced strings render correctly
   in English.
3. In `App.tsx`, temporarily hard-code `i18n.locale = "nl"`, reload the browser, and confirm
   Dutch text appears for the replaced strings.
4. Revert the hard-coded locale so the dynamic `dataStore.get("Current_Language")` binding is
   restored.

---
name: revise-claude-md
description: Update CLAUDE.md with new features and session learnings. Use this skill whenever the user says "update CLAUDE.md", "document what I built", "revise CLAUDE.md", "document this feature", "update the docs", "capture this in CLAUDE.md", or after completing a significant feature. Also use it at the end of a session when new components, hooks, services, or utilities were added to the codebase.
allowed-tools: Read, Edit, Glob, Bash
---

Update `CLAUDE.md` with both new feature documentation and session learnings. The goal is to keep CLAUDE.md accurate and useful for future Claude sessions — so new files, patterns, and architectural decisions don't get lost.

## Step 1: Discover what changed

Run these to see what was added or modified in this session/branch:

```bash
git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD~5...HEAD 2>/dev/null
git status --short
```

Categorise each changed/new file:
- **New components** — `src/components/**/*.tsx` (not previously in CLAUDE.md's folder structure)
- **New hooks** — `src/hooks/*.ts`
- **New utilities** — `src/utils/*.ts`
- **New services** — `src/services/*.ts`
- **New docs** — `docs/*.md`
- **New skills** — `.claude/skills/*/`
- **Architectural shifts** — changes to `src/types.ts`, `src/constants.ts`, `src/main.tsx`

## Step 2: Read the current CLAUDE.md

Read `CLAUDE.md` in full. Identify what's already documented vs. what's missing. Pay attention to:
- The folder structure diagram — does it reflect new files?
- The Architecture section — are new patterns (hooks, services, state management) described?
- The Docs section — are new doc files linked?

## Step 3: Check new files for their purpose

For each new file not yet in CLAUDE.md, read it briefly (first 30-50 lines) to understand its responsibility. Don't over-read — the file name and exports usually tell you enough.

## Step 4: Draft updates

Prepare concise additions. Rules for good CLAUDE.md content:
- **One line per file** in the folder structure — `filename.ts — brief purpose`
- **One sentence per pattern** in Architecture — what it does and why it exists
- Keep the total file short — CLAUDE.md is part of every prompt, so every line costs tokens
- Don't document things obvious from the file name or standard React/TS conventions
- Do document non-obvious patterns, gotchas, or architectural decisions

### What to update

**Folder structure** — add any new files that are part of the permanent codebase:
```
src/
  hooks/
    useAutoSave.ts     — debounced auto-save to API (1.5 s after last change)
    useUndoRedo.ts     — snapshot-based undo/redo with page restore callback
```

**Architecture section** — add a subsection if a significant new pattern was introduced (new hook system, new service layer, new state pattern).

**Docs section** — add links to any new `docs/*.md` files added this session.

**Session learnings** — also capture process/workflow learnings per the original revise-claude-md format:
- Bash commands discovered
- Code patterns followed in this project
- Gotchas or non-obvious constraints

## Step 5: Show proposed changes

For each proposed addition, show it as a diff:

```
### Update: CLAUDE.md — folder structure

**Why:** useAutoSave and useUndoRedo hooks added this session; not yet documented

+ hooks/
+   useAutoSave.ts     — debounced auto-save to API (1.5 s after last change)
+   useUndoRedo.ts     — snapshot-based undo/redo with page restore callback
```

Show all changes together before asking for approval.

## Step 6: Apply with approval

Ask: "Want me to apply these changes?" Edit only the sections the user approves.

Keep each addition minimal — resist the urge to rewrite sections that already work. Add, don't replace.

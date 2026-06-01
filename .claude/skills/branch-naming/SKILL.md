# Skill: Branch Naming

## Format

```
<ticket-key-lowercase>/<kebab-case-summary>
```

Examples without a ticket key (most common in this project):
- "Add CTA text length check to analysis" → `analysis-cta-text-check`
- "Fix tile resize not saving on undo" → `fix-tile-resize-undo`
- "Media library modal pagination" → `media-library-pagination`
- "Publish flow — version status badge" → `publish-version-status-badge`

Examples with a Jira ticket key:
- `TOOL-42` + "Inline URL status in analysis panel" → `tool-42/inline-url-status-analysis`
- `TOOL-31` + "App version duplicate modal" → `tool-31/appversion-duplicate-modal`

Keep the suffix concise — drop filler words, aim for 4–6 words.

## Base branch

Always branch from `main`.

## Check for existing branch

```bash
git fetch origin
git branch -a | grep <branch-name>
```

- If the branch exists locally or remotely: warn the user and ask — "Branch `<branch-name>` already exists — check it out and continue, or abort?"
- If it does not exist: create it:

```bash
git checkout main
git pull origin main
git checkout -b <branch-name>
```

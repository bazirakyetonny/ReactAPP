---
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git checkout*), Bash(git pull*), Bash(git checkout -b*), Bash(git fetch*), Bash(git branch*), Bash(git add*), Bash(git commit*), Bash(git status*), Bash(git log*), Bash(git diff*), Bash(npm run test*), Bash(npm run build*), Bash(npm run lint*), Bash(npx jest*), Bash(npx vitest*)
description: Branch, implement, lint, test, and commit changes for an approved Jira ticket plan — stops before pushing
---

# /jira-implement

Implement the approved plan for Jira ticket **$ARGUMENTS**. Run only after `/jira-plan` has been confirmed by the user.

## Step 1 — Load guidance

Read these files before starting:

- `.claude/skills/branch-naming/SKILL.md`
- `.claude/skills/git-commit/SKILL.md`
- If touching **server** code: `apps/server/.claude/skills/implement-feature/SKILL.md`
- If touching **client** code: `apps/client/.claude/skills/implement-feature/SKILL.md`
- If touching both: read both

## Step 2 — Branch

Follow `.claude/skills/branch-naming/SKILL.md` to create or check out the correct branch.

## Step 3 — Implement

Apply all changes from the approved plan, following the implement-feature skill(s) loaded in Step 1.

- No comments unless the WHY is non-obvious
- No features beyond what the ticket requires

## Step 4 — Write tests

For every new file you created, read the appropriate write-tests skill and write real tests (not just boilerplate):

- Server new files: read `apps/server/.claude/skills/write-tests/SKILL.md`
- Client new files: read `apps/client/.claude/skills/write-tests/SKILL.md`

## Step 5 — Lint

Run and fix all failures before continuing.

- Server changes: `npm run lint -w apps/server`
- Client changes: `npm run lint -w apps/client`

## Step 6 — Test

Run the full suite and fix all failures. Do not skip or comment out failing tests.

- Server: `npm run test -w apps/server`
- Client: `npm run test:run -w apps/client`
- Single file (server): `npx jest src/<path>.spec.ts` from `apps/server/`
- Single file (client): `npx vitest run src/<path>.test.tsx` from `apps/client/`


## Step 7 — Manual review

**Stop here. Do not push or open a PR yet.**

Ask the user to:

1. Run the app and manually test the feature against the acceptance criteria
2. Review the diff (`git diff chat-refactor..HEAD`) for anything unexpected


## Step 8 — Commit

Follow `.claude/skills/git-commit/SKILL.md`. Stage only the files changed by name.

Once satisfied, ask: "Does everything look good? When you're ready to push, run `/open-pr` to create the pull request."

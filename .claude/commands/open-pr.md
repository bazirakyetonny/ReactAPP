---
allowed-tools: Read, Bash(git push*), Bash(git status*), Bash(git log*), Bash(git diff*), Bash(gh*)
description: Push the current branch and open a pull request with summary, test plan, and reviewer assignment
---

# /open-pr

Push the current branch and create a pull request. Run only after `/jira-implement` has been manually reviewed and approved by the user.

## Step 1 — Load guidance

Read `.claude/skills/pull-request/SKILL.md` before proceeding.

## Step 2 — Push

```bash
git push origin <current-branch-name>
```

## Step 3 — Create PR

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"

gh pr create \
  --repo Comforta-nl/comforta-chat-server \
  --base chat-refactor \
  --title "<TICKET-KEY>: <ticket summary>" \
  --body "<body>"
```

Follow `.claude/skills/pull-request.md` for the body format (Summary, Test plan, Migration notes).

## Step 4 — Assign reviewers

Follow `.claude/skills/pull-request.md` to fetch collaborators, ask who to assign, and add them to the PR.

Once reviewers are assigned, ask: "PR is open and reviewers assigned. Would you like to move the ticket to In Progress in Jira? Run `/jira-review <TICKET-KEY>` to update the status."

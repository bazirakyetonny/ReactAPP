---
allowed-tools: mcp__jira__jira_get_transitions, mcp__jira__jira_transition_issue, Bash(git checkout*), Read
description: Transition a Jira ticket to In Progress and return to the base branch
---

# /jira-review

Move Jira ticket **$ARGUMENTS** to In Progress status. Run only after the PR has been opened and approved.

## Step 1 — Load guidance

Read `.claude/skills/jira-transition/SKILL.md` before proceeding.

## Step 2 — Fetch transitions

Use `mcp__jira__jira_get_transitions` with key `$ARGUMENTS` to get available transitions.

## Step 3 — Transition

Find the transition whose name contains "In Progress" (case-insensitive).

- If multiple matches exist, ask the user which to use
- Use `mcp__jira__jira_transition_issue` with the selected transition ID
- Confirm the new status to the user; report any failures clearly

## Step 4 — Return to base

```bash
git checkout chat-refactor
```

## Step 5 — Report

One-line summary: branch name, PR URL, new Jira status.

Then say: "Workflow complete for $ARGUMENTS. The branch is ready for review and the ticket is In Progress."

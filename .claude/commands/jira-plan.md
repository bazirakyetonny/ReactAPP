---
allowed-tools: mcp__jira__jira_get_issue, Read, Glob, Grep, Agent
description: Fetch a Jira ticket, explore the codebase, and produce an implementation plan — stops before writing any code
---

# /jira-plan

Analyze Jira ticket **$ARGUMENTS** and produce an implementation plan. Do not write any code.

## Step 1 — Load guidance

Read `.claude/skills/ticket-analysis/SKILL.md` before proceeding.

## Step 2 — Fetch ticket

Use `mcp__jira__jira_get_issue` with key `$ARGUMENTS`. Extract:

- Summary (becomes the branch name suffix)
- Description and acceptance criteria (drives implementation)
- Assignee — report who it is assigned to. If unassigned or assigned to someone other than the person who ran this command, warn the user and ask whether to continue.

If the ticket key is invalid or the tool returns an error, stop and report it.

## Step 3 — Explore

Spawn up to 2 parallel Explore agents to find all files relevant to this ticket. Provide each agent with the ticket summary and description as search context. Report back:

- Which files need to change and why
- Which files are relevant for understanding (context only)
- Any patterns or utilities that already exist and should be reused

## Step 4 — Plan

Present a concise implementation plan as a bullet list:

- Each file to be changed (path + what changes and why)
- Any new files to create
- Any risks, open questions, or migration steps (e.g. SQL to run before deploying)

**Stop here. Ask the user two things:**

1. "Does this plan look right? Any adjustments before I start?"
2. Once they confirm the plan: "Ready to start implementing? Run `/jira-implement $ARGUMENTS` to continue."

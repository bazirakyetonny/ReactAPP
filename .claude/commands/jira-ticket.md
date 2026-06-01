---
allowed-tools: mcp__jira__jira_search, Read
description: Show assigned Jira tickets and ask which one to work on, then guide to the next command
---

# /jira-ticket

Read `.claude/skills/ticket-analysis/SKILL.md` and follow the **Fetch user tickets** section to show the current user's open tickets and ask which one to work on.

Once the user selects a ticket, confirm the key and say:

> "Run `/jira-plan <KEY>` to start — I'll fetch the ticket, explore the codebase, and produce an implementation plan for your approval."

## Workflow reference

```bash
/jira-plan SCRUM-XX       # fetch ticket, explore codebase, produce plan — stops for your approval
/jira-implement SCRUM-XX  # branch, implement, lint, test, commit — stops for manual review
/open-pr                  # push branch, create PR, assign reviewers
/jira-review SCRUM-XX     # transition Jira ticket to In Progress, return to chat-refactor
```

## Skills used

| Command | Skills loaded |
| --- | --- |
| `/jira-plan` | `.claude/skills/ticket-analysis/SKILL.md` |
| `/jira-implement` | `.claude/skills/branch-naming/SKILL.md`, `.claude/skills/git-commit/SKILL.md` |
| `/open-pr` | `.claude/skills/pull-request/SKILL.md` |
| `/jira-review` | `.claude/skills/jira-transition/SKILL.md` |

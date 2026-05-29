# Skill: Jira Transition

## Rules

1. Always call `mcp__jira__jira_get_transitions` first — never hardcode transition IDs. IDs differ between projects and workflows.
2. Match transition names **case-insensitively**.
3. Verify the ticket's current status before transitioning.
4. If multiple transitions match the target name, ask the user which one to use.
5. After transitioning, confirm the new status to the user. Report any failures clearly.

## Preferred transition names

- In Progress
- Testing
- QA
- Done
- Blocked

## Guardrails

- Only move a ticket to **Testing** after:
  - A PR exists
  - Lint and tests have passed
  - Manual review is complete
- Never move a ticket directly to **Done** unless the PR is merged AND the user explicitly confirms that deployment or release is complete.

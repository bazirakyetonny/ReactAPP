# Skill: Ticket Analysis

## Fetch user tickets

When no ticket key is provided, use `mcp__jira__jira_search` with the following JQL to list the current user's open tickets:

```
assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC
```

Present the results as a numbered list:

```
1. SCRUM-47 — Add typing indicator timeout
2. SCRUM-51 — Fix unread count not resetting on topic join
3. SCRUM-53 — Persist online user presence across reconnects
```

Then ask: "Which ticket would you like to work on? Reply with the number or the key."

Once the user selects a ticket, confirm the selection and say:
"Got it. Run `/jira-plan <KEY>` to start the implementation workflow."

**Error handling:** If `mcp__jira__jira_search` returns an error or no results, report the error message clearly and ask the user to provide a ticket key directly instead.

---

## Extract from Jira

Pull the following from the ticket:

- **Summary** — becomes the branch name suffix
- **Description** — drives implementation scope
- **Acceptance criteria** — defines done
- **Affected systems** — server, client, DB, external services

## Identify scope

Categorize what the ticket touches:

- Backend changes (NestJS services, gateways, controllers, TypeORM entities)
- Frontend changes (React components, hooks, pages)
- DB migrations (new tables, columns, indexes — SQL in `migrations/`)
- API impacts (new Socket.IO events, REST endpoints, changed payloads)
- Test impacts (new or updated `*.spec.ts` / `*.test.ts` files)

## Search for existing patterns

Before planning new code, search for:

- Existing services or utilities that solve the same problem
- Established patterns for the relevant layer (e.g., how other gateways handle auth, how hooks manage socket subscriptions)
- Related implementations to model after

Spawn up to 2 parallel Explore agents with the ticket summary and description as search context.

## Produce an implementation plan

Output a concise bullet list:

- Each file to change: path + what changes and why
- Any new files to create
- Any risks, open questions, or migration steps (e.g. SQL to run before deploying)

Do not write any code during this step.

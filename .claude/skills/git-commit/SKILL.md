# Skill: Git Commit

## Format

```
<type>(<ticket-key-lowercase>): <imperative summary of what changed and why>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `test`, `chore`, `refactor`

## Rules

- Stage files by name only — never `git add -A` or `git add .`
- Keep the summary under 72 characters
- Write in imperative tense ("add", "fix", "remove" — not "added", "fixed")
- Explain WHY, not just what changed, when the reason is non-obvious

## MCP config

If `.mcp.json` was modified as part of this work, also stage and commit `.mcp.json.sample` so teammates can replicate the MCP server configuration.

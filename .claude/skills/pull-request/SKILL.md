# Skill: Pull Request

## Target

- Repo: `bazirakyetonny/ReactAPP`
- Base branch: `main`

## Token

GitHub token lives in `.mcp.json` → `mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN`.
Read it with:
```bash
python -c "import json; print(json.load(open('.mcp.json'))['mcpServers']['github']['env']['GITHUB_PERSONAL_ACCESS_TOKEN'])"
```

## Step 1 — Push the branch

Before creating the PR, ensure the branch is pushed:
```bash
git push -u origin HEAD
```

## Step 2 — Create the PR via MCP

Use the `mcp__github__create_pull_request` tool:

```
owner: bazirakyetonny
repo:  ReactAPP
title: <concise title, ≤ 70 chars>
body:  (see template below)
head:  <current-branch-name>
base:  main
```

### PR body template

```markdown
## Summary
- <bullet points of what changed>

## Test plan
- [ ] <scenario tested>
- [ ] <scenario tested>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Step 3 — Assign reviewers

1. Fetch collaborators via the GitHub API:
   ```bash
   TOKEN=$(python -c "import json; print(json.load(open('.mcp.json'))['mcpServers']['github']['env']['GITHUB_PERSONAL_ACCESS_TOKEN'])")
   curl -s -H "Authorization: token $TOKEN" \
     "https://api.github.com/repos/bazirakyetonny/ReactAPP/collaborators?affiliation=direct" \
     | python -c "import sys,json; [print(u['login']) for u in json.load(sys.stdin)]"
   ```
2. Exclude the current git user (`git config user.name`); present the rest
3. Ask: "Who should review this PR?"
4. Assign via the GitHub API:
   ```bash
   curl -s -X POST \
     -H "Authorization: token $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"reviewers\": [\"<reviewer>\"]}" \
     "https://api.github.com/repos/bazirakyetonny/ReactAPP/pulls/<PR-NUMBER>/requested_reviewers"
   ```

## Rules

- Keep the PR focused on the feature — no unrelated refactors
- No migration notes section (no database or env vars in this widget project)
- Always confirm the branch is pushed before calling `mcp__github__create_pull_request`

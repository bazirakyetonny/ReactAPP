# Skill: Pull Request

## Target

- Repo: `bazirakyetonny/ReactAPP`
- Base branch: `main`

## gh CLI path

Ensure `gh` is on PATH before any `gh` commands:

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
```

## PR body

```markdown
## Summary
- <bullet points of what changed>

## Test plan
- [ ] <scenario tested>
- [ ] <scenario tested>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Reviewers

After the PR is created:

1. Fetch direct collaborators:
   ```bash
   gh api "repos/bazirakyetonny/ReactAPP/collaborators?affiliation=direct" --jq '.[].login'
   ```
2. Exclude the current user; present the rest to the user
3. Ask: "Who should review this PR?"
4. Assign selected reviewers:
   ```bash
   gh pr edit <PR-URL> --add-reviewer <reviewer1,reviewer2>
   ```

## Rules

- Keep the PR focused on the feature — no unrelated refactors
- No migration notes section (no database or env vars in this widget project)

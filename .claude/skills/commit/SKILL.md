---
name: commit
description: Stage files and create a git commit with a well-crafted message. Use this skill whenever the user asks to "commit", "commit my changes", "make a commit", "commit and push", "write a commit message", or any similar phrasing about creating a git commit.
version: 1.0.0
---

# Git Commit Skill

Stage changes and create a descriptive git commit message based on the actual diff.

## Steps

1. **Check current state** — run `git status` and `git diff HEAD` to see what changed. Also run `git log --oneline -5` to match the project's existing commit message style.

2. **Analyze the diff** — identify:
   - What type of change: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, or `test`
   - Which files/components were affected
   - The *why* behind the change if evident from context

3. **Stage the files** — use `git add <specific files>` for only the relevant files. Avoid `git add .` or `git add -A` unless the user explicitly asks to stage everything. Never stage `.env`, credentials, or binary build artifacts.

4. **Write the commit message** — follow these rules:
   - Subject line: `<type>: <short imperative summary>` (max 72 chars, no period)
   - If more context is needed, add a blank line then a short body explaining *why*, not *what*
   - End with: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

5. **Create the commit** — use a heredoc to pass the message:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: add responsive sidebar layout

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

6. **Confirm success** — run `git status` after the commit and report the result to the user.

## Rules

- Never use `--no-verify` or skip hooks unless the user explicitly asks.
- Never amend an existing commit — always create a new one.
- If the user asks to "commit and push", commit first, then ask for confirmation before pushing.
- If there are no staged or unstaged changes, tell the user there is nothing to commit.
- If a pre-commit hook fails, fix the underlying issue before retrying — do not bypass the hook.

# TeamAI README Update

You are a technical writer reviewing recent changes and suggesting updates to the README and relevant documentation.

## Target

Scope: $ARGUMENTS

If no target specified, analyze changes since the last tagged release or the last 20 commits.

## Process

### Step 1: Gather Changes

1. Run `git log --oneline -20` (or since last tag) to see recent commits
2. Run `git diff [last-tag-or-20-commits-ago]...HEAD --stat` to see changed files
3. Identify changes that affect public-facing behavior:
   - New features or commands
   - Changed APIs or interfaces
   - New dependencies or requirements
   - Changed environment variables or config
   - New setup steps or prerequisites
   - Deprecated or removed features

### Step 2: Audit Current Docs

1. Read the current `README.md`
2. Find other relevant docs: `docs/`, `CONTRIBUTING.md`, `CHANGELOG.md`, API docs
3. For each change identified in Step 1, check if the docs already cover it

### Step 3: Generate Suggestions

For each gap found, produce a specific, copy-paste-ready suggestion:

```
## README Update Suggestions

### 1. [Section: Installation]
**Why:** New dependency X was added in commit abc123
**Current text:** (quote the current section)
**Suggested update:**
(provide the exact replacement text)

### 2. [Section: New — Feature Y]
**Why:** Feature Y was added but not documented
**Suggested addition after [section name]:**
(provide the exact text to add)

### 3. [Section: Environment Variables]
**Why:** New env var Z_API_KEY is required
**Suggested update:**
(provide the exact replacement text)
```

### Step 4: Present to User

- Show all suggestions grouped by file (README.md, docs/*, etc.)
- For each suggestion, explain why it's needed (link to the commit or change)
- Ask the user which suggestions to apply
- Only apply changes the user approves

Do not make changes without user approval. Present suggestions and wait.

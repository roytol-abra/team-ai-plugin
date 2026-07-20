# Installing TeamAI

TeamAI is a Claude Code plugin for dev teams — it drops a curated set of
commands, agents, rules, and skills into your project's `.claude/` config, plus
a `CLAUDE.md` template, a style guide, a pre-commit hook, and CodeRabbit +
OpenSpec wiring.

This guide covers installing it **properly** into a project.

---

## Prerequisites

| Requirement | Why | Check |
|-------------|-----|-------|
| **Node.js ≥ 20** | Runs the `teamai` CLI and installer | `node -v` |
| **npm** | Installs the package + OpenSpec | `npm -v` |
| **git** | Installs the pre-commit hook; repo detection | `git --version` |
| **Claude Code** | The plugin's commands/agents/skills run inside it | — |

Optional (enable more of the plugin, but not required to install):

- **CodeRabbit CLI** — for the `pr-deep-review` skill's automated pass. Install from <https://www.coderabbit.ai/cli>, then `coderabbit auth login`.
- **CodeRabbit GitHub/GitLab app** — for PR review (needs an org admin): <https://coderabbit.ai>.

> **Node too old?** The installer hard-stops below Node 20. Upgrade from
> <https://nodejs.org> (or via `nvm install 20 && nvm use 20`).

---

## Quick start (recommended)

From the root of the project you want to add TeamAI to:

```bash
npx teamai-plugin init
```

That's it — no global install needed. `init` scans your project, detects your
stack, installs only what fits, and generates a stack-aware `CLAUDE.md`.

Then verify:

```bash
npx teamai-plugin doctor
```

---

## Install methods

### 1. `npx` — no install (recommended)

Always runs the latest published version:

```bash
npx teamai-plugin init          # smart install into the current directory
npx teamai-plugin init ./my-app # into a specific path
```

### 2. Global install — for repeated use across projects

```bash
npm install -g teamai-plugin
teamai init
```

After this, `teamai` is available everywhere (`teamai init`, `teamai doctor`, etc.).

### 3. Interactive — choose what to install

Prompts for each optional component (agents, skills, style guide, CodeRabbit
config, git hook, OpenSpec). Core config is always installed.

```bash
npx teamai-plugin init --interactive   # or -i
```

> Interactive mode requires a real terminal (TTY). In a non-interactive shell
> (CI, piped input) it safely falls back to installing everything.

### 4. `curl | bash` — from GitHub, no npm

```bash
curl -fsSL https://raw.githubusercontent.com/roytoledo-star/team-ai-plugin/main/install.sh | bash
# into a specific project:
curl -fsSL https://raw.githubusercontent.com/roytoledo-star/team-ai-plugin/main/install.sh | bash -s /path/to/project
# private repo — authenticate first: gh auth login
# or override the source:
TEAM_AI_REPO=https://github.com/<org>/team-ai-plugin.git bash install.sh
```

---

## `init` vs `install` vs `update`

| Command | What it does | Use when |
|---------|--------------|----------|
| `teamai init` | Scans the project, detects language/framework/linter, generates a customized `CLAUDE.md` + `settings.json`, installs everything that fits. **Never overwrites your existing files.** | New setup (recommended) |
| `teamai install` | Copies all files as-is, no scanning. | You want the raw template |
| `teamai update` | Re-runs the installer over an existing setup, **adding anything missing** while preserving your files. | After upgrading the package |
| `teamai doctor` | Reports installation health + integration status. | Verifying / troubleshooting |
| `teamai doctor --fix` | Repairs any **missing** plugin files (won't touch files you've edited). | Something got deleted |

---

## What gets installed

```
.claude/
  commands/     — TeamAI:CodeReview, TeamAI:PRReady, readme-update, openspec-setup
  agents/       — backend, frontend, planning, security, pr-review, standards-enforcer
  rules/        — code-quality, security, agent-orchestration (auto-loaded)
  skills/       — pr-deep-review, keys-scan, check-standards (auto-trigger)
  settings.json — MCP servers, permissions, hooks
CLAUDE.md       — project config (edit the project-overview sections)
standards/
  style-guide.md
.coderabbit.yaml
.git/hooks/pre-commit  — secrets scan, lint, format, build (existing hook is preserved)
```

Nothing you already have is overwritten: existing files are detected and
preserved. If you already have a `pre-commit` hook, TeamAI's is saved next to it
as `pre-commit.teamai` for you to merge.

OpenSpec is installed globally (pinned version) and initialized in the project,
registering its `/opsx:*` commands.

---

## After installation

1. **Edit `CLAUDE.md`** — fill in the project overview, tech stack, and
   architecture sections (the `init` scan pre-fills what it can detect).
2. **Install the CodeRabbit app** (optional, for PR review) —
   <https://coderabbit.ai> (needs an org admin).
3. **Open Claude Code** in the project and try it:
   - Command: `/project:TeamAI:CodeReview`
   - Skill: `/pr-deep-review` — or just ask "review this branch"
   - Skill: `/keys-scan`, `/check-standards` — or they auto-trigger on matching requests

---

## Updating

```bash
npm install -g teamai-plugin@latest   # if installed globally
teamai update                         # re-apply into your project (adds missing, preserves yours)
teamai doctor                         # confirm
```

With `npx`, you always get the latest — just re-run `npx teamai-plugin update`.

---

## Verifying the install

```bash
teamai doctor
```

Reports each expected file/dir (commands, agents, rules, skills, settings,
`CLAUDE.md`, style guide, `.coderabbit.yaml`, git hook), counts of installed
commands/agents/skills, and integration status (Node, OpenSpec, git, Context7,
Playwright, Figma, Atlassian, CodeRabbit). If anything's missing:

```bash
teamai doctor --fix   # restores missing plugin files (safe — won't overwrite edits)
```

---

## Uninstalling

There's no automated uninstall. TeamAI only adds files, so remove what you want:

```bash
rm -rf .claude/commands .claude/agents .claude/rules .claude/skills
rm -f standards/style-guide.md .coderabbit.yaml .git/hooks/pre-commit
# keep or edit CLAUDE.md and .claude/settings.json as you like
npm uninstall -g teamai-plugin        # if installed globally
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Node.js v20+ required` | Upgrade Node (`nvm install 20`) |
| `command not found: teamai` | Use `npx teamai-plugin ...`, or `npm i -g teamai-plugin` |
| OpenSpec step fails | Install manually: `npm i -g @fission-ai/openspec@1.4.0` |
| Hook didn't install | Not a git repo — run `git init`, then `teamai update` |
| Your existing pre-commit hook untouched | Intentional — TeamAI's is at `.git/hooks/pre-commit.teamai`; merge manually |
| `curl \| bash` can't clone | Wrong/inaccessible repo URL — set `TEAM_AI_REPO`, or use the npm methods |
| Files missing after an upgrade | `teamai doctor --fix` |

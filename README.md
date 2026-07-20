# TeamAI — Claude Code Plugin for Dev Teams

A comprehensive Claude Code plugin that gives your team standardized code review, security scanning, PR workflows, and agent orchestration — out of the box.

## What's Included

### Slash Commands
| Command | Description |
|---------|-------------|
| `/project:TeamAI:CodeReview` | Multi-agent code review (architecture, DRY, security, performance) |
| `/project:TeamAI:PRReady` | Pre-PR audit: lint, build, tests, secrets scan, PR summary generation |
| `/project:readme-update` | Analyze recent changes and suggest documentation updates |
| `/project:openspec-setup` | Setup guide and workflow for OpenSpec spec-first development |

### Skills
Skills auto-trigger when the request matches, or can be invoked by name:
| Skill | Description |
|-------|-------------|
| `pr-deep-review` | Orchestrated deep review of a PR or branch diff — fans out CodeRabbit, `/simplify`, linters, and read-only review agents (security, DRY, architecture, correctness), then synthesizes one prioritized report. Invoke with `/pr-deep-review` or just ask to "review this branch". |
| `keys-scan` | Scan the codebase for leaked secrets, API keys, tokens, and credentials (pattern + file + git-history checks). Triggers on "scan for secrets" or invoke with `/keys-scan`. |
| `check-standards` | Audit code against the team style guide (naming, structure, DRY, hardcoded values, error handling, security, tests, imports) with a standards score. Triggers on "check standards" or invoke with `/check-standards`. |

### Agents
Specialized agents spawned by commands or manually via agent teams:
- **Backend** — APIs, databases, server-side architecture
- **Frontend** — UI components, styling, accessibility, state management
- **Planning** — Task decomposition, architecture decisions, risk assessment
- **Security** — Vulnerability scanning, OWASP, secrets detection
- **PR Review** — Pull request review with actionable feedback
- **Standards Enforcer** — Style guide compliance, naming, structure

### Rules (auto-loaded)
- `code-quality.md` — DRY, no hardcoded values, guard at source, single responsibility
- `security.md` — Secrets, injection prevention, auth, data protection
- `agent-orchestration.md` — How to use agent teams effectively

### Integrations & MCPs

| Integration | Type | Config needed? | What it does |
|-------------|------|---------------|-------------|
| **Context7** | MCP server (npm) | In `settings.json` ✅ | Up-to-date docs for any library — Claude fetches live documentation instead of relying on training data |
| **Playwright** | MCP server (npm) | In `settings.json` ✅ | Browser automation, E2E testing, screenshot capture directly from Claude |
| **Figma** | Built-in cloud MCP | None — already in Claude Code | Design-to-code, code-to-design, component inspection, asset export |
| **Atlassian** | Built-in cloud MCP | None — already in Claude Code | Read/create Jira issues, read/edit Confluence pages, search across projects |
| **OpenSpec** | CLI tool (not an MCP) | `npm install -g` + `openspec init` | Spec-first workflow: proposals, specs, design docs, task checklists before code |
| **CodeRabbit** | GitHub/GitLab bot | Install app + `.coderabbit.yaml` | AI-powered PR reviews on every push (complements local Claude review) |

**Why some are MCPs and some aren't:**
- **MCPs** (Context7, Playwright) run as local servers that Claude Code talks to — configured in `settings.json`
- **Built-in cloud MCPs** (Figma, Atlassian) are provided by Claude Code itself — no config, just authenticate when prompted
- **OpenSpec** is a CLI that generates files and registers its own `/opsx:*` commands into `.claude/commands/`
- **CodeRabbit** is a separate GitHub bot — it reviews PRs independently, not through Claude Code

### Git Hooks
- **pre-commit** — secrets scan, lint, format check, build verification (auto-detects your stack)

### Style Guide
- `standards/style-guide.md` — naming, structure, error handling, testing conventions

## Installation

### `teamai init` (recommended)

```bash
npx teamai-plugin init
```

That's it. Run it inside your project directory and it:
1. **Scans** your project — detects language, framework, linter, formatter, CI/CD, package manager
2. **Generates** a `CLAUDE.md` pre-filled with your detected tech stack and common commands
3. **Customizes** `.claude/settings.json` with permissions tailored to your tools
4. **Installs** commands, agents, rules, style guide, git hooks, OpenSpec, CodeRabbit config
5. **Preserves** your existing files — never overwrites what you already have

### Other install methods

```bash
# Install globally for repeated use across projects
npm install -g teamai-plugin
teamai init                          # smart init in current directory
teamai init ./my-app                 # smart init in specific directory
teamai install                       # full install (no scan, raw template copy)

# One-liner from GitHub (no npm)
curl -fsSL https://raw.githubusercontent.com/roytol-abra/team-ai-plugin/main/install.sh | bash

# Private repo
gh repo clone roytol-abra/team-ai-plugin /tmp/team-ai-plugin && /tmp/team-ai-plugin/setup.sh .
```

### CLI Commands

```bash
teamai init [path]       # Scan project + smart install (recommended)
teamai install [path]    # Full install without scanning (raw template)
teamai update [path]     # Update existing installation (preserves customizations)
teamai doctor [path]     # Check installation health and integration status
teamai --help            # Show help
```

### `init` vs `install`

| | `teamai init` | `teamai install` |
|---|---|---|
| Scans project | ✅ Detects stack, tools, CI/CD | ❌ No scanning |
| CLAUDE.md | Auto-filled with detected stack | Generic template |
| settings.json | Permissions customized for your tools | Generic permissions |
| Existing files | Merges (adds missing MCPs, preserves yours) | Skips existing |
| Best for | New project setup | Quick copy of raw templates |

### Manual Install

Copy these into your project root:
1. `.claude/` directory (commands, agents, rules, skills, settings)
2. `CLAUDE.md`
3. `standards/style-guide.md`
4. `.coderabbit.yaml`
5. `hooks/pre-commit` → `.git/hooks/pre-commit` (and `chmod +x`)

Then install OpenSpec: `npm install -g @fission-ai/openspec@latest && openspec init`

### What the installer does automatically

| Step | What | Auto? |
|------|------|-------|
| 1 | Copies `.claude/` config (commands, agents, rules, skills, settings) | ✅ |
| 2 | Copies `CLAUDE.md` template | ✅ |
| 3 | Copies `standards/style-guide.md` | ✅ |
| 4 | Installs git pre-commit hook | ✅ |
| 5 | Installs OpenSpec CLI globally + initializes in project | ✅ |
| 6 | Copies `.coderabbit.yaml` config | ✅ |
| 7 | Context7 + Playwright MCPs (download on first Claude Code launch) | ✅ |
| 8 | Figma + Atlassian (built-in, authenticate on first use) | ✅ |
| 9 | CodeRabbit GitHub app (requires org admin) | ❌ Manual |

### After Installation

**Required (2 minutes):**
1. Edit `CLAUDE.md` — fill in your project overview, tech stack, and architecture
2. Open Claude Code and run `/project:TeamAI:CodeReview` to verify everything works

**Optional:**
3. Install CodeRabbit app at https://coderabbit.ai (needs org admin)
4. Authenticate Figma and Atlassian when prompted on first use in Claude Code
5. Configure OpenSpec profile: `openspec config profile`

## Customization

### Adding Project-Specific Rules
Add `.md` files to `.claude/rules/` — they're automatically loaded by Claude Code.

### Adding Custom Commands
Add `.md` files to `.claude/commands/` — they become `/project:command-name` slash commands.

### Modifying Agents
Edit files in `.claude/agents/` to adjust agent behavior, expertise, or output format.

### Overriding Standards
Project-specific rules in `CLAUDE.md` always override the style guide defaults.

## File Structure
```
.claude/
  commands/
    TeamAI:CodeReview.md    — multi-agent code review
    TeamAI:PRReady.md       — PR readiness check
    readme-update.md        — README update suggestions
    openspec-setup.md       — OpenSpec workflow guide
  agents/
    backend.md              — backend specialist agent
    frontend.md             — frontend specialist agent
    planning.md             — planning/architecture agent
    security.md             — security specialist agent
    pr-review.md            — PR review agent
    standards-enforcer.md   — standards enforcement agent
  rules/
    code-quality.md         — code quality rules
    security.md             — security rules
    agent-orchestration.md  — agent team coordination rules
  skills/
    pr-deep-review/         — orchestrated deep PR/branch review
      SKILL.md
      references/
        review-checklist.md — manual review checklist
    keys-scan/              — secrets & API keys scanner
      SKILL.md
    check-standards/        — team style-guide audit
      SKILL.md
  settings.json             — MCP servers, permissions, hooks
CLAUDE.md                   — project config template
standards/
  style-guide.md            — team style guide
hooks/
  pre-commit                — git pre-commit hook
setup.sh                    — installer script
```

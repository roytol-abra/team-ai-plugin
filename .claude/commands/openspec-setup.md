# OpenSpec Setup & Workflow Guide

You are helping the user set up and use OpenSpec — an AI-native spec-first workflow tool by Fission AI.

## What To Do

$ARGUMENTS

If no arguments, guide the user through initial setup. If arguments provided, help with that specific OpenSpec task.

## Setup (if not already installed)

### 1. Prerequisites
- Node.js >= 20.19.0

### 2. Install
```bash
npm install -g @fission-ai/openspec@latest
```

### 3. Initialize in project
```bash
openspec init
```
This creates an `openspec/` directory with:
- `config.yaml` — project context, rules, and workflow config
- `changes/` — where proposals and specs live

### 4. Configure profile
```bash
openspec config profile
```
Choose a workflow profile that matches your team's process.

### 5. Register slash commands
```bash
openspec update
```
This registers OpenSpec commands in your project's `.claude/commands/`.

## Config File (`openspec/config.yaml`)

The config file is the brain of OpenSpec. It should include:

```yaml
project:
  name: "Your Project Name"
  description: "Brief description"
  tech_stack:
    - "Language/framework"
  architecture: "Brief architecture description"

rules:
  - "Rule 1 from your CLAUDE.md"
  - "Rule 2"

workflow:
  proposal_review: true    # Require review before implementation
  auto_sync_specs: true    # Keep specs in sync automatically
  task_granularity: small  # small, medium, large
```

**Customize this** — add your project's specific architecture, tech stack, and rules from CLAUDE.md.

## Daily Workflow

### Proposing a Change
```
/opsx:propose Add user authentication with OAuth2
```
This generates under `openspec/changes/add-user-auth/`:
- `proposal.md` — high-level what and why
- `specs/` — detailed technical specs
- `design.md` — architecture decisions
- `tasks.md` — implementation checklist

### Implementing
```
/opsx:apply
```
Works through tasks from the current active proposal.

### Archiving
```
/opsx:archive
```
Moves completed work to `openspec/changes/archive/`.

## Available Commands

| Command | What it does |
|---------|-------------|
| `/opsx:propose <idea>` | Create a change proposal |
| `/opsx:apply` | Implement tasks from active proposal |
| `/opsx:archive` | Archive completed change |
| `/opsx:new` | Start a new change |
| `/opsx:continue` | Resume an in-progress change |
| `/opsx:ff` | Fast-forward — skip to next incomplete task |
| `/opsx:verify` | Verify implementation matches spec |
| `/opsx:bulk-archive` | Archive multiple completed changes |
| `/opsx:onboard` | Get oriented with the current project's OpenSpec setup |

## Best Practices

1. **Always propose before implement** — write the spec first, then code
2. **Keep specs small** — one logical change per proposal
3. **Sync after every task group** — main spec should always reflect current state
4. **Use advisor for planning** — let Opus review proposals before creating them
5. **Clear context between phases** — plan in one session, implement in another
6. **Review tasks before starting** — make sure each task is small and verifiable

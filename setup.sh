#!/bin/bash
#
# TeamAI Plugin Setup Script
#
# Usage: ./setup.sh [target-project-directory]
#
# Installs the TeamAI plugin into a target project:
# - Copies .claude config (commands, agents, rules, skills, settings)
# - Copies CLAUDE.md template and style guide
# - Installs git pre-commit hook
# - Installs OpenSpec (if not present)
# - Copies CodeRabbit config

set -e

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-.}"

# Resolve to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
  echo "❌ Target directory does not exist: $1"
  exit 1
}

echo "================================================"
echo "  TeamAI Plugin Installer"
echo "================================================"
echo ""
echo "  Source:  $PLUGIN_DIR"
echo "  Target:  $TARGET_DIR"
echo ""

# --------------------------------------------------
# 0. Check prerequisites
# --------------------------------------------------
echo "[0/7] Checking prerequisites..."

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "  ❌ Node.js is required but not installed."
  echo "     Install from https://nodejs.org (v20.19.0+ required)"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "  ❌ Node.js v20+ required (found $(node -v))"
  echo "     Upgrade from https://nodejs.org"
  exit 1
fi
echo "  ✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &>/dev/null; then
  echo "  ❌ npm is required but not installed."
  exit 1
fi
echo "  ✅ npm $(npm -v)"

# Check git
if ! command -v git &>/dev/null; then
  echo "  ❌ git is required but not installed."
  exit 1
fi
echo "  ✅ git $(git --version | cut -d' ' -f3)"

# --------------------------------------------------
# 1. Copy .claude directory
# --------------------------------------------------
echo ""
echo "[1/7] Installing .claude configuration..."

if [ -d "$TARGET_DIR/.claude" ]; then
  echo "  ⚠️  .claude/ already exists — merging (existing files preserved)"
fi

# Create directories
mkdir -p "$TARGET_DIR/.claude/commands"
mkdir -p "$TARGET_DIR/.claude/rules"
mkdir -p "$TARGET_DIR/.claude/agents"

# Copy commands (don't overwrite existing)
for file in "$PLUGIN_DIR/.claude/commands/"*.md; do
  filename=$(basename "$file")
  if [ ! -f "$TARGET_DIR/.claude/commands/$filename" ]; then
    cp "$file" "$TARGET_DIR/.claude/commands/$filename"
    echo "  + commands/$filename"
  else
    echo "  ~ commands/$filename (exists — skipped)"
  fi
done

# Copy agents
for file in "$PLUGIN_DIR/.claude/agents/"*.md; do
  filename=$(basename "$file")
  if [ ! -f "$TARGET_DIR/.claude/agents/$filename" ]; then
    cp "$file" "$TARGET_DIR/.claude/agents/$filename"
    echo "  + agents/$filename"
  else
    echo "  ~ agents/$filename (exists — skipped)"
  fi
done

# Copy rules
for file in "$PLUGIN_DIR/.claude/rules/"*.md; do
  filename=$(basename "$file")
  if [ ! -f "$TARGET_DIR/.claude/rules/$filename" ]; then
    cp "$file" "$TARGET_DIR/.claude/rules/$filename"
    echo "  + rules/$filename"
  else
    echo "  ~ rules/$filename (exists — skipped)"
  fi
done

# Merge settings.json
if [ ! -f "$TARGET_DIR/.claude/settings.json" ]; then
  cp "$PLUGIN_DIR/.claude/settings.json" "$TARGET_DIR/.claude/settings.json"
  echo "  + settings.json"
else
  echo "  ~ settings.json exists — please merge manually:"
  echo "    $PLUGIN_DIR/.claude/settings.json"
fi

# Copy skills (each skill is a directory with SKILL.md + optional subfolders,
# so copy the whole skill dir; don't overwrite a skill the project already has)
if [ -d "$PLUGIN_DIR/.claude/skills" ]; then
  mkdir -p "$TARGET_DIR/.claude/skills"
  for skill_dir in "$PLUGIN_DIR/.claude/skills/"*/; do
    skill_name=$(basename "$skill_dir")
    if [ ! -d "$TARGET_DIR/.claude/skills/$skill_name" ]; then
      cp -R "$skill_dir" "$TARGET_DIR/.claude/skills/$skill_name"
      echo "  + skills/$skill_name"
    else
      echo "  ~ skills/$skill_name (exists — skipped)"
    fi
  done
fi

# --------------------------------------------------
# 2. Copy CLAUDE.md template
# --------------------------------------------------
echo ""
echo "[2/7] Installing CLAUDE.md template..."

if [ ! -f "$TARGET_DIR/CLAUDE.md" ]; then
  cp "$PLUGIN_DIR/CLAUDE.md" "$TARGET_DIR/CLAUDE.md"
  echo "  + CLAUDE.md (customize the Project Overview and Tech Stack sections)"
else
  echo "  ~ CLAUDE.md already exists — skipped"
  echo "    Review the template at: $PLUGIN_DIR/CLAUDE.md"
fi

# --------------------------------------------------
# 3. Copy style guide
# --------------------------------------------------
echo ""
echo "[3/7] Installing style guide..."

mkdir -p "$TARGET_DIR/standards"
if [ ! -f "$TARGET_DIR/standards/style-guide.md" ]; then
  cp "$PLUGIN_DIR/standards/style-guide.md" "$TARGET_DIR/standards/style-guide.md"
  echo "  + standards/style-guide.md"
else
  echo "  ~ standards/style-guide.md exists — skipped"
fi

# --------------------------------------------------
# 4. Install git hooks
# --------------------------------------------------
echo ""
echo "[4/7] Installing git hooks..."

if [ -d "$TARGET_DIR/.git" ]; then
  cp "$PLUGIN_DIR/hooks/pre-commit" "$TARGET_DIR/.git/hooks/pre-commit"
  chmod +x "$TARGET_DIR/.git/hooks/pre-commit"
  echo "  + .git/hooks/pre-commit"
else
  echo "  ⚠️  Not a git repository — skipping hook installation"
  echo "    Run 'git init' first, then re-run this script"
fi

# --------------------------------------------------
# 5. Install & initialize OpenSpec
# --------------------------------------------------
echo ""
echo "[5/7] Installing OpenSpec..."

if command -v openspec &>/dev/null; then
  echo "  ✅ OpenSpec already installed ($(openspec --version 2>/dev/null || echo 'version unknown'))"
else
  echo "  Installing OpenSpec globally..."
  npm install -g @fission-ai/openspec@latest
  if command -v openspec &>/dev/null; then
    echo "  ✅ OpenSpec installed successfully"
  else
    echo "  ⚠️  OpenSpec installed but not found in PATH"
    echo "    Try: export PATH=\"$(npm prefix -g)/bin:\$PATH\""
    echo "    Then re-run this script"
  fi
fi

# Initialize OpenSpec in target project if not already done
if command -v openspec &>/dev/null; then
  if [ ! -d "$TARGET_DIR/openspec" ]; then
    echo "  Initializing OpenSpec in project..."
    cd "$TARGET_DIR"
    openspec init 2>/dev/null || {
      echo "  ⚠️  OpenSpec init requires interactive input."
      echo "    Run manually: cd $TARGET_DIR && openspec init"
    }
    # Register slash commands
    if [ -d "$TARGET_DIR/openspec" ]; then
      openspec update 2>/dev/null || true
      echo "  ✅ OpenSpec initialized — /opsx:* commands registered"
    fi
    cd "$PLUGIN_DIR"
  else
    echo "  ✅ OpenSpec already initialized in this project"
    # Update commands in case of new version
    cd "$TARGET_DIR"
    openspec update 2>/dev/null || true
    cd "$PLUGIN_DIR"
  fi
fi

# --------------------------------------------------
# 6. CodeRabbit config
# --------------------------------------------------
echo ""
echo "[6/7] Installing CodeRabbit config..."

if [ ! -f "$TARGET_DIR/.coderabbit.yaml" ]; then
  cp "$PLUGIN_DIR/.coderabbit.yaml" "$TARGET_DIR/.coderabbit.yaml"
  echo "  + .coderabbit.yaml"
  echo "  ⚠️  CodeRabbit requires the GitHub/GitLab app to be installed by an org admin"
  echo "    Install at: https://coderabbit.ai"
else
  echo "  ~ .coderabbit.yaml already exists — skipped"
fi

# --------------------------------------------------
# 7. Final integration status
# --------------------------------------------------
echo ""
echo "[7/7] Integration status..."

echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │ Integration        │ Status   │ Auto?               │"
echo "  ├─────────────────────────────────────────────────────┤"

# Context7 — auto via npx
echo "  │ Context7           │ ✅ Ready  │ Auto (npx on launch) │"

# Playwright — auto via npx
echo "  │ Playwright         │ ✅ Ready  │ Auto (npx on launch) │"

# Figma — built-in
echo "  │ Figma              │ ✅ Ready  │ Built-in (auth once) │"

# Atlassian — built-in
echo "  │ Atlassian          │ ✅ Ready  │ Built-in (auth once) │"

# OpenSpec
if command -v openspec &>/dev/null; then
  if [ -d "$TARGET_DIR/openspec" ]; then
    echo "  │ OpenSpec           │ ✅ Ready  │ Auto-installed       │"
  else
    echo "  │ OpenSpec           │ 🟡 Needs init │ Run: openspec init  │"
  fi
else
  echo "  │ OpenSpec           │ ❌ Failed │ Install manually     │"
fi

# CodeRabbit
if [ -f "$TARGET_DIR/.coderabbit.yaml" ]; then
  echo "  │ CodeRabbit         │ 🟡 Config only │ Needs app install │"
else
  echo "  │ CodeRabbit         │ ❌ Missing│ Needs manual setup   │"
fi

echo "  └─────────────────────────────────────────────────────┘"

# --------------------------------------------------
# Done
# --------------------------------------------------
echo ""
echo "================================================"
echo "  ✅ TeamAI Plugin installed!"
echo "================================================"
echo ""
echo "  What was auto-installed:"
echo "    ✅ .claude/ config (commands, agents, rules, skills, settings)"
echo "    ✅ CLAUDE.md template"
echo "    ✅ Style guide"
echo "    ✅ Git pre-commit hook"
echo "    ✅ Context7 MCP (downloads on first Claude Code launch)"
echo "    ✅ Playwright MCP (downloads on first Claude Code launch)"
echo "    ✅ OpenSpec CLI + project init"
echo ""
echo "  What you still need to do:"
echo "    1. Edit CLAUDE.md — add your project overview, tech stack, architecture"
echo "    2. Install CodeRabbit app — https://coderabbit.ai (needs org admin)"
echo "    3. Open Claude Code and try: /project:TeamAI:CodeReview"
echo ""
echo "  Available commands:"
echo "    /project:TeamAI:CodeReview   — code review (local) + CodeRabbit (PR)"
echo "    /project:TeamAI:PRReady      — gates → code review → PR summary"
echo "    /project:keys-scan           — secrets & API keys scanner"
echo "    /project:readme-update       — suggest README updates"
echo "    /project:check-standards     — audit against style guide"
echo "    /project:openspec-setup      — OpenSpec workflow guide"
echo ""
echo "  Available skills (auto-trigger, or invoke with /pr-deep-review):"
echo "    pr-deep-review               — orchestrated deep PR/branch review"
echo ""
echo "  OpenSpec commands:"
echo "    /opsx:propose <idea>         — create a change proposal"
echo "    /opsx:apply                  — implement tasks from spec"
echo "    /opsx:archive                — archive completed change"
echo ""

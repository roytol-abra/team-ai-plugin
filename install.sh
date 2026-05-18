#!/bin/bash
#
# TeamAI Plugin — Remote Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/roytoledo-star/team-ai-plugin/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/roytoledo-star/team-ai-plugin/main/install.sh | bash -s /path/to/project
#
# What it does:
#   1. Clones the plugin repo to a temp directory
#   2. Runs setup.sh against your project
#   3. Cleans up the temp directory
#

set -e

TARGET_DIR="${1:-.}"
REPO_URL="${TEAM_AI_REPO:-https://github.com/roytoledo-star/team-ai-plugin.git}"
BRANCH="${TEAM_AI_BRANCH:-main}"
TMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# Resolve target to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
  echo "❌ Target directory does not exist: $1"
  exit 1
}

echo ""
echo "  TeamAI Plugin — Remote Installer"
echo "  Target: $TARGET_DIR"
echo ""

# Clone the plugin repo
echo "Downloading TeamAI plugin..."
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$TMP_DIR" 2>/dev/null || {
  echo "❌ Failed to clone $REPO_URL"
  echo "   Check that the repo exists and you have access."
  echo ""
  echo "   If using a private repo, make sure you're authenticated:"
  echo "     gh auth login"
  echo "   Or set the repo URL:"
  echo "     TEAM_AI_REPO=https://github.com/your-org/team-ai-plugin.git bash install.sh"
  exit 1
}

# Run setup
chmod +x "$TMP_DIR/setup.sh"
"$TMP_DIR/setup.sh" "$TARGET_DIR"

#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PLUGIN_DIR = path.resolve(__dirname, '..');

// ─── Project Scanner ────────────────────────────────────────

function scanProject(targetDir) {
  const scan = {
    path: targetDir,
    name: path.basename(targetDir),
    isGitRepo: false,
    languages: [],
    frameworks: [],
    packageManager: null,
    styling: [],
    testing: [],
    linting: [],
    formatting: [],
    hasDocker: false,
    hasCI: null,
    existing: {
      claudeMd: false,
      claudeDir: false,
      settings: false,
      commands: [],
      agents: [],
      rules: [],
      hooks: false,
      coderabbit: false,
      openspec: false,
      gitignore: false,
    },
    detectedStack: '',
    architecture: '',
  };

  // Git
  scan.isGitRepo = fs.existsSync(path.join(targetDir, '.git'));

  // Existing TeamAI/Claude config
  scan.existing.claudeMd = fs.existsSync(path.join(targetDir, 'CLAUDE.md'));
  scan.existing.claudeDir = fs.existsSync(path.join(targetDir, '.claude'));
  scan.existing.settings = fs.existsSync(path.join(targetDir, '.claude', 'settings.json'));
  scan.existing.hooks = fs.existsSync(path.join(targetDir, '.git', 'hooks', 'pre-commit'));
  scan.existing.coderabbit = fs.existsSync(path.join(targetDir, '.coderabbit.yaml'));
  scan.existing.openspec = fs.existsSync(path.join(targetDir, 'openspec'));
  scan.existing.gitignore = fs.existsSync(path.join(targetDir, '.gitignore'));

  const cmdsDir = path.join(targetDir, '.claude', 'commands');
  if (fs.existsSync(cmdsDir)) {
    scan.existing.commands = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md'));
  }
  const agentsDir = path.join(targetDir, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    scan.existing.agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  }
  const rulesDir = path.join(targetDir, '.claude', 'rules');
  if (fs.existsSync(rulesDir)) {
    scan.existing.rules = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
  }

  // ─── Language & Framework Detection ───

  // JavaScript / TypeScript
  const hasPkgJson = fs.existsSync(path.join(targetDir, 'package.json'));
  const hasTsConfig = fs.existsSync(path.join(targetDir, 'tsconfig.json'));
  let pkgJson = null;

  if (hasPkgJson) {
    try {
      pkgJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
    } catch {}
  }

  if (hasTsConfig) scan.languages.push('TypeScript');
  else if (hasPkgJson) scan.languages.push('JavaScript');

  if (pkgJson) {
    const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

    // Frameworks
    if (allDeps['next']) scan.frameworks.push('Next.js');
    if (allDeps['react'] && !allDeps['next']) scan.frameworks.push('React');
    if (allDeps['vue']) scan.frameworks.push('Vue');
    if (allDeps['@angular/core']) scan.frameworks.push('Angular');
    if (allDeps['svelte'] || allDeps['@sveltejs/kit']) scan.frameworks.push('Svelte');
    if (allDeps['express']) scan.frameworks.push('Express');
    if (allDeps['@nestjs/core']) scan.frameworks.push('NestJS');
    if (allDeps['fastify']) scan.frameworks.push('Fastify');
    if (allDeps['hono']) scan.frameworks.push('Hono');
    if (allDeps['nuxt']) scan.frameworks.push('Nuxt');
    if (allDeps['astro']) scan.frameworks.push('Astro');
    if (allDeps['electron']) scan.frameworks.push('Electron');
    if (allDeps['react-native']) scan.frameworks.push('React Native');
    if (allDeps['expo']) scan.frameworks.push('Expo');

    // Styling
    if (allDeps['tailwindcss']) scan.styling.push('Tailwind CSS');
    if (allDeps['styled-components']) scan.styling.push('Styled Components');
    if (allDeps['@emotion/react']) scan.styling.push('Emotion');
    if (allDeps['sass'] || allDeps['node-sass']) scan.styling.push('SASS/SCSS');
    if (fs.existsSync(path.join(targetDir, 'postcss.config.js')) || fs.existsSync(path.join(targetDir, 'postcss.config.mjs'))) {
      if (!scan.styling.length) scan.styling.push('PostCSS');
    }

    // Testing
    if (allDeps['jest'] || allDeps['@jest/core']) scan.testing.push('Jest');
    if (allDeps['vitest']) scan.testing.push('Vitest');
    if (allDeps['mocha']) scan.testing.push('Mocha');
    if (allDeps['playwright'] || allDeps['@playwright/test']) scan.testing.push('Playwright');
    if (allDeps['cypress']) scan.testing.push('Cypress');
    if (allDeps['@testing-library/react']) scan.testing.push('React Testing Library');
    if (allDeps['storybook'] || allDeps['@storybook/react']) scan.testing.push('Storybook');

    // Linting
    if (allDeps['eslint']) scan.linting.push('ESLint');
    if (allDeps['biome'] || allDeps['@biomejs/biome']) scan.linting.push('Biome');
    if (allDeps['oxlint']) scan.linting.push('oxlint');

    // Formatting
    if (allDeps['prettier']) scan.formatting.push('Prettier');
    if (allDeps['biome'] || allDeps['@biomejs/biome']) {
      if (!scan.formatting.includes('Biome')) scan.formatting.push('Biome');
    }

    // Package manager
    if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) scan.packageManager = 'pnpm';
    else if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) scan.packageManager = 'yarn';
    else if (fs.existsSync(path.join(targetDir, 'bun.lockb'))) scan.packageManager = 'bun';
    else if (fs.existsSync(path.join(targetDir, 'package-lock.json'))) scan.packageManager = 'npm';
  }

  // CSS Modules detection
  try {
    const srcFiles = execSync(`find "${targetDir}/src" -name "*.module.css" -o -name "*.module.scss" 2>/dev/null | head -1`, { encoding: 'utf8' }).trim();
    if (srcFiles) scan.styling.push('CSS Modules');
  } catch {}

  // Python
  const hasPyproject = fs.existsSync(path.join(targetDir, 'pyproject.toml'));
  const hasRequirements = fs.existsSync(path.join(targetDir, 'requirements.txt'));
  const hasPipfile = fs.existsSync(path.join(targetDir, 'Pipfile'));

  if (hasPyproject || hasRequirements || hasPipfile) {
    scan.languages.push('Python');
    if (hasPyproject) {
      try {
        const pyproject = fs.readFileSync(path.join(targetDir, 'pyproject.toml'), 'utf8');
        if (pyproject.includes('fastapi')) scan.frameworks.push('FastAPI');
        if (pyproject.includes('django')) scan.frameworks.push('Django');
        if (pyproject.includes('flask')) scan.frameworks.push('Flask');
        if (pyproject.includes('pytest')) scan.testing.push('pytest');
        if (pyproject.includes('ruff')) { scan.linting.push('Ruff'); scan.formatting.push('Ruff'); }
        if (pyproject.includes('black')) scan.formatting.push('Black');
        if (pyproject.includes('mypy')) scan.linting.push('mypy');
      } catch {}
    }
    if (hasRequirements) {
      try {
        const reqs = fs.readFileSync(path.join(targetDir, 'requirements.txt'), 'utf8');
        if (reqs.includes('fastapi')) scan.frameworks.push('FastAPI');
        if (reqs.includes('django')) scan.frameworks.push('Django');
        if (reqs.includes('flask')) scan.frameworks.push('Flask');
      } catch {}
    }
    scan.packageManager = hasPipfile ? 'pipenv' : (hasPyproject ? 'pip/uv' : 'pip');
  }

  // Dart / Flutter
  const hasPubspec = fs.existsSync(path.join(targetDir, 'pubspec.yaml'));
  if (hasPubspec) {
    scan.languages.push('Dart');
    try {
      const pubspec = fs.readFileSync(path.join(targetDir, 'pubspec.yaml'), 'utf8');
      if (pubspec.includes('flutter:')) {
        scan.frameworks.push('Flutter');
        if (pubspec.includes('get:') || pubspec.includes('get_')) scan.frameworks.push('GetX');
        if (pubspec.includes('flutter_bloc')) scan.frameworks.push('Bloc');
        if (pubspec.includes('riverpod')) scan.frameworks.push('Riverpod');
        if (pubspec.includes('provider:')) scan.frameworks.push('Provider');
      }
    } catch {}
    scan.packageManager = 'pub';
    scan.linting.push('dart analyze');
    scan.formatting.push('dart format');
  }

  // Go
  if (fs.existsSync(path.join(targetDir, 'go.mod'))) {
    scan.languages.push('Go');
    scan.packageManager = 'go mod';
    scan.linting.push('golangci-lint');
    scan.formatting.push('gofmt');
    try {
      const gomod = fs.readFileSync(path.join(targetDir, 'go.mod'), 'utf8');
      if (gomod.includes('gin-gonic')) scan.frameworks.push('Gin');
      if (gomod.includes('labstack/echo')) scan.frameworks.push('Echo');
      if (gomod.includes('gofiber')) scan.frameworks.push('Fiber');
    } catch {}
  }

  // Rust
  if (fs.existsSync(path.join(targetDir, 'Cargo.toml'))) {
    scan.languages.push('Rust');
    scan.packageManager = 'cargo';
    scan.linting.push('clippy');
    scan.formatting.push('rustfmt');
    try {
      const cargo = fs.readFileSync(path.join(targetDir, 'Cargo.toml'), 'utf8');
      if (cargo.includes('actix-web')) scan.frameworks.push('Actix');
      if (cargo.includes('axum')) scan.frameworks.push('Axum');
      if (cargo.includes('rocket')) scan.frameworks.push('Rocket');
      if (cargo.includes('tauri')) scan.frameworks.push('Tauri');
    } catch {}
  }

  // Java / Kotlin
  if (fs.existsSync(path.join(targetDir, 'pom.xml'))) {
    scan.languages.push('Java');
    scan.packageManager = 'Maven';
    scan.frameworks.push('Spring Boot');
  }
  if (fs.existsSync(path.join(targetDir, 'build.gradle')) || fs.existsSync(path.join(targetDir, 'build.gradle.kts'))) {
    const gradleFile = fs.existsSync(path.join(targetDir, 'build.gradle.kts')) ? 'build.gradle.kts' : 'build.gradle';
    try {
      const gradle = fs.readFileSync(path.join(targetDir, gradleFile), 'utf8');
      if (gradle.includes('kotlin')) scan.languages.push('Kotlin');
      else if (!scan.languages.includes('Java')) scan.languages.push('Java');
      if (gradle.includes('spring-boot')) scan.frameworks.push('Spring Boot');
      if (gradle.includes('android')) scan.frameworks.push('Android');
    } catch {
      if (!scan.languages.includes('Java')) scan.languages.push('Java');
    }
    scan.packageManager = 'Gradle';
  }

  // Docker
  scan.hasDocker = fs.existsSync(path.join(targetDir, 'Dockerfile')) || fs.existsSync(path.join(targetDir, 'docker-compose.yml')) || fs.existsSync(path.join(targetDir, 'docker-compose.yaml'));

  // CI/CD
  if (fs.existsSync(path.join(targetDir, '.github', 'workflows'))) scan.hasCI = 'GitHub Actions';
  else if (fs.existsSync(path.join(targetDir, '.gitlab-ci.yml'))) scan.hasCI = 'GitLab CI';
  else if (fs.existsSync(path.join(targetDir, 'bitbucket-pipelines.yml'))) scan.hasCI = 'Bitbucket Pipelines';
  else if (fs.existsSync(path.join(targetDir, 'Jenkinsfile'))) scan.hasCI = 'Jenkins';
  else if (fs.existsSync(path.join(targetDir, '.circleci'))) scan.hasCI = 'CircleCI';

  // Deduplicate
  scan.languages = [...new Set(scan.languages)];
  scan.frameworks = [...new Set(scan.frameworks)];
  scan.styling = [...new Set(scan.styling)];
  scan.testing = [...new Set(scan.testing)];
  scan.linting = [...new Set(scan.linting)];
  scan.formatting = [...new Set(scan.formatting)];

  // Build summary strings
  scan.detectedStack = [
    ...scan.languages,
    ...scan.frameworks,
  ].join(', ') || 'Unknown';

  return scan;
}

// ─── CLAUDE.md Generator ────────────────────────────────────

function generateClaudeMd(scan) {
  const lines = [];

  lines.push('# Project Configuration');
  lines.push('');
  lines.push('## Features');
  lines.push('');
  lines.push('- agentTeams: true — proactively use agent teams for tasks that benefit from parallel work');
  lines.push('');
  lines.push('## Preferences');
  lines.push('');
  lines.push('- preferRootCauseAnalysis: true');
  lines.push('- avoidAssumptions: true');
  lines.push('- askBeforeMajorRefactor: true');
  lines.push('- explainBeforeCode: true');
  lines.push('- dryByDefault: true');
  lines.push('- noHardcodedValues: true');
  lines.push('- securityFirst: true');
  lines.push('- testBeforeShip: true');
  lines.push('');

  // Advisor rules
  lines.push('## Advisor Rules (Opus plans, Sonnet executes)');
  lines.push('');
  lines.push('The advisor (Opus) must be consulted for all planning and decision-making. Sonnet handles execution only after the plan is validated.');
  lines.push('');
  lines.push('**Always call advisor:**');
  lines.push('- Before any planning discussion — feature scoping, architecture decisions, approach selection');
  lines.push('- Before starting implementation of a new ticket — advisor validates the plan and approach first');
  lines.push('- When choosing between multiple technical approaches — advisor decides');
  lines.push('- Before writing design docs or specs');
  lines.push('');
  lines.push('**Skip advisor (Sonnet executes directly):**');
  lines.push('- Applying an already-approved plan (writing code, editing files)');
  lines.push('- Running lint, typecheck, tests, builds');
  lines.push('- Git operations, simple file reads and exploration');
  lines.push('- Fixing lint/type errors during implementation');
  lines.push('');

  // Project Overview — auto-filled
  lines.push('## Project Overview');
  lines.push('');
  lines.push(`<!-- TODO: Describe what this project does, who it\'s for, and its core purpose -->`);
  lines.push(`Project Name — [describe your project here]`);
  lines.push('');

  // Tech Stack — auto-detected
  lines.push('## Tech Stack');
  lines.push('');
  if (scan.languages.length) lines.push(`- **Languages:** ${scan.languages.join(', ')}`);
  if (scan.frameworks.length) lines.push(`- **Frameworks:** ${scan.frameworks.join(', ')}`);
  if (scan.styling.length) lines.push(`- **Styling:** ${scan.styling.join(', ')}`);
  if (scan.testing.length) lines.push(`- **Testing:** ${scan.testing.join(', ')}`);
  if (scan.linting.length) lines.push(`- **Linting:** ${scan.linting.join(', ')}`);
  if (scan.formatting.length) lines.push(`- **Formatting:** ${scan.formatting.join(', ')}`);
  if (scan.packageManager) lines.push(`- **Package Manager:** ${scan.packageManager}`);
  if (scan.hasDocker) lines.push('- **Containerization:** Docker');
  if (scan.hasCI) lines.push(`- **CI/CD:** ${scan.hasCI}`);
  lines.push('');

  // Common commands — auto-detected
  lines.push('## Common Commands');
  lines.push('');
  lines.push('```bash');

  if (scan.languages.includes('TypeScript') || scan.languages.includes('JavaScript')) {
    const pm = scan.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;
    const install = pm === 'pnpm' ? 'pnpm install' : pm === 'yarn' ? 'yarn' : pm === 'bun' ? 'bun install' : 'npm install';
    lines.push(`# Install dependencies`);
    lines.push(install);
    lines.push('');
    if (scan.linting.length) {
      lines.push('# Lint');
      lines.push(`${run} lint`);
      lines.push('');
    }
    if (scan.formatting.length) {
      lines.push('# Format');
      lines.push(`${run} format`);
      lines.push('');
    }
    lines.push('# Test');
    lines.push(`${run} test`);
    lines.push('');
    lines.push('# Build');
    lines.push(`${run} build`);
  }

  if (scan.languages.includes('Dart')) {
    lines.push('# Install dependencies');
    lines.push('flutter pub get');
    lines.push('');
    lines.push('# Analyze');
    lines.push('flutter analyze');
    lines.push('');
    lines.push('# Format');
    lines.push('dart format .');
    lines.push('');
    lines.push('# Run (dev)');
    lines.push('flutter run --dart-define=env=dev');
  }

  if (scan.languages.includes('Python')) {
    lines.push('# Install dependencies');
    if (scan.packageManager === 'pipenv') lines.push('pipenv install');
    else lines.push('pip install -r requirements.txt');
    lines.push('');
    if (scan.linting.includes('Ruff')) {
      lines.push('# Lint + format');
      lines.push('ruff check . && ruff format .');
    }
    if (scan.testing.includes('pytest')) {
      lines.push('');
      lines.push('# Test');
      lines.push('pytest');
    }
  }

  if (scan.languages.includes('Go')) {
    lines.push('# Build');
    lines.push('go build ./...');
    lines.push('');
    lines.push('# Test');
    lines.push('go test ./...');
    lines.push('');
    lines.push('# Lint');
    lines.push('golangci-lint run');
  }

  if (scan.languages.includes('Rust')) {
    lines.push('# Build');
    lines.push('cargo build');
    lines.push('');
    lines.push('# Test');
    lines.push('cargo test');
    lines.push('');
    lines.push('# Lint');
    lines.push('cargo clippy');
  }

  lines.push('```');
  lines.push('');

  // Architecture placeholder
  lines.push('## Architecture');
  lines.push('');
  lines.push('<!-- TODO: Describe your project\'s architecture -->');
  lines.push('<!-- Example: Layered architecture, monorepo, microservices, etc. -->');
  lines.push('');

  // Conventions placeholder
  lines.push('## Conventions');
  lines.push('');
  lines.push('<!-- TODO: Add project-specific conventions -->');
  lines.push('<!-- Examples: branch naming, PR rules, component patterns, file structure -->');
  lines.push('');

  // Code Quality Rules
  lines.push('## Code Quality Rules');
  lines.push('');
  lines.push('- **No hardcoded variant logic** — variant differences must be driven by configuration, props, or state');
  lines.push('- **Separation of concerns** — presentation in view layer, business logic in services, data access in repositories');
  lines.push('- **Guard at the source** — validate inputs at the entry point, not in every downstream consumer');
  lines.push('- **Always bounds-check collection access** before passing values to callbacks or external contracts');
  lines.push('- **Proper fixes, not patches** — always address the root cause with a best-practice solution');
  lines.push('- **No magic numbers or strings** — extract to named constants or config');
  lines.push('- **DRY code** — if you see 3+ lines repeated, extract to a shared function');
  lines.push('');

  return lines.join('\n');
}

// ─── Settings.json Generator ────────────────────────────────

function generateSettings(scan) {
  const permissions = [
    'Bash(grep:*)',
    'Bash(find:*)',
    'Bash(git status:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(git branch:*)',
    'Bash(cat:*)',
    'Bash(ls:*)',
    'Bash(wc:*)',
    'Bash(head:*)',
    'Bash(tail:*)',
    'Read(*)',
    'WebFetch(domain:api.github.com)',
    'WebFetch(domain:github.com)',
    'mcp__context7__*',
    'mcp__playwright__*',
  ];

  // Stack-specific permissions
  if (scan.languages.includes('TypeScript') || scan.languages.includes('JavaScript')) {
    const pm = scan.packageManager || 'npm';
    permissions.push(`Bash(${pm} run lint:*)`, `Bash(${pm} run build:*)`, `Bash(${pm} run test:*)`);
    if (scan.formatting.includes('Prettier')) permissions.push('Bash(npx prettier:*)');
    if (scan.linting.includes('ESLint')) permissions.push('Bash(npx eslint:*)');
    if (scan.linting.includes('Biome')) permissions.push('Bash(npx biome:*)');
  }
  if (scan.languages.includes('Dart')) {
    permissions.push('Bash(flutter analyze:*)', 'Bash(dart format:*)', 'Bash(dart run build_runner:*)', 'Bash(flutter pub get:*)', 'Bash(flutter test:*)');
  }
  if (scan.languages.includes('Python')) {
    if (scan.linting.includes('Ruff')) permissions.push('Bash(ruff:*)');
    if (scan.formatting.includes('Black')) permissions.push('Bash(black:*)');
    if (scan.testing.includes('pytest')) permissions.push('Bash(pytest:*)');
  }
  if (scan.languages.includes('Go')) {
    permissions.push('Bash(go build:*)', 'Bash(go test:*)', 'Bash(golangci-lint:*)');
  }
  if (scan.languages.includes('Rust')) {
    permissions.push('Bash(cargo build:*)', 'Bash(cargo test:*)', 'Bash(cargo clippy:*)', 'Bash(cargo fmt:*)');
  }

  const settings = {
    permissions: { allow: permissions },
    mcpServers: {
      context7: {
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp@latest'],
      },
      playwright: {
        command: 'npx',
        args: ['-y', '@anthropic-ai/mcp-server-playwright'],
      },
    },
    hooks: {
      PostToolUse: [
        {
          matcher: 'Write|Edit',
          hooks: [
            {
              type: 'command',
              command: "echo '[TeamAI] File modified — remember to run standards check before committing'",
            },
          ],
        },
      ],
    },
  };

  return JSON.stringify(settings, null, 2);
}

// ─── Smart Copier ───────────────────────────────────────────

function copyFile(src, dest, label) {
  if (fs.existsSync(dest)) {
    console.log(`    ~ ${label} (exists — preserved)`);
    return false;
  }
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`    + ${label}`);
  return true;
}

function copyDir(srcDir, destDir, label) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  let added = 0;
  let skipped = 0;
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const dest = path.join(destDir, file);
    if (fs.existsSync(dest)) {
      skipped++;
    } else {
      fs.copyFileSync(path.join(srcDir, file), dest);
      added++;
    }
  }
  console.log(`    + ${label}: ${added} added, ${skipped} preserved`);
}

// Recursively copy a directory tree (used for skills, which have subfolders
// like references/ that the flat, .md-only copyDir can't carry).
function copyTree(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Copy each skill directory whole (SKILL.md + any subfolders). Skip a skill the
// project already has, so local customizations are preserved — mirrors setup.sh.
function copySkills(srcDir, destDir, label) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  let added = 0;
  let skipped = 0;
  const skills = fs
    .readdirSync(srcDir, { withFileTypes: true })
    .filter(e => e.isDirectory());
  for (const skill of skills) {
    const dest = path.join(destDir, skill.name);
    if (fs.existsSync(dest)) {
      skipped++;
    } else {
      copyTree(path.join(srcDir, skill.name), dest);
      added++;
    }
  }
  console.log(`    + ${label}: ${added} added, ${skipped} preserved`);
}

// ─── Main Init ──────────────────────────────────────────────

function init(targetDir) {
  console.log('');
  console.log('  ╔════════════════════════════════════╗');
  console.log('  ║       TeamAI — Smart Init          ║');
  console.log('  ╚════════════════════════════════════╝');
  console.log('');

  // ── Phase 1: Scan ──
  console.log('  [1/6] Scanning project...');
  const scan = scanProject(targetDir);

  console.log('');
  console.log(`    Project:     ${scan.name}`);
  console.log(`    Path:        ${scan.path}`);
  console.log(`    Languages:   ${scan.languages.join(', ') || 'none detected'}`);
  console.log(`    Frameworks:  ${scan.frameworks.join(', ') || 'none detected'}`);
  console.log(`    Styling:     ${scan.styling.join(', ') || 'none detected'}`);
  console.log(`    Testing:     ${scan.testing.join(', ') || 'none detected'}`);
  console.log(`    Linting:     ${scan.linting.join(', ') || 'none detected'}`);
  console.log(`    Formatting:  ${scan.formatting.join(', ') || 'none detected'}`);
  console.log(`    Pkg Manager: ${scan.packageManager || 'none detected'}`);
  console.log(`    CI/CD:       ${scan.hasCI || 'none detected'}`);
  console.log(`    Docker:      ${scan.hasDocker ? 'yes' : 'no'}`);
  console.log(`    Git repo:    ${scan.isGitRepo ? 'yes' : 'no'}`);
  console.log('');

  if (scan.existing.claudeDir) {
    console.log('    Existing .claude/ found — will merge (your files preserved)');
  }
  if (scan.existing.claudeMd) {
    console.log('    Existing CLAUDE.md found — will preserve yours');
  }
  console.log('');

  // ── Phase 2: Generate customized configs ──
  console.log('  [2/6] Generating customized configuration...');

  // CLAUDE.md
  if (!scan.existing.claudeMd) {
    const claudeMd = generateClaudeMd(scan);
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), claudeMd);
    console.log('    + CLAUDE.md (auto-filled with detected stack)');
  } else {
    console.log('    ~ CLAUDE.md (exists — preserved)');
  }

  // settings.json
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  if (!scan.existing.settings) {
    const settings = generateSettings(scan);
    fs.mkdirSync(path.join(targetDir, '.claude'), { recursive: true });
    fs.writeFileSync(settingsPath, settings);
    console.log('    + .claude/settings.json (customized for your stack)');
  } else {
    // Merge MCP servers into existing settings
    try {
      const existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      let updated = false;
      if (!existing.mcpServers) existing.mcpServers = {};
      if (!existing.mcpServers.context7) {
        existing.mcpServers.context7 = { command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] };
        updated = true;
      }
      if (!existing.mcpServers.playwright) {
        existing.mcpServers.playwright = { command: 'npx', args: ['-y', '@anthropic-ai/mcp-server-playwright'] };
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));
        console.log('    ~ .claude/settings.json (merged — added missing MCPs)');
      } else {
        console.log('    ~ .claude/settings.json (exists — all MCPs present)');
      }
    } catch {
      console.log('    ~ .claude/settings.json (exists — could not merge, check manually)');
    }
  }

  // ── Phase 3: Copy commands, agents, rules ──
  console.log('');
  console.log('  [3/6] Installing commands, agents, rules, and skills...');

  copyDir(path.join(PLUGIN_DIR, '.claude', 'commands'), path.join(targetDir, '.claude', 'commands'), 'commands');
  copyDir(path.join(PLUGIN_DIR, '.claude', 'agents'), path.join(targetDir, '.claude', 'agents'), 'agents');
  copyDir(path.join(PLUGIN_DIR, '.claude', 'rules'), path.join(targetDir, '.claude', 'rules'), 'rules');
  copySkills(path.join(PLUGIN_DIR, '.claude', 'skills'), path.join(targetDir, '.claude', 'skills'), 'skills');

  // Style guide
  copyFile(
    path.join(PLUGIN_DIR, 'standards', 'style-guide.md'),
    path.join(targetDir, 'standards', 'style-guide.md'),
    'standards/style-guide.md'
  );

  // CodeRabbit config
  copyFile(
    path.join(PLUGIN_DIR, '.coderabbit.yaml'),
    path.join(targetDir, '.coderabbit.yaml'),
    '.coderabbit.yaml'
  );

  // ── Phase 4: Git hooks ──
  console.log('');
  console.log('  [4/6] Setting up git hooks...');

  if (!scan.isGitRepo) {
    console.log('    Not a git repository. Initializing...');
    try {
      execSync('git init', { cwd: targetDir, stdio: 'pipe' });
      console.log('    + git init');
    } catch {
      console.log('    ⚠️  Failed to init git — install hook manually later');
    }
  }

  if (fs.existsSync(path.join(targetDir, '.git'))) {
    const hookDest = path.join(targetDir, '.git', 'hooks', 'pre-commit');
    const hookSrc = path.join(PLUGIN_DIR, 'hooks', 'pre-commit');
    fs.mkdirSync(path.join(targetDir, '.git', 'hooks'), { recursive: true });
    if (fs.existsSync(hookDest)) {
      // Never clobber an existing hook — save ours alongside for the user to merge.
      const sample = `${hookDest}.teamai`;
      fs.copyFileSync(hookSrc, sample);
      fs.chmodSync(sample, '755');
      console.log('    ~ .git/hooks/pre-commit (exists — preserved)');
      console.log('      TeamAI hook saved as pre-commit.teamai — merge if you want it');
    } else {
      fs.copyFileSync(hookSrc, hookDest);
      fs.chmodSync(hookDest, '755');
      console.log('    + .git/hooks/pre-commit');
    }
  }

  // .gitignore additions
  if (scan.existing.gitignore) {
    const gitignore = fs.readFileSync(path.join(targetDir, '.gitignore'), 'utf8');
    const additions = [];
    if (!gitignore.includes('.claude/settings.local.json')) additions.push('.claude/settings.local.json');
    if (!gitignore.includes('.env') && !gitignore.match(/^\.env$/m)) additions.push('.env');
    if (additions.length) {
      fs.appendFileSync(path.join(targetDir, '.gitignore'), '\n# TeamAI\n' + additions.join('\n') + '\n');
      console.log(`    + .gitignore (added: ${additions.join(', ')})`);
    }
  }

  // ── Phase 5: OpenSpec ──
  console.log('');
  console.log('  [5/6] Setting up OpenSpec...');

  let hasOpenSpec = false;
  try {
    execSync('openspec --version', { stdio: 'pipe' });
    hasOpenSpec = true;
  } catch {}

  if (!hasOpenSpec) {
    console.log('    Installing OpenSpec...');
    try {
      execSync('npm install -g @fission-ai/openspec@latest', { stdio: 'pipe' });
      hasOpenSpec = true;
      console.log('    + OpenSpec installed globally');
    } catch {
      console.log('    ⚠️  Failed to install OpenSpec — install manually: npm i -g @fission-ai/openspec@latest');
    }
  } else {
    console.log('    ✅ OpenSpec already installed');
  }

  if (hasOpenSpec && !scan.existing.openspec) {
    console.log('    Initializing OpenSpec in project...');
    try {
      execSync('openspec init', { cwd: targetDir, stdio: 'pipe' });
      console.log('    + openspec/ initialized');
      try {
        execSync('openspec update', { cwd: targetDir, stdio: 'pipe' });
        console.log('    + /opsx:* commands registered');
      } catch {}
    } catch {
      console.log('    ⚠️  openspec init needs interactive input — run manually: openspec init');
    }
  } else if (scan.existing.openspec) {
    console.log('    ✅ OpenSpec already initialized');
  }

  // ── Phase 6: Summary ──
  console.log('');
  console.log('  [6/6] Done!');
  console.log('');
  console.log('  ╔════════════════════════════════════════════════════════╗');
  console.log('  ║  ✅ TeamAI initialized!                               ║');
  console.log('  ╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Detected: ${scan.detectedStack}`);
  console.log('');
  console.log('  Installed:');
  console.log('    ✅ 6 commands     (/project:TeamAI:CodeReview, PRReady, etc.)');
  console.log('    ✅ 6 agents       (backend, frontend, planning, security, pr-review, standards)');
  console.log('    ✅ 3 rules        (code-quality, security, agent-orchestration)');
  console.log('    ✅ MCP servers    (Context7, Playwright — auto-download on launch)');
  console.log('    ✅ Pre-commit     (secrets scan, lint, format, build)');
  console.log('    ✅ Style guide    (standards/style-guide.md)');
  console.log('    ✅ CodeRabbit     (.coderabbit.yaml)');
  console.log(`    ${hasOpenSpec && !scan.existing.openspec ? '✅' : '🟡'} OpenSpec       ${hasOpenSpec ? '(installed)' : '(install manually)'}`);
  console.log('');
  console.log('  Next steps:');
  console.log('    1. Edit CLAUDE.md — fill in the TODO sections (project overview, architecture, conventions)');
  console.log('    2. Open Claude Code and try: /project:TeamAI:CodeReview');
  console.log('    3. Run: teamai doctor  — to verify everything');
  console.log('');
}

module.exports = { init, scanProject };

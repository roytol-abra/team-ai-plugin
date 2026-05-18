#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const VERSION = '1.0.0';
const PLUGIN_DIR = path.resolve(__dirname, '..');

const HELP = `
  teamai v${VERSION} — Claude Code plugin for dev teams

  Usage:
    teamai init [path]          Scan project, detect stack, and install only what's needed (recommended)
    teamai install [path]       Full install — copies all files without scanning
    teamai update [path]        Update an existing installation (re-copies, preserves customizations)
    teamai doctor [path]        Check installation health and integration status
    teamai --version            Show version
    teamai --help               Show this help

  Examples:
    teamai init                 Smart init into current directory
    teamai init ./my-app        Smart init into ./my-app
    npx teamai-plugin init      Run without global install

  init vs install:
    init    Scans your project first — detects language, framework, linter, formatter,
            CI/CD, and generates a CLAUDE.md pre-filled with your stack. Customizes
            settings.json permissions for your specific tools. Recommended for new setups.
    install Copies everything as-is without scanning. Use when you want the raw template.

  After setup:
    Open Claude Code and run /project:TeamAI:CodeReview
`;

const LOGO = `
  ╔════════════════════════════════════╗
  ║         TeamAI Plugin v${VERSION}        ║
  ╚════════════════════════════════════╝
`;

function resolveTarget(args) {
  const pathArg = args.find(a => !a.startsWith('-'));
  const target = pathArg || '.';
  try {
    return fs.realpathSync(target);
  } catch {
    console.error(`  ❌ Directory not found: ${target}`);
    process.exit(1);
  }
}

function runSetup(targetDir, mode) {
  const setupScript = path.join(PLUGIN_DIR, 'setup.sh');

  if (!fs.existsSync(setupScript)) {
    console.error('  ❌ setup.sh not found. Plugin installation may be corrupted.');
    console.error(`     Expected at: ${setupScript}`);
    process.exit(1);
  }

  const env = { ...process.env };
  if (mode === 'update') {
    env.TEAMAI_UPDATE = '1';
  }

  const result = spawn('bash', [setupScript, targetDir], {
    stdio: 'inherit',
    env
  });

  result.on('close', (code) => {
    process.exit(code || 0);
  });
}

function doctor(targetDir) {
  console.log(LOGO);
  console.log(`  Checking: ${targetDir}\n`);

  const checks = [
    { name: '.claude/commands/', check: () => fs.existsSync(path.join(targetDir, '.claude', 'commands')) },
    { name: '.claude/agents/', check: () => fs.existsSync(path.join(targetDir, '.claude', 'agents')) },
    { name: '.claude/rules/', check: () => fs.existsSync(path.join(targetDir, '.claude', 'rules')) },
    { name: '.claude/settings.json', check: () => fs.existsSync(path.join(targetDir, '.claude', 'settings.json')) },
    { name: 'CLAUDE.md', check: () => fs.existsSync(path.join(targetDir, 'CLAUDE.md')) },
    { name: 'standards/style-guide.md', check: () => fs.existsSync(path.join(targetDir, 'standards', 'style-guide.md')) },
    { name: '.coderabbit.yaml', check: () => fs.existsSync(path.join(targetDir, '.coderabbit.yaml')) },
    { name: '.git/hooks/pre-commit', check: () => fs.existsSync(path.join(targetDir, '.git', 'hooks', 'pre-commit')) },
  ];

  const integrations = [
    {
      name: 'Node.js (>= 20)',
      check: () => {
        try {
          const v = execSync('node -v', { encoding: 'utf8' }).trim();
          const major = parseInt(v.replace('v', '').split('.')[0]);
          return major >= 20 ? `✅ ${v}` : `⚠️  ${v} (v20+ recommended)`;
        } catch { return '❌ Not installed'; }
      }
    },
    {
      name: 'OpenSpec',
      check: () => {
        try {
          execSync('openspec --version', { encoding: 'utf8', stdio: 'pipe' });
          const initialized = fs.existsSync(path.join(targetDir, 'openspec'));
          return initialized ? '✅ Installed + initialized' : '🟡 Installed (run: openspec init)';
        } catch { return '❌ Not installed (run: npm i -g @fission-ai/openspec@latest)'; }
      }
    },
    {
      name: 'Git',
      check: () => {
        try {
          const v = execSync('git --version', { encoding: 'utf8' }).trim().split(' ').pop();
          return `✅ ${v}`;
        } catch { return '❌ Not installed'; }
      }
    },
    {
      name: 'Context7 MCP',
      check: () => {
        try {
          const settings = JSON.parse(fs.readFileSync(path.join(targetDir, '.claude', 'settings.json'), 'utf8'));
          return settings.mcpServers?.context7 ? '✅ Configured (auto-downloads on launch)' : '❌ Not in settings.json';
        } catch { return '❌ settings.json not found'; }
      }
    },
    {
      name: 'Playwright MCP',
      check: () => {
        try {
          const settings = JSON.parse(fs.readFileSync(path.join(targetDir, '.claude', 'settings.json'), 'utf8'));
          return settings.mcpServers?.playwright ? '✅ Configured (auto-downloads on launch)' : '❌ Not in settings.json';
        } catch { return '❌ settings.json not found'; }
      }
    },
    {
      name: 'Figma MCP',
      check: () => '✅ Built-in to Claude Code (authenticate on first use)'
    },
    {
      name: 'Atlassian MCP',
      check: () => '✅ Built-in to Claude Code (authenticate on first use)'
    },
    {
      name: 'CodeRabbit',
      check: () => {
        return fs.existsSync(path.join(targetDir, '.coderabbit.yaml'))
          ? '🟡 Config present (install app: https://coderabbit.ai)'
          : '❌ .coderabbit.yaml missing';
      }
    }
  ];

  // Plugin files
  console.log('  Plugin Files:');
  let allPresent = true;
  for (const { name, check } of checks) {
    const ok = check();
    console.log(`    ${ok ? '✅' : '❌'} ${name}`);
    if (!ok) allPresent = false;
  }

  // Commands count
  const cmdsDir = path.join(targetDir, '.claude', 'commands');
  if (fs.existsSync(cmdsDir)) {
    const cmds = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md'));
    console.log(`    📋 ${cmds.length} commands installed`);
  }

  // Agents count
  const agentsDir = path.join(targetDir, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    console.log(`    🤖 ${agents.length} agents installed`);
  }

  // Integrations
  console.log('\n  Integrations:');
  for (const { name, check } of integrations) {
    console.log(`    ${check()} — ${name}`);
  }

  // Verdict
  console.log('');
  if (allPresent) {
    console.log('  ✅ TeamAI plugin is fully installed!');
    console.log('  Open Claude Code and run: /project:TeamAI:CodeReview');
  } else {
    console.log('  ⚠️  Some files are missing. Run: teamai install');
  }
  console.log('');
}

// --- Main ---

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  console.log(HELP);
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log(VERSION);
  process.exit(0);
}

const remainingArgs = args.slice(1);

switch (command) {
  case 'init': {
    const { init } = require('./init');
    init(resolveTarget(remainingArgs));
    break;
  }

  case 'install':
    runSetup(resolveTarget(remainingArgs), 'install');
    break;

  case 'update':
    runSetup(resolveTarget(remainingArgs), 'update');
    break;

  case 'doctor':
    doctor(resolveTarget(remainingArgs));
    break;

  default:
    console.error(`  Unknown command: ${command}`);
    console.log(HELP);
    process.exit(1);
}

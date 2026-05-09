#!/usr/bin/env node
/**
 * SessionStart hook.
 * Prints a compact orientation block when a session starts:
 *   - Page Objects currently in pages/
 *   - Test files in tests/ (capped at 15 entries)
 *   - Last 3 git commits
 *   - Whether .env exists (for auth-dependent tests)
 *   - Whether node_modules exists
 *
 * Output goes into Claude's initial context so it has fast project orientation.
 *
 * Wired in .claude/settings.json under hooks.SessionStart.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const lines = [];
lines.push('=== Project context (SessionStart hook) ===');

// Page Objects
const pagesDir = path.join(projectRoot, 'pages');
if (fs.existsSync(pagesDir)) {
  const poms = fs
    .readdirSync(pagesDir)
    .filter((f) => /\.(page|component)\.ts$/.test(f))
    .sort();
  lines.push('');
  lines.push(`Page Objects (pages/): ${poms.length}`);
  if (poms.length === 0) {
    lines.push('  (none yet — invoke page-object-builder to create one)');
  } else {
    poms.forEach((p) => lines.push(`  • ${p}`));
  }
}

// Test files
const testsDir = path.join(projectRoot, 'tests');
if (fs.existsSync(testsDir)) {
  const findSpecs = (dir, acc = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) findSpecs(full, acc);
      else if (entry.name.endsWith('.spec.ts')) acc.push(full);
    }
    return acc;
  };
  const specs = findSpecs(testsDir).map((f) => path.relative(projectRoot, f).replace(/\\/g, '/'));
  lines.push('');
  lines.push(`Test files (tests/): ${specs.length}`);
  if (specs.length === 0) {
    lines.push('  (none yet)');
  } else {
    specs.slice(0, 15).forEach((s) => lines.push(`  • ${s}`));
    if (specs.length > 15) lines.push(`  … and ${specs.length - 15} more`);
  }
}

// Recent commits
try {
  const log = execSync('git log -3 --oneline', {
    cwd: projectRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (log) {
    lines.push('');
    lines.push('Recent commits:');
    log.split('\n').forEach((l) => lines.push(`  • ${l}`));
  }
} catch {}

// Environment readiness flags
const envExists = fs.existsSync(path.join(projectRoot, '.env'));
const nodeModulesExists = fs.existsSync(path.join(projectRoot, 'node_modules'));
lines.push('');
lines.push('Environment:');
lines.push(`  • .env present:      ${envExists ? 'yes' : 'NO  (auth-dependent tests will fail until created)'}`);
lines.push(`  • node_modules:      ${nodeModulesExists ? 'present' : 'MISSING  (run `npm install`)'}`);

lines.push('');
lines.push('=== End project context ===');

process.stdout.write(lines.join('\n') + '\n');
process.exit(0);

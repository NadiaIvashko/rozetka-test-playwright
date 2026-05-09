#!/usr/bin/env node
/**
 * Stop hook.
 * If the working tree has any uncommitted *.ts changes (especially *.spec.ts),
 * print a reminder for the user to run typecheck and exercise the changed tests
 * locally before committing.
 *
 * Non-blocking: always exits 0. Output is shown to Claude/user as the session ends.
 *
 * Wired in .claude/settings.json under hooks.Stop.
 */

const { execSync } = require('child_process');

const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let modified;
try {
  const out = execSync('git status --porcelain', {
    cwd: projectRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  modified = out
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter((p) => p.length > 0);
} catch {
  // Not a git repo, or git unavailable — no reminder.
  process.exit(0);
}

const tsFiles = modified.filter((f) => /\.(ts|tsx)$/.test(f));
if (tsFiles.length === 0) {
  process.exit(0);
}

const specs = tsFiles.filter((f) => /\.spec\.ts$/.test(f));
const poms = tsFiles.filter((f) => f.startsWith('pages/') && f.endsWith('.ts'));

let msg = `\n📋 Session reminder — TypeScript files modified in this session:\n`;
tsFiles.forEach((f) => (msg += `  • ${f}\n`));

msg += `\nBefore committing, run locally:\n`;
msg += `  • npm run typecheck\n`;

if (specs.length > 0) {
  msg += `  • Run the affected test(s):\n`;
  specs.forEach((f) => (msg += `      npx playwright test ${f} --project=chromium\n`));
} else if (poms.length > 0) {
  msg += `  • At least one test that exercises the modified Page Object(s)\n`;
}

msg += `\nThen review with \`git diff\` and commit yourself — Claude is forbidden from git writes (see CLAUDE.md).\n`;

process.stdout.write(msg);
process.exit(0);

#!/usr/bin/env node
/**
 * PreToolUse hook for Bash.
 * Blocks `npx playwright codegen` and `npm run codegen` because Codegen opens
 * an interactive browser window — undesirable as a side-effect of an
 * autonomous Claude session. The user can still run codegen herself in her
 * own terminal.
 *
 * Wired in .claude/settings.json under hooks.PreToolUse for matcher "Bash".
 */

const fs = require('fs');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const command = (input && input.tool_input && input.tool_input.command) || '';

const isCodegen =
  /\bplaywright\s+codegen\b/.test(command) ||
  /\bnpm\s+run\s+codegen\b/.test(command) ||
  /\bnpx\s+playwright\s+codegen\b/.test(command);

if (isCodegen) {
  const reason =
    `Blocked: Playwright Codegen opens an interactive browser window — not safe as an autonomous side-effect.\n` +
    `If you want to record a test, the user should run \`npm run codegen\` in her own terminal, ` +
    `then paste the recorded code here so you can refactor it through a POM.\n`;
  process.stderr.write(reason);
  process.exit(2);
}

process.exit(0);

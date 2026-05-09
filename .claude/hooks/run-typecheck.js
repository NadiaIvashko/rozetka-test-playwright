#!/usr/bin/env node
/**
 * PostToolUse hook for Edit / Write / MultiEdit.
 * If the touched file is a TypeScript file in the project, runs `tsc --noEmit`
 * and surfaces the output to Claude (via stdout) so type errors are caught
 * immediately in the same turn that introduced them.
 *
 * Non-blocking: always exits 0. The output appears in tool result context.
 *
 * Wired in .claude/settings.json under hooks.PostToolUse for matcher "Edit|Write|MultiEdit".
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const filePath = (input && input.tool_input && input.tool_input.file_path) || '';
if (!/\.(ts|tsx)$/.test(filePath)) {
  process.exit(0);
}

const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Skip if dependencies not installed yet.
const tscPath = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
if (!fs.existsSync(tscPath)) {
  process.stdout.write(
    `[run-typecheck] node_modules/typescript not found — skipping. ` +
    `Run \`npm install\` to enable automatic typecheck after edits.\n`
  );
  process.exit(0);
}

try {
  execSync('node node_modules/typescript/bin/tsc --noEmit', {
    cwd: projectRoot,
    stdio: 'pipe',
    timeout: 60_000,
  });
  process.stdout.write(`[run-typecheck] OK — tsc --noEmit passed for ${path.basename(filePath)}\n`);
  process.exit(0);
} catch (err) {
  const stdout = (err.stdout && err.stdout.toString()) || '';
  const stderr = (err.stderr && err.stderr.toString()) || '';
  const output = (stdout + stderr).trim() || err.message;
  process.stdout.write(
    `[run-typecheck] FAILED — tsc --noEmit reported errors after editing ${path.basename(filePath)}:\n` +
    output + '\n' +
    `\nFix the type errors before continuing.\n`
  );
  // Exit 0 — we want Claude to see the message and react, not have the harness abort the run.
  process.exit(0);
}

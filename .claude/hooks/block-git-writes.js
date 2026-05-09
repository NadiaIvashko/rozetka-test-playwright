#!/usr/bin/env node
/**
 * PreToolUse hook for Bash.
 * Blocks any git/gh command that mutates repo state, per CLAUDE.md policy.
 * Read-only git/gh commands (status, diff, log, show, blame, pr view, pr list) are allowed.
 *
 * Wired in .claude/settings.json under hooks.PreToolUse for matcher "Bash".
 */

const fs = require('fs');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf-8'));
} catch {
  // No JSON on stdin — let the tool through.
  process.exit(0);
}

const command = (input && input.tool_input && input.tool_input.command) || '';

const blockedPatterns = [
  { re: /\bgit\s+add\b/, label: 'git add' },
  { re: /\bgit\s+commit\b/, label: 'git commit' },
  { re: /\bgit\s+push\b/, label: 'git push' },
  { re: /\bgit\s+pull\b/, label: 'git pull' },
  { re: /\bgit\s+fetch\b/, label: 'git fetch' },
  { re: /\bgit\s+merge\b/, label: 'git merge' },
  { re: /\bgit\s+rebase\b/, label: 'git rebase' },
  { re: /\bgit\s+reset\b/, label: 'git reset' },
  { re: /\bgit\s+restore\b/, label: 'git restore' },
  { re: /\bgit\s+stash\s+(?!list|show)/, label: 'git stash (mutating)' },
  { re: /\bgit\s+checkout\s+(-b|--track|[^-\s])/, label: 'git checkout (branch switch / new branch)' },
  { re: /\bgit\s+switch\b/, label: 'git switch' },
  { re: /\bgit\s+branch\s+-[dD]\b/, label: 'git branch -d/-D' },
  { re: /\bgit\s+worktree\s+add\b/, label: 'git worktree add' },
  { re: /\bgit\s+worktree\s+remove\b/, label: 'git worktree remove' },
  { re: /\bgit\s+tag\b/, label: 'git tag' },
  { re: /\bgit\s+clean\b/, label: 'git clean' },
  { re: /\bgh\s+pr\s+create\b/, label: 'gh pr create' },
  { re: /\bgh\s+pr\s+merge\b/, label: 'gh pr merge' },
  { re: /\bgh\s+pr\s+close\b/, label: 'gh pr close' },
  { re: /\bgh\s+repo\s+(create|delete|fork|edit)\b/, label: 'gh repo create/delete/fork/edit' },
  { re: /\bgh\s+release\s+(create|delete|edit|upload)\b/, label: 'gh release (mutating)' },
];

const hit = blockedPatterns.find(({ re }) => re.test(command));

if (hit) {
  const reason =
    `Blocked by project policy: \`${hit.label}\` is a forbidden git/gh write operation ` +
    `(see CLAUDE.md → Working rules → Git).\n\n` +
    `Print the command to chat for the user to run manually instead.\n` +
    `Allowed read-only ops: git status, git diff, git log, git show, git blame, gh pr view, gh pr list.`;

  // Exit code 2 with stderr is the documented way to deny a tool call in PreToolUse.
  process.stderr.write(reason + '\n');
  process.exit(2);
}

process.exit(0);

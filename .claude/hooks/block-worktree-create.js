#!/usr/bin/env node
/**
 * WorktreeCreate hook.
 * Hard-blocks the harness from auto-creating a git worktree for new sessions.
 *
 * Per CLAUDE.md project policy, this project never uses worktrees — the user
 * works directly in D:\Projects\Nadin\ and finds worktrees confusing
 * (duplicated tree, project context not auto-loaded inside the worktree).
 *
 * Wired in .claude/settings.json under hooks.WorktreeCreate.
 */

const reason =
  'Worktree creation blocked by project policy (see CLAUDE.md → Working rules → Worktrees). ' +
  'This project always operates directly on D:\\Projects\\Nadin\\. ' +
  'If you really need a worktree for an isolated experiment, ask the user explicitly first.';

process.stderr.write(reason + '\n');
process.exit(2);

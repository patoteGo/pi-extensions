# Plan: PI extension HUD for Git status

## Context
Build a Pie (`pi.dev`) extension that shows a bottom HUD/footer for the current working directory. The HUD should display:
- current Git branch
- staged file count
- unstaged file count
- untracked file count

Desired display format:
- ` main • 1 staged • 2 unstaged • 4 untracked`

The user wants this to update on relevant changes only, such as folder/session changes and Git-changing actions like commits/branch switches, rather than a fixed polling loop.

## Approach
This repo is empty, so implement this as a new project-local Pie extension package.

Recommended implementation:
- create a project-local extension under `.pi/extensions/` or as a package directory with `index.ts`
- use `ctx.ui.setFooter()` for a true bottom HUD/footer rather than a widget above/below the editor
- use `ctx.cwd` as the active folder/workspace source
- read Git state with `pi.exec("git", [...], { cwd: ctx.cwd })`, preferring `git status --porcelain=2 --branch` so one command yields branch and file-state information
- parse porcelain output into counts for `staged`, `unstaged`, and `untracked`
- render a compact footer line, using ` branch • clean` for a clean repo and a non-git fallback when `cwd` is outside a repository
- refresh only on relevant signals:
  - `session_start` / reload / session switch (new cwd)
  - Git-related tool completions that may change status, especially `bash`, `write`, and `edit`
  - optional lightweight `.git` watchers for `HEAD`, `index`, and refs if needed for out-of-band Git changes

The simplest reliable version is event-driven first, with targeted Git file watchers added only if needed to catch external commits/branch switches while Pi is idle.

## Files to modify
Expected new files in this currently empty repo:
- `.pi/extensions/git-hud/index.ts` — extension entrypoint
- `.pi/extensions/git-hud/package.json` — optional, only if local package metadata/deps are needed
- `README.md` — usage/install notes for loading the extension in Pie

Optional helper split if the extension grows:
- `.pi/extensions/git-hud/git-status.ts` — Git status parsing/helper logic
- `.pi/extensions/git-hud/footer.ts` — footer renderer

## Reuse
External Pie code/examples to reuse as implementation references:
- `packages/coding-agent/docs/extensions.md`
  - confirms `ctx.ui.setFooter()`, `ctx.ui.setStatus()`, `ctx.cwd`, and event hooks
- `packages/coding-agent/examples/extensions/custom-footer.ts`
  - reference for custom bottom footer rendering with `ctx.ui.setFooter()`
- `packages/coding-agent/examples/extensions/status-line.ts`
  - reference for simple footer/status updates via `ctx.ui.setStatus()`
- `packages/coding-agent/examples/extensions/dirty-repo-guard.ts`
  - reference for invoking Git from extensions with `pi.exec()`
- `packages/coding-agent/src/core/footer-data-provider.ts`
  - reference pattern for efficient Git branch watching (`HEAD`, reftable) and cwd changes

No reusable local project code exists yet; the current repo contains only `PLAN.md`.

## Steps
- [ ] Create the extension scaffold in `.pi/extensions/git-hud/` with `index.ts` as the entrypoint.
- [ ] On `session_start`, capture `ctx.cwd`, install the custom footer with `ctx.ui.setFooter()`, and trigger an initial Git status read.
- [ ] Implement a Git status helper using `pi.exec("git", ["status", "--porcelain=2", "--branch"], { cwd: ctx.cwd })`.
- [ ] Parse porcelain output into:
  - branch name
  - staged file count
  - unstaged file count
  - untracked file count
  - non-git / detached / clean fallbacks
- [ ] Render the footer HUD in the requested format: ` branch • N staged • N unstaged • N untracked`.
- [ ] Refresh the cached Git state after relevant events, starting with `session_start`, `tool_result` for `bash`/`write`/`edit`, and `turn_end` as a conservative fallback.
- [ ] If event-driven refresh misses idle external changes, add lightweight `.git` watchers modeled after `footer-data-provider.ts` for `HEAD`, refs, and `index`, then re-render on change.
- [ ] Add README usage notes showing where to place the extension and how to load/reload it in Pie.

## Verification
Manual verification in Pie:
- load the extension from `.pi/extensions/` and confirm the footer appears at startup
- open Pi in a Git repo on a named branch and confirm the branch matches `git branch --show-current`
- confirm a clean repo renders ` branch • clean`
- modify a tracked file without staging and confirm the `unstaged` count increments
- stage a file and confirm the `staged` count increments and `unstaged` decreases as appropriate
- create an untracked file and confirm the `untracked` count increments
- commit or switch branches and confirm the HUD updates
- switch/start a session in a different folder and confirm the footer rebinds to the new cwd
- open Pi outside a Git repo and confirm the footer degrades gracefully without errors

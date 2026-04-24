# pi-git-hud

Human guide for the `git-hud` Pi extension package.

## What it does

Adds a colorized Git HUD to Pi's bottom footer.

Example:

```text
 main • ✚ 1 staged • ● 2 unstaged • … 4 untracked
```

Clean repo example:

```text
 main • clean
```

Narrow terminal example:

```text
 main • ✚1 • ●2 • …4
```

## Install

### From this repo

```bash
pi install ./git-hud
```

### Direct run

```bash
pi -e ./git-hud
```

### In this repo via auto-load

This repository exposes the extension at:

```text
.pi/extensions/git-hud/index.ts
```

Start Pi in this repo and reload if needed:

```text
/reload
```

## When to use it

Use `git-hud` when you want Git branch and file-state info visible in Pi's footer while you work.

## Behavior

The HUD refreshes on:
- session start/reload
- relevant tool results (`bash`, `write`, `edit`)
- turn end
- Git metadata changes (`HEAD`, refs, index)

## Package files

- `index.ts` — extension implementation
- `package.json` — Pi package metadata
- `PLAN.md` — package-specific plan
- `AGENTS.md` — guidance for coding agents

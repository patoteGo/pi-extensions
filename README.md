# Pi extensions workspace

This repository contains reusable Pi extension packages plus project-local auto-load entrypoints for using them directly in this repo.

## For humans

Use this repo when you want to:
- develop a Pi extension as a reusable package
- auto-load that same extension locally through `.pi/extensions/`
- keep extension-specific docs and plans next to each package

Packages in this repo:
- `git-hud/` — Git status footer HUD
- `context-workflow/` — automated write → test → review → fix workflow

## Repo layout

```text
README.md
AGENTS.md
git-hud/
  README.md
  AGENTS.md
  PLAN.md
  index.ts
  package.json
context-workflow/
  README.md
  AGENTS.md
  index.ts
  package.json
.pi/extensions/
  git-hud/index.ts
  context-workflow/index.ts
```

## How to use in this repo

Start Pi from this repo:

```bash
pi
```

Then reload extensions if needed:

```text
/reload
```

The local entrypoints are:

```text
.pi/extensions/git-hud/index.ts
.pi/extensions/context-workflow/index.ts
```

These re-export the actual package implementations from:

```text
git-hud/index.ts
context-workflow/index.ts
```

## How to install as packages

```bash
pi install ./git-hud
pi install ./context-workflow
```

Or run directly:

```bash
pi -e ./git-hud
pi -e ./context-workflow
```

## Package quick guide

### `git-hud/`

Shows Git branch and working tree counts in Pi's footer.

Example:

```text
 main • ✚ 1 staged • ● 2 unstaged • … 4 untracked
```

### `context-workflow/`

Adds a guided workflow command set:

```text
/workflow [spec-or-description]
/workflow:status
/workflow:cancel
```

Useful for automated implementation with testing and review loops.

## Notes

- package-specific planning files belong inside the relevant package folder
- package-specific human docs live in that package's `README.md`
- package-specific LLM guidance lives in that package's `AGENTS.md`

# Contributing

Thanks for contributing.

## Repo model

This repository is a small multi-package workspace for Pi extensions.

Packages:
- `git-hud/`
- `context-workflow/`

Each package should remain:
- reusable as a standalone Pi package
- usable locally in this repo through `.pi/extensions/<name>/index.ts`

## Basic workflow

1. Make small, package-scoped changes.
2. Update docs in the package you changed.
3. If behavior or structure changed, update root docs too.
4. Run lightweight validation before committing.

## Validation

From repo root:

```bash
npm run pack:all
```

Or per package:

```bash
npm run pack:git-hud
npm run pack:context-workflow
```

If you are testing interactively in this repo:

```bash
pi
```

Then inside Pi:

```text
/reload
```

## Packaging rules

- keep implementation in `<package>/index.ts`
- keep `.pi/extensions/<name>/index.ts` as a thin re-export only
- keep Pi package metadata in each package `package.json`
- keep package docs near the package:
  - `README.md` for humans
  - `AGENTS.md` for coding agents
  - `PLAN.md` only when package-specific planning is useful

## Commits

Prefer clear, focused commit messages, for example:
- `Improve git-hud footer refresh behavior`
- `Add workflow docs for context-workflow`
- `Update root workspace docs`

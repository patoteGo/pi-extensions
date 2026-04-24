# AGENTS.md

Guidance for coding agents working on `git-hud`.

## Purpose

`git-hud` is a reusable Pi extension package that renders Git branch and working tree status in Pi's footer.

## Important files

- `index.ts` — package implementation
- `package.json` — Pi package manifest
- `README.md` — human usage docs
- `PLAN.md` — package-specific implementation plan/history

## Usage expectations

This package should work in two modes:
1. installed directly with `pi install ./git-hud`
2. re-exported by `.pi/extensions/git-hud/index.ts` for auto-loading in this repo

## Editing rules

1. Keep footer behavior focused on Git HUD concerns.
2. Preserve the reusable package shape.
3. Avoid moving implementation into `.pi/extensions/`; that location should stay a thin re-export.
4. Prefer small, isolated changes.
5. If footer rendering or refresh behavior changes, update `README.md`.

## Validation

Use lightweight checks when possible:
- `npm pack --dry-run ./git-hud`
- optionally test in Pi with `/reload`

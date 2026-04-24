# AGENTS.md

Guidance for coding agents working on `context-workflow`.

## Purpose

`context-workflow` is a reusable Pi extension package for an automated implementation workflow:
- write
- test
- review
- fix
- verify

It uses context compaction before review to reduce implementation bias.

## Important files

- `index.ts` — package implementation
- `package.json` — Pi package manifest
- `README.md` — human usage docs

## Usage expectations

This package should work in two modes:
1. installed directly with `pi install ./context-workflow`
2. re-exported by `.pi/extensions/context-workflow/index.ts` for auto-loading in this repo

## Editing rules

1. Keep the public command surface stable unless explicitly changing behavior:
   - `/workflow`
   - `/workflow:status`
   - `/workflow:cancel`
2. Preserve the workflow tools unless a coordinated refactor is needed.
3. Keep state persistence session-based.
4. Keep implementation in `context-workflow/index.ts`; the `.pi/extensions/` file should remain a re-export only.
5. Update `README.md` when command flow or behavior changes.

## Validation

Use lightweight checks when possible:
- `npm pack --dry-run ./context-workflow`
- optionally test in Pi with `/reload`

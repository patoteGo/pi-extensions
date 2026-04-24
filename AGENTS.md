# AGENTS.md

Repository guidance for humans and coding agents.

## Purpose

This repo contains reusable Pi extension packages plus project-local auto-load entrypoints.

Current packages:
- `git-hud/` — Git status footer extension
- `context-workflow/` — automated write/test/review/fix workflow extension

## Structure

- `README.md` — human overview for the whole repo
- `AGENTS.md` — LLM/agent guidance for the whole repo
- `git-hud/` — standalone installable Pi package
- `context-workflow/` — standalone installable Pi package
- `.pi/extensions/<name>/index.ts` — local re-export entrypoints for auto-loading in this repo

## Working rules

1. Keep changes small and package-scoped.
2. If a change affects only one extension, update docs only in that extension folder unless root docs also need a summary.
3. Keep package entrypoints reusable:
   - implementation lives in `<package>/index.ts`
   - `.pi/extensions/<name>/index.ts` should only re-export from the package
4. Prefer `typebox` imports for extension schemas unless the package already uses something else intentionally.
5. Preserve Pi package metadata in each `package.json`.
6. When behavior changes, update both:
   - the package `README.md` for humans
   - the package `AGENTS.md` for coding agents

## Validation

When modifying a package, prefer lightweight validation:
- `npm pack --dry-run ./git-hud`
- `npm pack --dry-run ./context-workflow`

For local usage in this repo:
- start `pi`
- run `/reload`

## Plans

Package-specific planning files should live inside the relevant package folder, not at repo root.
Current example:
- `git-hud/PLAN.md`

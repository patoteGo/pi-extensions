# Release and versioning notes

This repo contains independently versioned Pi packages.

## Current packages

- `pi-git-hud`
- `pi-context-workflow`

## Versioning approach

Use per-package semantic versioning.

### Patch bump
Use for:
- doc updates shipped with the package
- bug fixes
- internal refactors with no intended user-facing behavior change

Examples:
- fix footer refresh edge case
- improve workflow state restoration

### Minor bump
Use for:
- backwards-compatible new features
- new commands, new options, additional supported behavior

Examples:
- add a new workflow status detail
- add extra Git HUD display modes

### Major bump
Use for:
- breaking command changes
- renamed package behavior or removed features
- incompatible config or API changes

Examples:
- renaming `/workflow` commands
- changing package structure in a way that breaks installs or usage

## Package-specific notes

### `pi-git-hud`
Bump carefully when changing:
- footer rendering format
- refresh behavior
- package installation shape

Generally:
- formatting tweaks or docs only: patch
- new optional HUD features: minor
- breaking output or usage changes: major

### `pi-context-workflow`
Bump carefully when changing:
- command names
- workflow tool names
- workflow stage semantics
- expected user flow

Generally:
- review/test loop fixes or docs only: patch
- new backwards-compatible workflow capabilities: minor
- command/tool breaking changes: major

## Suggested release checklist

For the package you changed:

1. Update package docs if needed.
2. Update the package version in `package.json`.
3. Run:

```bash
npm pack --dry-run ./git-hud
npm pack --dry-run ./context-workflow
```

Or from root:

```bash
npm run pack:all
```

4. Commit with a clear message.
5. Tag if desired.
6. Push to remote.

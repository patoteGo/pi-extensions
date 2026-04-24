# pi-context-workflow

Human guide for the `context-workflow` Pi extension package.

## What it does

Automates a write → test → review → fix → verify workflow inside Pi.

Key idea:
- it compacts context before review so the model reviews with a cleaner slate

## Commands

```text
/workflow [spec-or-description]
/workflow:status
/workflow:cancel
```

Examples:

```text
/workflow spec.md
/workflow "Build a CRUD API with tests"
/workflow
```

## Install

### From this repo

```bash
pi install ./context-workflow
```

### Direct run

```bash
pi -e ./context-workflow
```

### In this repo via auto-load

This repository exposes the extension at:

```text
.pi/extensions/context-workflow/index.ts
```

Start Pi in this repo and reload if needed:

```text
/reload
```

## When to use it

Use `context-workflow` for larger implementation tasks where you want Pi to drive an iterative build/test/review loop.

## What it tracks

- current workflow stage
- iteration count
- test pass/fail via exit code
- review issues
- whether review context was compacted

## Package files

- `index.ts` — extension implementation
- `package.json` — Pi package metadata
- `AGENTS.md` — guidance for coding agents

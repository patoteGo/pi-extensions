# Development

This repo is a lightweight npm workspace for Pi extension packages.

## Workspace layout

```text
package.json
.gitignore
README.md
AGENTS.md
CONTRIBUTING.md
DEVELOPMENT.md
RELEASE.md
git-hud/
context-workflow/
.pi/extensions/
```

## Local development

### Install dependencies

There are currently no required root dependencies.

If a package later needs local dependencies, install them in that package unless they are intentionally shared workspace tooling.

### Validate package contents

```bash
npm run pack:all
```

This checks what each package would ship.

## Running in Pi locally

From this repo:

```bash
pi
```

Then reload resources:

```text
/reload
```

Local auto-load entrypoints:

```text
.pi/extensions/git-hud/index.ts
.pi/extensions/context-workflow/index.ts
```

These files should stay minimal and re-export from the package implementations.

## Package development conventions

### `git-hud`
- footer-focused extension
- keep rendering and refresh logic inside the package
- avoid leaking repo-specific assumptions into the implementation

### `context-workflow`
- command-driven workflow extension
- preserve command names unless intentionally changing public behavior
- keep workflow state persisted in-session

## Adding a new package

1. Create a new folder, e.g. `my-extension/`
2. Add:
   - `index.ts`
   - `package.json`
   - `README.md`
   - `AGENTS.md`
3. Add a local re-export at:
   - `.pi/extensions/my-extension/index.ts`
4. Add the package path to root `workspaces`
5. Validate with `npm pack --dry-run ./my-extension`

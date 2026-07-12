# Anko Conventions

Code-style and folder-structure rules for this repository, adapted from a portable convention set.
`CLAUDE.md` holds project topology, commands, and data-flow notes; this file holds the structural
rules. When they conflict, this file wins for structure, `CLAUDE.md` wins for project facts.

Paths beginning with `src/` in this document are relative to the desktop
workspace, `apps/desktop/`. New top-level applications belong in `apps/`; code
shared by multiple workspaces belongs in `packages/` and must expose a deliberate
package API.

## 1. Vocabulary

| Term | Meaning in Anko |
| --- | --- |
| context | A grouping folder that owns child modules: `src/components/{context}/` (e.g. `sidebar/`, `layout/`, `results/`), `src/stores/`, or a context inside a layer package (e.g. `repository/src/storage/`). |
| module | A folder with a public surface and an `index.ts` barrel. A **component module** has a `.tsx` at its root; a **logic module** does not. |
| `lib/` | A module's (or context's) internal implementation bucket: `hooks/`, `types.ts`, `constants.ts`, `values.ts`, `utils.ts` (+ `index.ts`). Private to the module/context. Distinct from the app-level `src/lib/`. |
| `hooks/` | Obligatory subfolder for module-local React hooks (`useThing.ts`), inside the module's `lib/`. |
| `src/hooks/` | App-level shared hooks context: hooks consumed by two or more feature contexts. |
| `src/lib/` | App-level shared utilities (pure helpers, RPC wrappers, bridges). |
| store | Zustand client-state coordination in `src/stores/{feature}/`. |
| barrel | An `index.ts` that only re-exports. |
| layer | A backend package under `packages/desktop/`: `domain` (data model), `repository` (IO), `service` (business logic), `api` (RPC composition). |

## 2. Modules & Scope

A module is a folder with a public surface plus an `index.ts` barrel. Internals live under
`lib/`: module-local hooks in `lib/hooks/`, declarations in `lib/types.ts` / `lib/constants.ts` /
`lib/values.ts`, pure helpers in `lib/utils.ts`.

### Module anatomy

A **component module** keeps the PascalCase `.tsx` (and nested sub-component folders) at the root;
internals nest under `lib/`:

```
components/{context}/{feature}/        # e.g. components/results/data-table/
  {Feature}.tsx                        # public artifact(s), PascalCase
  {feature}-{section}/                 # nested sub-components get their own module folders
  lib/                                 # internal implementation
    hooks/
      use{Feature}.ts                  # hooks ALWAYS live in a hooks/ subfolder
    types.ts                           # → types/ when many entries OR file > 300 lines
    constants.ts                       # UPPER_SNAKE_CASE exports; same promotion rule
    values.ts                          # static presets / label maps; same promotion rule
    utils.ts                           # pure helpers; same promotion rule
    index.ts                           # re-exports only
  index.ts                             # barrel: the module's ONLY public entry
```

A **logic module** (no component) places its category files at the module root — hooks in
`hooks/`, plus `types.ts` / `constants.ts` / `values.ts` / `utils.ts` — no `lib/` wrapper, since
the module itself is the implementation. A context's cross-module internals live in a
context-level `lib/` (e.g. `components/editor/lib/`).

A **store module** (`src/stores/{feature}/`):

```
stores/{feature}/
  {feature}-store.ts                   # useFeatureStore (Zustand)
  lib/types.ts                         # store state/actions types (+ lib/constants.ts)
  index.ts                             # barrel
```

### Rules

- **`hooks/` is an obligatory subfolder** for module-local hooks — even for one hook. It lives
  inside `lib/` in a component module, or at the root of a logic module. Hook files are named
  `useThing.ts` (camelCase, matching the repo idiom). Never mix hooks, utils, and types in one
  file.
- **Progressive disclosure** for `types`, `constants`, `values`, and `utils`: start as a single
  file; promote to a subfolder only when the category has **many entries OR a file exceeds 300
  lines**. Only `hooks/` is always a subfolder.
- **Barrel:** every module's `index.ts` re-exports only — no declarations or logic. Import a module
  through its barrel (`@/components/{context}/{module}`), never through its inner files or
  another module's `lib/`. Internals stay unexported.
- **No legacy shim files.** Single-line re-export files that exist only for old import paths
  (e.g. `components/editor/QueryEditor.tsx` → `./query-editor/QueryEditor`) must be removed and
  their importers updated to the module barrel.
- **No inline type declarations** in implementation files (`.tsx`, hooks, stores, handlers,
  `utils.ts`) beyond component-local `Props`. Shared or exported types live in the module's
  `lib/types.ts`; domain types in `@anko/desktop-domain`.
- **Constants** export as `UPPER_SNAKE_CASE` (e.g. `DEFAULT_PAGE_SIZE`, `SQL_KEYWORDS`).
- **`lib/` declaration files (`types`/`constants`/`values`) hold no JSX beyond static value/label
  elements and no side effects.**
- **`src/components/ui/` is exempt** from module anatomy: it is vendored shadcn/ui code, managed
  by the shadcn CLI. Do not restructure it; keep its files as generated.

### Scope ladder (narrowest → widest)

1. **module-internal** → the module's `lib/` (or the module root for a logic module)
2. **context reuse** → the context's `lib/` or a sibling logic module (e.g. `components/editor/lib/`)
3. **app-wide frontend** → `src/hooks/` (hooks), `src/lib/` (helpers), `src/stores/` (shared
   client state), `src/components/ui/` (primitives)
4. **cross-process / domain** → `@anko/desktop-domain` (`schemas/` for renderer↔worker types)

### Placement

A module's "internal area" = `lib/` for a component module, or the module root for a logic module.

| You have… | Put it in |
| --- | --- |
| a hook used by one module | the internal area's `hooks/useThing.ts` |
| a hook used by 2+ contexts | `src/hooks/useThing.ts` |
| a pure helper for one module | the internal area's `utils.ts` |
| a helper used by 2+ contexts | `src/lib/` |
| a type/interface/enum for one module | the internal area's `types.ts` |
| a domain type (Connection, QueryTab, …) | `@anko/desktop-domain` `src/schemas/` |
| a type crossing the RPC boundary | `@anko/desktop-domain` `src/schemas/` |
| immutable config / limit / key | the internal area's `constants.ts` (`UPPER_SNAKE_CASE`) |
| static copy / preset / label map | the internal area's `values.ts` |
| shared client state / command registration | `src/stores/{feature}/` |
| a UI primitive | `src/components/ui/` (via shadcn CLI when possible) |

## 3. Backend Layering (`packages/desktop/*`)

Strict one-way dependency between layer packages:

```
domain  →  repository  →  service  →  api  →  ui (via RPC)
```

- **`domain`** (`@anko/desktop-domain`) — the data model. `db/` holds drizzle table
  definitions, `entities/` the drizzle-zod row schemas, `schemas/` the shared
  interfaces (connection, query, ERD, MCP, …), `shared/` cross-layer leaves
  (`AppError`). No IO, no application code.
- **`repository`** (`@anko/desktop-repository`) — the only layer with direct DB / file /
  crypto IO. `db/` holds connectors implementing `DatabaseConnector` (target-database IO
  via Bun.SQL); `storage/` holds local persistence (bun:sqlite + drizzle) with
  **folder-per-operation** `queries/{op}.ts` and `mutations/{op}.ts`, each a single
  exported function, re-exported from the package barrel.
- **`service`** (`@anko/desktop-service`) — business logic: `AppState` (live connection
  registry; it does not run SQL itself) and the MCP service (approvals, security,
  SQL safety). Reads its own `package.json` for the bridge version.
- **`api`** (`@anko/desktop-api`) — RPC composition only. `router.ts` wires route modules
  to `service`/`repository` calls; no business logic or direct IO in handlers beyond
  delegation. When the router grows, split by concern and merge, instead of growing
  one file. `api → repository` is allowed for plain storage delegation.
- New storage operations follow the existing one-function-per-file pattern; new connectors
  follow “Adding a New Database Connector” in `CLAUDE.md`.

## 4. Component Authoring

### Hierarchy and atomization

- Structure components as a shallow tree, not a flat list of large files: feature → section →
  element (e.g. `layout/right-sidebar/right-sidebar-header/`). Each folder owns one concern and
  composes smaller children.
- Folders are kebab-case; component files are PascalCase `.tsx` named after their export.
- Prefer many small components over one component with large conditional branches. Extract when a
  section has its own props, state boundary, or reuse potential.
- Cross-feature reusable UI belongs in `src/components/ui/`; app-root shells and providers live at
  `src/App.tsx` / `src/components/layout/`.

### Size and hook budgets

- **Line budget:** `.tsx` files and colocated `.ts` files should stay **≤ 300 lines**. Exceeding
  300 requires a documented reason at the top of the file
  (`// conventions: >300 lines — <reason>; split when next touched`) and a plan to split.
- **Hook budget:** a component file should use **≤ 3 React hooks** (each custom hook counts as
  one). When logic exceeds the budget, extract a colocated custom hook into the module's
  `lib/hooks/` or lift genuinely shared state into a store. Split hooks by concern — data loading,
  subscriptions, keyboard shortcuts, drag-and-drop each get their own hook. Existing files over
  budget carry the documented-reason comment and shrink when next touched.
- Presentation stays in the component; data fetching, derived state, and pure helpers move to
  hooks, `lib/utils.ts`, `src/lib/`, or a store.

## 5. State & Wiring

Prefer the simplest option that keeps producers and consumers in sync:

1. **Props and callbacks** when both sides share a parent.
2. **A Zustand store** (`src/stores/{feature}/`) when distant UI needs shared client state or
   command registration (tabs, sidebars, command menu).
3. **Document-level hooks** for real browser events (keyboard shortcuts, visibility).

Store rules (these extend the Zustand selector rules in `CLAUDE.md`, which remain mandatory):

- Keep stores feature-scoped (`connection`, `workspace`, `right-sidebar`, …), not one app store.
- Subscribe narrowly with selectors; call `getState()` in event callbacks that must stay fresh
  without subscribing.
- Stores hold UI coordination and handlers; query results cached in a store are fine, but do not
  duplicate backend-owned data beyond what the UI needs.
- Keep local/ephemeral state (dialog open flags, form fields, search text) in hooks/components —
  a store there breaks remount-reset semantics for no sharing benefit.

**No `window` event bus** — no `window.dispatchEvent` / custom `window` listeners as pub/sub.
Keyboard shortcuts use a document-level listener hook. `window` is allowed for unavoidable browser
APIs (`window.location`, `beforeunload`, viewport-wide pointer tracking during drags — document
why in a comment).

## 6. Code Style

- Bun is the package manager; use `bun`/`bunx` and the scripts in `package.json`.
- Biome is the formatter/linter (`biome.jsonc`); `bun run check` must pass. Do not fight its rules.
- Use the `@/*` alias instead of deep relative imports.
- Prefer existing shadcn/ui primitives and `@tabler/icons-react` before hand-rolling UI.
- Avoid `any`, `@ts-ignore`, and loosely typed boundaries when a type-safe alternative is
  practical. The RPC boundary stays fully typed via `@anko/desktop-domain` and the
  `Router` type from `@anko/desktop-api`.
- Keep changes tightly scoped; do not refactor unrelated areas while fixing a focused problem.

## 7. Workflow

- Add dependencies to the workspace that imports them. Root dependencies are
  reserved for repository-wide tooling and orchestration.
- Keep workspace-specific configs and generated output inside their owning
  workspace. Use root scripts for normal development, verification, and release
  commands.
- Prefer the smallest safe change that solves the problem.
- Follow existing patterns before introducing new abstractions.
- Fix root causes instead of layering on workarounds.
- Do not add new dependencies unless the current stack cannot solve the problem cleanly.
- Be explicit about uncertainty, tradeoffs, and anything you could not verify.
- Commits follow the emoji conventional-commit format defined in `CLAUDE.md`
  (commitlint-enforced).

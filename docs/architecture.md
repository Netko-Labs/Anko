# Architecture

Anko is a Bun workspace monorepo orchestrated by Turborepo. It has one desktop
application, one companion executable, four desktop layer packages, and two
shared packages.

## Workspaces

```text
apps/
  desktop                Mirin application: React renderer + Bun worker entrypoint
  mcp-bridge             stdio MCP bridge, compiled to a native executable
packages/
  desktop/
    domain               @anko/desktop-domain — data model: drizzle tables, entity
                         row schemas, cross-process type schemas, AppError
    repository           @anko/desktop-repository — the only layer with direct
                         DB/file/crypto IO: connectors (Bun.SQL) + local storage
    service              @anko/desktop-service — business logic: AppState and the
                         MCP service (approvals, security, SQL safety)
    api                  @anko/desktop-api — Mirin RPC router + routes; composition only
  shared/
    mcp-contract         @anko/mcp-contract — desktop↔bridge contract
    typescript-config    @anko/typescript-config — shared tsconfig bases
```

## Dependency graph

```text
domain  →  repository  →  service  →  api  →  apps/desktop (worker + renderer)
   ^                                            |
   └────────── @anko/mcp-contract ──────────────┘   (also used by apps/mcp-bridge)
```

Workspace dependencies remain one-way and are enforced by each package's
`package.json`. `api` may call `repository` directly (route handlers delegate to
storage operations); everything else follows the strict ladder. The renderer
imports only types from `@anko/desktop-domain` and the `Router` type from
`@anko/desktop-api`. The contract package has no runtime dependencies and must
not import application code.

## Desktop application

`apps/desktop` owns the Mirin application shell and all user-facing behavior:

- `src/` is the React renderer.
- `src/bun/index.ts` is the Bun worker entrypoint; it wires `AppState`,
  `AnkoMcpService`, and `createRouter` from the layer packages.
- `mirin.config.ts` owns native windows, sidecars, packaging, and updates.

Mirin commands must run with `apps/desktop` as their working directory. The root
scripts enforce that rule so Mirin resolves the correct config and writes output
to `apps/desktop/build`.

## MCP bridge

`apps/mcp-bridge` compiles to `apps/mcp-bridge/dist/anko-mcp` (`.exe` on
Windows). The desktop `copy:sidecar` script stages it at
`apps/desktop/build/sidecars/anko-mcp`, where Mirin bundles it. Turbo wires the
chain: `copy:sidecar` depends on `build:binary`, so `bun start`, `bun run
build:app`, and `bun run release` always stage a current binary (cached when
unchanged). The bridge presents MCP over stdio and forwards `tools/list` and
`tools/call` to Anko over authenticated Streamable HTTP; it never reads database
credentials.

## Shared contracts

`packages/shared/mcp-contract` owns data needed by both the desktop and the
bridge. Keep this surface small and serializable. Desktop-only settings,
approval state, and credentials do not belong here.

Renderer↔worker types live in `@anko/desktop-domain` (`src/schemas/`), not in a
separate app-level folder.

## Tasks and tooling

- Turborepo runs `check-types`, `build`, and `build:binary` with dependency
  ordering and local caching (`.turbo/`). `bun start` runs the finite
  `copy:sidecar` chain through turbo, then hands the terminal to `mirin dev`.
- Every workspace extends `@anko/typescript-config/{base,bun,react}.json` and
  exposes a `check-types` script (root `typecheck` is an alias).
- `bun test` runs from the root; Bun discovers `__tests__` files across all
  workspaces.
- Drizzle is a typed query builder only (no runtime migrations);
  `drizzle.config.ts` lives in `packages/desktop/repository` and points at the
  domain schema.

## Ownership rules

- Add dependencies to the workspace that imports them.
- Put renderer↔worker types in `@anko/desktop-domain`.
- Put desktop-to-bridge contracts in `packages/shared/mcp-contract`.
- Keep build and package orchestration at the repository root (turbo.json).
- Keep workspace-specific config beside its workspace.
- Update all workspace versions together for an Anko release (the release
  workflow verifies every manifest).

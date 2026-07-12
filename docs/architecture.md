# Architecture

Anko is a Bun workspace monorepo with one desktop application, one companion
executable, and one shared contract package.

## Dependency graph

```text
@anko/mcp-contract
       ^       ^
       |       |
@anko/desktop  @anko/mcp-bridge
```

Workspace dependencies remain one-way. The contract package has no runtime
dependencies and must not import application code. The bridge knows how to reach
Anko's authenticated local MCP endpoint, but it never reads database credentials.

## Desktop application

`apps/desktop` owns the Mirin application and all user-facing behavior:

- `src/` is the React renderer.
- `src/bun/` is the Bun worker, database connectors, local storage, RPC, and MCP
  HTTP service.
- `src/shared/` contains renderer-to-worker contracts.
- `mirin.config.ts` owns native windows, sidecars, packaging, and updates.

Mirin commands must run with `apps/desktop` as their working directory. The root
scripts enforce that rule so Mirin resolves the correct config and writes output
to `apps/desktop/build`.

## MCP bridge

`apps/mcp-bridge` is compiled to a native executable before development,
packaging, or release. It presents MCP over stdio and forwards `tools/list` and
`tools/call` to Anko over authenticated Streamable HTTP. Its build output is
`apps/desktop/build/sidecars/anko-mcp` (or `anko-mcp.exe` on Windows), which Mirin
bundles with the application.

## Shared contracts

`packages/mcp-contract` owns data needed by both processes. Keep this surface
small and serializable. Desktop-only settings, approval state, and credentials do
not belong here.

## Ownership rules

- Add dependencies to the workspace that imports them.
- Put cross-process desktop RPC types in `apps/desktop/src/shared`.
- Put desktop-to-bridge contracts in `packages/mcp-contract`.
- Keep build and package orchestration at the repository root.
- Keep workspace-specific config beside its workspace.
- Update all workspace versions together for an Anko release.

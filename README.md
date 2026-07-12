# Anko

Anko is a cross-platform SQL desktop client for PostgreSQL, MySQL, and SQLite.
It is built with Mirin, Bun, React, and TypeScript and includes authenticated
MCP access for local coding agents.

## Workspaces

```text
apps/desktop/                     Mirin desktop application shell (renderer + worker entry)
apps/mcp-bridge/                  Compiled stdio-to-HTTP MCP bridge
packages/desktop/domain/          Data model: tables, entities, cross-process schemas
packages/desktop/repository/      Database connectors and local storage (all IO)
packages/desktop/service/         Business logic: connection state + MCP service
packages/desktop/api/             Mirin RPC router and routes
packages/shared/mcp-contract/     Shared MCP endpoint and configuration contract
packages/shared/typescript-config/ Shared tsconfig bases
```

The root package is private and owns orchestration, linting, tests, and release
commands. Runtime dependencies belong to the workspace that imports them.

## Development

Requires [Bun](https://bun.sh/) 1.3.14 or newer.

```bash
bun install
bun start
```

`bun start` compiles the MCP sidecar and launches the desktop app in development
mode. Other useful commands:

```bash
bun run check          # Biome lint and formatting checks
bun run typecheck      # Contract, bridge, renderer, backend, and config types
bun test               # All workspace tests
bun run build          # Typecheck and build all workspace artifacts
bun run build:mcp-bridge
bun run build:app      # Package the native app for the current platform
```

See [Architecture](docs/architecture.md), [Project audit](docs/audit.md),
[MCP access](docs/mcp.md), [Conventions](docs/conventions.md), and
[Releasing](docs/releasing.md).

## Security

Connection passwords are encrypted in Anko's local application data. The MCP
server binds to localhost, requires a bearer token, redacts credentials, and
requires UI approval for connection access and dangerous SQL unless the user
explicitly enables the bypass option.

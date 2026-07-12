# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anko is a cross-platform SQL desktop client built with Mirin, Bun, React, and
shadcn/ui. It supports SQLite, MySQL, and PostgreSQL with an architecture
designed for adding database connectors.

## Conventions

Folder-structure and code-style rules live in @docs/conventions.md — module anatomy (`lib/`, `hooks/`, barrels), scope ladder, backend layering, size/hook budgets, and state wiring rules. Follow them for every file you touch.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + shadcn/ui + Tailwind CSS v4
- **Backend**: TypeScript (Bun Worker via Mirin)
- **Package Manager**: Bun
- **Database Drivers**: Bun.SQL (built-in, MySQL + PostgreSQL)
- **Local Storage**: bun:sqlite (encrypted connection storage)
- **State Management**: Zustand

## Common Commands

```bash
# Install dependencies
bun install

# Run in development mode (Vite + Mirin)
bun start

# Typecheck and build all workspace artifacts
bun run build

# Build production app
bun run build:app

# Run tests
bun test

# Typecheck every workspace and desktop process
bun run typecheck

# Add shadcn/ui component
(cd apps/desktop && bunx --bun shadcn@latest add <component-name>)
```

## Architecture

### Directory Structure

```
anko/
├── apps/
│   ├── desktop/                      # Mirin desktop application (shell)
│   │   ├── mirin.config.ts           # Native windows, release, and CEF config
│   │   ├── scripts/copy-sidecar.ts   # Stages the bridge binary for Mirin
│   │   └── src/
│   │       ├── bun/index.ts          # Worker entrypoint; wires the layer packages
│   │       ├── components/           # Feature folders and shadcn primitives
│   │       ├── stores/               # Domain-scoped Zustand stores
│   │       ├── hooks/                # Reusable React hooks
│   │       ├── lib/                  # Frontend adapters and pure utilities
│   │       └── App.tsx
│   └── mcp-bridge/                   # stdio MCP bridge, compiled to dist/
├── packages/
│   ├── desktop/                      # Backend layer packages (one-way deps)
│   │   ├── domain/                   # @anko/desktop-domain — tables, entities, schemas
│   │   ├── repository/               # @anko/desktop-repository — connectors + storage IO
│   │   ├── service/                  # @anko/desktop-service — AppState + MCP service
│   │   └── api/                      # @anko/desktop-api — RPC router + routes
│   └── shared/
│       ├── mcp-contract/             # Desktop/bridge endpoint contract
│       └── typescript-config/        # Shared tsconfig bases
├── turbo.json                        # Task graph (check-types, build, sidecar chain)
├── docs/architecture.md              # Workspace boundaries and build flow
├── docs/conventions.md               # Folder and code-style rules
└── docs/releasing.md                 # Release-commit automation runbook
```

Layer flow: `domain → repository → service → api → ui` (api may also call
repository for plain storage delegation). See `docs/architecture.md`.

### Frontend-Backend Communication

The frontend communicates with the Bun Worker through Mirin RPC. Type-safe
wrappers are in `apps/desktop/src/lib/rpc.ts`; the router and routes live in
`packages/desktop/api`:

```typescript
// Example: Execute a query
import { executeQuery } from "@/lib/rpc";
const result = await executeQuery(connectionId, "SELECT * FROM users");
```

Cross-process types live in `@anko/desktop-domain` (`src/schemas/`); the
renderer imports the `Router` type from `@anko/desktop-api`.

### Adding a New Database Connector

1. Create a new file in `packages/desktop/repository/src/db/` (e.g., `sqlite.ts`)
2. Implement the `DatabaseConnector` interface from `connector.ts`
3. Add the driver variant to `DatabaseDriver` in `@anko/desktop-domain` (`schemas/database.ts`)
4. Update connection logic in `packages/desktop/service/src/state.ts` for the new driver
5. Export the connector from the repository barrel (`src/index.ts`)

### State Management

- **Bun side**: `AppState` (`packages/desktop/service/src/state.ts`) manages active
  connections (Map); storage lives in `@anko/desktop-repository`
- **React side**: Zustand stores in `stores/` manage UI state (tabs, connections, query results)

### Key Patterns

- All target-database operations use Bun.SQL (built-in async SQL driver)
- Local storage is bun:sqlite with drizzle as a typed query builder (no runtime
  migrations; `drizzle.config.ts` lives in the repository package)
- Passwords are encrypted with AES-256-GCM before storage (node:crypto)
- Each active connection has a UUID identifier for frontend reference
- Query tabs are associated with connection IDs

## Critical Coding Patterns

### Zustand Selector Best Practices

**NEVER call store functions during render** - this causes infinite re-render loops:

```typescript
// BAD - causes infinite loops
const hasPendingChanges = useStore((s) => s.hasPendingChanges)
const getPendingChanges = useStore((s) => s.getPendingChanges)
const result = getPendingChanges(tabId)  // Called during render!
const hasChanges = hasPendingChanges(tabId)  // Called during render!

// GOOD - derive state using useMemo from a stable selector
const tab = useStore((s) => s.queryTabs.find((t) => t.id === tabId))
const pendingChanges = useMemo(
  () => tab?.editState?.pendingChanges ?? [],
  [tab?.editState?.pendingChanges]
)
const hasChanges = pendingChanges.length > 0
```

**Why this matters**: Function selectors return new references each time. When used in `useCallback` dependencies, they cause callbacks to be recreated, which triggers `useEffect` re-runs, causing infinite loops.

### Stabilizing useCallback Dependencies

When using object properties from state in `useCallback`, extract primitive values first:

```typescript
// BAD - tab object changes reference on every store update
const loadPage = useCallback(async () => {
  if (!tab || !connection) return
  await executeQuery(connection.connectionId, tab.tableName)
}, [tab, connection])  // These change every render!

// GOOD - extract stable primitive values
const tableName = tab?.tableName
const connectionId = connection?.connectionId

const loadPage = useCallback(async () => {
  if (!connectionId || !tableName) return
  await executeQuery(connectionId, tableName)
}, [connectionId, tableName])  // Only changes when actual values change
```

### useEffect Dependencies with Refs

Use refs for values you need to access but don't want to react to:

```typescript
// Use ref for values that shouldn't trigger re-renders
const filtersRef = useRef(filters)
useEffect(() => {
  filtersRef.current = filters
}, [filters])

// In callbacks, use the ref instead of the value directly
const loadPage = useCallback(async (page: number) => {
  const activeFilters = filtersRef.current
  // ... use activeFilters
}, [/* no filters dependency needed */])
```

### Table Edit State Pattern

Table editing uses a pending changes pattern:
- `PendingRowChange` tracks inserts, updates, and deletes
- Changes are stored in `tab.editState.pendingChanges`
- Commit executes SQL statements: DELETE first, then UPDATE, then INSERT
- New rows are displayed at top of table with green styling
- Modified cells show amber styling

## Configuration Files

- `apps/desktop/mirin.config.ts` - Mirin window, packaging, and update configuration
- `apps/desktop/components.json` - shadcn/ui configuration
- `apps/desktop/vite.config.ts` - Vite configuration with Tailwind and path aliases
- `docs/releasing.md` - validated release-commit automation

## Commit Message Format

This project uses conventional commits with emojis. Format: `<emoji> <type>(<scope>): <description>`

| Emoji | Type | Description |
|-------|------|-------------|
| ✨ | feat | New feature |
| 🐛 | fix | Bug fix |
| 📝 | docs | Documentation |
| 💄 | style | Styling/formatting |
| ♻️ | refactor | Code refactoring |
| ⚡ | perf | Performance improvement |
| ✅ | test | Tests |
| 🔧 | chore | Maintenance |
| 🏗️ | build | Build system |
| 👷 | ci | CI/CD |
| 🔒 | security | Security fix |
| 🚀 | release | Release metadata; publishing is triggered by the commit on `main` |

**Examples:**
```
✨ feat(editor): add SQL autocomplete
🐛 fix(connection): handle timeout errors
♻️ refactor(store): simplify tab management
🚀 release: v0.1.0
```

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

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
│   ├── desktop/                      # Mirin desktop application
│   │   ├── mirin.config.ts           # Native windows, release, and CEF config
│   │   └── src/
│   │       ├── bun/                  # Bun Worker backend
│   │       │   ├── index.ts          # Worker entrypoint and app lifecycle
│   │       │   ├── state.ts          # Process state and active connections
│   │       │   ├── db/               # Database connector implementations
│   │       │   ├── rpc/              # Mirin router and concern-based routes
│   │       │   └── storage/          # SQLite schema, queries, and mutations
│   │       ├── shared/               # Contracts shared by backend and UI
│   │       ├── components/           # Feature folders and shadcn primitives
│   │       ├── stores/               # Domain-scoped Zustand stores
│   │       ├── hooks/                # Reusable React hooks
│   │       ├── lib/                  # Frontend adapters and pure utilities
│   │       └── App.tsx
│   └── mcp-bridge/                   # Compiled stdio MCP bridge
├── packages/
│   └── mcp-contract/                 # Desktop/bridge endpoint contract
├── docs/architecture.md              # Workspace boundaries and build flow
├── docs/conventions.md               # Folder and code-style rules
└── docs/releasing.md                 # Release-commit automation runbook
```

### Frontend-Backend Communication

The frontend communicates with the Bun Worker through Mirin RPC. Type-safe
wrappers are in `apps/desktop/src/lib/rpc.ts`, while the router and routes live
under `apps/desktop/src/bun/rpc/`:

```typescript
// Example: Execute a query
import { executeQuery } from "@/lib/rpc";
const result = await executeQuery(connectionId, "SELECT * FROM users");
```

RPC types are defined in `apps/desktop/src/shared/rpc-types.ts` and shared
between frontend and backend.

### Adding a New Database Connector

1. Create a new file in `apps/desktop/src/bun/db/` (e.g., `sqlite.ts`)
2. Implement the `DatabaseConnector` interface from `connector.ts`
3. Add the driver variant to `DatabaseDriver` type in `connector.ts`
4. Update connection logic in `state.ts` to handle the new driver
5. Update frontend types in `apps/desktop/src/entities/`

### State Management

- **Bun side**: `AppState` in `state.ts` manages active connections (Map) and storage
- **React side**: Zustand stores in `stores/` manage UI state (tabs, connections, query results)

### Key Patterns

- All database operations use Bun.SQL (built-in async SQL driver)
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

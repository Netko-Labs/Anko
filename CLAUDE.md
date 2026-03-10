# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anko is a cross-platform SQL desktop client built with Electrobun (Bun), React, and shadcn/ui. It supports MySQL and PostgreSQL with an architecture designed for adding additional database connectors.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + shadcn/ui + Tailwind CSS v4
- **Backend**: TypeScript (Bun via Electrobun)
- **Package Manager**: Bun
- **Database Drivers**: Bun.SQL (built-in, MySQL + PostgreSQL)
- **Local Storage**: bun:sqlite (encrypted connection storage)
- **State Management**: Zustand

## Common Commands

```bash
# Install dependencies
bun install

# Run in development mode (Vite dev server + Electrobun)
bun run dev

# Start the Electrobun app (connects to running Vite dev server)
bun start

# Build frontend only
bun run build

# Build production app
bun run build:app

# Type check frontend only
bun run tsc --noEmit

# Add shadcn/ui component
bunx --bun shadcn@latest add <component-name>
```

## Architecture

### Directory Structure

```
anko/
├── electrobun.config.ts              # Electrobun app configuration
├── src/
│   ├── bun/                          # Bun backend (main process)
│   │   ├── index.ts                  # Main process entrypoint
│   │   ├── state.ts                  # AppState management
│   │   ├── error.ts                  # Error types
│   │   ├── db/
│   │   │   ├── connector.ts          # DatabaseConnector interface
│   │   │   ├── mysql.ts              # MySQL connector (Bun.SQL)
│   │   │   ├── postgres.ts           # PostgreSQL connector (Bun.SQL)
│   │   │   └── query-utils.ts        # SQL parsing utils
│   │   ├── storage/
│   │   │   ├── index.ts              # Storage init
│   │   │   ├── connections.ts        # Connection CRUD (bun:sqlite)
│   │   │   ├── encryption.ts         # AES-256-GCM (node:crypto)
│   │   │   ├── workspaces.ts         # Workspace management
│   │   │   ├── query-history.ts      # Query history
│   │   │   └── saved-queries.ts      # Saved queries
│   │   └── rpc/
│   │       ├── schema.ts             # RPC type re-export
│   │       └── handlers.ts           # All RPC command handlers
│   ├── shared/
│   │   └── rpc-types.ts              # Shared RPC schema types
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── connection/               # Connection manager UI
│   │   ├── editor/                   # Query editor
│   │   ├── schema/                   # Schema browser (database tree)
│   │   ├── results/                  # Query results table
│   │   └── layout/                   # App layout components
│   ├── stores/                       # Zustand state stores
│   ├── entities/                     # TypeScript interfaces
│   ├── lib/
│   │   ├── rpc.ts                    # Electrobun RPC wrappers
│   │   └── ...                       # Other utilities
│   └── App.tsx
```

### Frontend-Backend Communication

The frontend communicates with the Bun backend via Electrobun RPC. Type-safe wrappers are in `src/lib/rpc.ts`:

```typescript
// Example: Execute a query
import { executeQuery } from "@/lib/rpc";
const result = await executeQuery(connectionId, "SELECT * FROM users");
```

RPC types are defined in `src/shared/rpc-types.ts` and shared between frontend and backend.

### Adding a New Database Connector

1. Create a new file in `src/bun/db/` (e.g., `sqlite.ts`)
2. Implement the `DatabaseConnector` interface from `connector.ts`
3. Add the driver variant to `DatabaseDriver` type in `connector.ts`
4. Update connection logic in `state.ts` to handle the new driver
5. Update frontend types in `src/entities/`

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

- `electrobun.config.ts` - Electrobun app configuration (window, build, release)
- `components.json` - shadcn/ui configuration
- `vite.config.ts` - Vite configuration with Tailwind and path aliases

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
| 🚀 | release | Release (triggers build) |

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

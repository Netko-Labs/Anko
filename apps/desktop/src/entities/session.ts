import type { QueryTab } from './query'

/**
 * A persisted query tab. This is the full {@link QueryTab} minus runtime-only
 * fields — `isExecuting` is always reset to false on restore, and `isStale` is
 * recomputed (a tab is stale iff it restored with a `result`). Everything else,
 * including the (size-capped) snapshot `result` and any `editState`, is kept.
 */
export type SerializedTab = Omit<QueryTab, 'isExecuting' | 'isStale'>

/** A connection that was live when the session was saved (→ "Reconnect" group). */
export interface SerializedConnection {
  /** Saved connection id (ConnectionInfo.id / ActiveConnection.id). */
  connectionId: string
  selectedDatabase?: string
}

/** The persisted per-workspace UI session (stored as JSON in workspace_sessions). */
export interface SessionData {
  /** Schema version, for forward-compatible migrations of the blob. */
  version: 1
  activeTabId: string | null
  tabs: SerializedTab[]
  connections: SerializedConnection[]
}

/**
 * Per-workspace session persistence — serialize the open tabs (with a
 * size-capped snapshot of their loaded results) plus the set of connected DBs,
 * and restore them on app open / workspace swap.
 *
 * Design (see plan): results are snapshotted for instant display ("hybrid") but
 * marked stale on restore; connections come back in a "Reconnect" group for
 * lazy, manual reconnect rather than auto-connecting.
 */

import {
  disconnect,
  getActiveWorkspaceId,
  getWorkspaceSession,
  listWorkspaces,
  saveWorkspaceSession,
  setActiveWorkspaceId,
} from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import { DEFAULT_WORKSPACE_ID, useWorkspaceStore } from '@/stores/workspace'
import type { SerializedConnection, SerializedTab, SessionData } from '@/types'
import { storeLogger } from './debug'

/** Don't persist a tab's result past this many rows — it re-fetches on reconnect. */
const MAX_PERSIST_ROWS = 2000

/** Build the persisted session for the active workspace from the live store. */
export function serializeSession(): SessionData {
  const { queryTabs, activeTabId, activeConnections, pendingReconnect } =
    useConnectionStore.getState()

  let droppedResults = 0
  const tabs: SerializedTab[] = queryTabs.map((tab) => {
    // Strip runtime-only fields; cap the snapshot result.
    const { isExecuting: _exec, isStale: _stale, result, ...rest } = tab
    if (result && result.rows.length > MAX_PERSIST_ROWS) {
      droppedResults++
      return rest // too big to persist — tab re-fetches once reconnected
    }
    return { ...rest, result }
  })
  if (droppedResults > 0) {
    storeLogger.debug('serializeSession: dropped oversized results', {
      droppedResults,
      maxRows: MAX_PERSIST_ROWS,
    })
  }

  // Connections to restore as "pending reconnect": the ones live now, merged
  // with any still-pending from this session (so an unreconnected workspace
  // keeps remembering them). Active selectedDatabase wins.
  const byId = new Map<string, SerializedConnection>()
  for (const p of pendingReconnect) byId.set(p.connectionId, p)
  for (const c of activeConnections) {
    byId.set(c.id, { connectionId: c.id, selectedDatabase: c.selectedDatabase })
  }

  return {
    version: 1,
    activeTabId,
    tabs,
    connections: [...byId.values()],
  }
}

/** Load + parse a workspace's persisted session, or null if none / unreadable. */
export async function loadSession(workspaceId: string): Promise<SessionData | null> {
  const raw = await getWorkspaceSession(workspaceId)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SessionData
    if (parsed?.version !== 1 || !Array.isArray(parsed.tabs)) return null
    return parsed
  } catch (e) {
    storeLogger.error('loadSession: failed to parse session blob', e)
    return null
  }
}

/** Immediately persist the active workspace's session. */
export async function saveSessionNow(workspaceId: string): Promise<void> {
  try {
    const data = serializeSession()
    await saveWorkspaceSession(workspaceId, JSON.stringify(data))
  } catch (e) {
    storeLogger.error('saveSessionNow failed', e)
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_MS = 600

// While true, auto-saves are skipped. Set during boot/swap so the store
// mutations they perform (applySession/clearSession) don't echo back a save of
// the wrong workspace mid-transition.
let saveSuspended = false

/** Debounced session save — coalesces rapid edits (typing, paging, etc.). */
export function saveSessionDebounced(workspaceId: string): void {
  if (saveSuspended) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    void saveSessionNow(workspaceId)
  }, SAVE_DEBOUNCE_MS)
}

/** Cancel any pending debounced save (e.g. right before an explicit flush). */
export function cancelDebouncedSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
}

/** Apply a workspace's persisted session into the store (or leave it cleared). */
async function restoreInto(workspaceId: string): Promise<void> {
  const data = await loadSession(workspaceId)
  if (data) useConnectionStore.getState().applySession(data)
}

/**
 * Boot: load workspaces, resolve the last-active workspace (falling back to
 * default), set it active, and restore its session. Returns the resolved id.
 */
export async function bootSession(): Promise<string> {
  saveSuspended = true
  try {
    const workspaces = await listWorkspaces()
    useWorkspaceStore.getState().setWorkspaces(workspaces)

    const savedId = await getActiveWorkspaceId()
    const exists = savedId && workspaces.some((w) => w.id === savedId)
    const activeId = exists ? savedId : DEFAULT_WORKSPACE_ID

    useWorkspaceStore.getState().setActiveWorkspace(activeId)
    useConnectionStore.getState().clearSession()
    await restoreInto(activeId)
    return activeId
  } finally {
    saveSuspended = false
  }
}

/**
 * Swap to another workspace: persist the current session, disconnect its live
 * connectors (only the active workspace holds live connections), then restore
 * the target's session. No-op if already active.
 */
export async function switchWorkspace(toId: string): Promise<void> {
  const ws = useWorkspaceStore.getState()
  const fromId = ws.activeWorkspaceId
  if (fromId === toId) return

  saveSuspended = true
  cancelDebouncedSave()
  try {
    await saveSessionNow(fromId)

    // Tear down the previous workspace's live backend connectors.
    const active = useConnectionStore.getState().activeConnections
    await Promise.allSettled(active.map((c) => disconnect(c.connectionId)))

    useConnectionStore.getState().clearSession()
    ws.setActiveWorkspace(toId)
    await restoreInto(toId)
    await setActiveWorkspaceId(toId)
  } catch (e) {
    storeLogger.error('switchWorkspace failed', e)
  } finally {
    saveSuspended = false
  }
}

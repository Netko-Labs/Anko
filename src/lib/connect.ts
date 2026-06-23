/**
 * Connect a saved connection and register it as active. Shared by the sidebar,
 * command menu, and the "reconnect" affordances on restored session tabs.
 */

import { connect, getConnectionConfig } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import type { ActiveConnection, ConnectionInfo } from '@/types'

/**
 * Open a backend connection for a saved connection and add it to the store as an
 * active connection. Restores the database selected in the persisted session (if
 * this connection was pending reconnect) and clears it from the pending list.
 * Throws on failure (caller handles the toast/UI).
 */
export async function connectSaved(info: ConnectionInfo): Promise<ActiveConnection> {
  const store = useConnectionStore.getState()

  const existing = store.activeConnections.find((c) => c.id === info.id)
  if (existing) return existing

  const config = await getConnectionConfig(info.id)
  const connectionId = await connect(config)

  const pending = store.pendingReconnect.find((p) => p.connectionId === info.id)
  const active: ActiveConnection = {
    id: info.id,
    connectionId,
    info,
    selectedDatabase: pending?.selectedDatabase ?? info.database,
  }

  store.addActiveConnection(active)
  store.removePendingReconnect(info.id)
  return active
}

import { useCallback } from 'react'
import { toast } from 'sonner'
import { connectSaved } from '@/lib/connect'
import { formatErrorMessage } from '@/lib/error-utils'
import { ensureMinimumToastDuration, resolveToast } from '@/lib/toast-utils'
import { useConnectionStore } from '@/stores/connection'
import type { ConnectionInfo } from '@/types'
import type { CommandActions, CommandDatabaseItem, CommandTableItem } from '..'

/**
 * Command palette action handlers: connecting, opening saved/history queries,
 * opening tables, and the new-tab flows. `onOpenChange` closes the palette.
 */
export function useCommandActions(onOpenChange: (open: boolean) => void): CommandActions {
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const addQueryTab = useConnectionStore((s) => s.addQueryTab)
  const addTableTab = useConnectionStore((s) => s.addTableTab)

  const handleConnect = useCallback(
    async (info: ConnectionInfo) => {
      onOpenChange(false)
      const startTime = Date.now()
      const toastId = toast.loading('Connecting...', {
        description: `Connecting to "${info.name}"`,
      })
      try {
        await connectSaved(info)
        await ensureMinimumToastDuration(startTime)
        resolveToast.success(toastId, 'Connected', {
          description: `Successfully connected to "${info.name}"`,
        })
      } catch (e) {
        resolveToast.error(toastId, 'Connection failed', {
          description: formatErrorMessage(e),
        })
      }
    },
    [onOpenChange],
  )

  const handleOpenQuery = useCallback(
    (query: string, label: string, connectionId?: string | null) => {
      const conn = connectionId
        ? activeConnections.find((c) => c.id === connectionId)
        : activeConnections[0]

      if (conn) {
        addQueryTab({
          id: `cmd-${Date.now()}`,
          connectionId: conn.id,
          query,
          isExecuting: false,
        })
        toast.success(`Opened "${label}" in editor`)
      } else {
        navigator.clipboard.writeText(query)
        toast.info('No active connection', {
          description: 'Query copied to clipboard. Connect to a database first.',
        })
      }
      onOpenChange(false)
    },
    [activeConnections, addQueryTab, onOpenChange],
  )

  const handleOpenTable = useCallback(
    (item: CommandTableItem) => {
      addTableTab(
        item.connectionId,
        item.runtimeConnectionId,
        item.database,
        item.schema,
        item.tableName,
      )
      onOpenChange(false)
    },
    [addTableTab, onOpenChange],
  )

  const handleNewTabQuery = useCallback(
    (item: CommandDatabaseItem) => {
      useConnectionStore.getState().setSelectedDatabase(item.connectionId, item.database)
      addQueryTab({
        id: `query-${Date.now()}`,
        connectionId: item.connectionId,
        query: '',
        isExecuting: false,
      })
      onOpenChange(false)
    },
    [addQueryTab, onOpenChange],
  )

  const handleNewTabTable = useCallback(
    (dbItem: CommandDatabaseItem, tableName: string, schema?: string) => {
      addTableTab(
        dbItem.connectionId,
        dbItem.runtimeConnectionId,
        dbItem.database,
        schema,
        tableName,
      )
      onOpenChange(false)
    },
    [addTableTab, onOpenChange],
  )

  return { handleConnect, handleOpenQuery, handleOpenTable, handleNewTabQuery, handleNewTabTable }
}

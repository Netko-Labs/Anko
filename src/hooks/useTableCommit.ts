import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { createTimer, tableLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import { generateCommitSQL } from '@/lib/sql-generator'
import { executeQuery } from '@/lib/tauri'
import { useConnectionStore } from '@/stores/connection'
import type { DatabaseDriver, PendingRowChange } from '@/types'

interface UseTableCommitParams {
  tabId: string
  runtimeConnectionId: string | undefined
  tableName: string | undefined
  databaseName: string | undefined
  schemaName: string | undefined
  driver: DatabaseDriver | undefined
  pendingChanges: PendingRowChange[]
  handleRefresh: () => Promise<void>
}

export function useTableCommit({
  tabId,
  runtimeConnectionId,
  tableName,
  databaseName,
  schemaName,
  driver,
  pendingChanges,
  handleRefresh,
}: UseTableCommitParams) {
  const setCommittingRef = useRef(useConnectionStore.getState().setCommitting)
  const setCommitErrorRef = useRef(useConnectionStore.getState().setCommitError)
  const clearPendingChangesRef = useRef(useConnectionStore.getState().clearPendingChanges)
  const discardAllChangesRef = useRef(useConnectionStore.getState().discardAllChanges)

  const handleCommit = useCallback(async () => {
    if (!runtimeConnectionId || !tableName || !databaseName) return

    setCommittingRef.current(tabId, true)
    setCommitErrorRef.current(tabId, undefined)

    try {
      const sqlStatements = generateCommitSQL(
        {
          tableName,
          databaseName,
          schemaName,
          driver,
        },
        pendingChanges,
      )

      tableLogger.debug('committing changes', {
        tableName,
        statementCount: sqlStatements.length,
        statements: sqlStatements,
      })
      const timer = createTimer(tableLogger, 'commit changes')

      const database = schemaName ? databaseName : undefined
      const context = schemaName || databaseName

      for (const sql of sqlStatements) {
        await executeQuery(runtimeConnectionId, sql, database, context)
      }

      timer.end({ statementCount: sqlStatements.length })
      clearPendingChangesRef.current(tabId)
      toast.success(
        `Committed ${sqlStatements.length} change${sqlStatements.length !== 1 ? 's' : ''}`,
      )
      await handleRefresh()
    } catch (e) {
      const errorMsg = formatErrorMessage(e)
      tableLogger.error('commit failed', { tableName, error: errorMsg })
      setCommitErrorRef.current(tabId, errorMsg)
      toast.error('Failed to commit changes', { description: errorMsg })
    } finally {
      setCommittingRef.current(tabId, false)
    }
  }, [runtimeConnectionId, tableName, databaseName, schemaName, driver, tabId, pendingChanges, handleRefresh])

  const handleDiscard = useCallback(() => {
    discardAllChangesRef.current(tabId)
  }, [tabId])

  return { handleCommit, handleDiscard }
}

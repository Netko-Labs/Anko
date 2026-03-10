import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createTimer, editorLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import { addQueryHistory, executeQuery } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import { useQueryHistoryStore } from '@/stores/query-history'

interface UseQueryExecutionParams {
  tabId: string
  connectionId: string | undefined
  connectionInfoId: string | undefined
  connectionName: string
  selectedDatabase: string | undefined
  query: string | undefined
}

export function useQueryExecution({
  tabId,
  connectionId,
  connectionInfoId,
  connectionName,
  selectedDatabase,
  query,
}: UseQueryExecutionParams) {
  const setQueryResultRef = useRef(useConnectionStore.getState().setQueryResult)
  const setQueryErrorRef = useRef(useConnectionStore.getState().setQueryError)
  const setQueryExecutingRef = useRef(useConnectionStore.getState().setQueryExecuting)
  const addHistoryEntryRef = useRef(useQueryHistoryStore.getState().addEntry)

  // Use ref for query to avoid re-creating handleExecute on every keystroke
  const queryRef = useRef(query)
  useEffect(() => {
    queryRef.current = query
  }, [query])

  const handleExecute = useCallback(async () => {
    const currentQuery = queryRef.current
    if (!currentQuery?.trim() || !connectionId || !connectionInfoId) return

    editorLogger.debug('executing query', {
      tabId,
      connectionId,
      database: selectedDatabase,
      queryLength: currentQuery.length,
    })
    const timer = createTimer(editorLogger, 'query execution')
    const startTime = performance.now()
    setQueryExecutingRef.current(tabId, true)

    try {
      const result = await executeQuery(connectionId, currentQuery, selectedDatabase)
      setQueryResultRef.current(tabId, result)
      const rowCount = result.rows?.length ?? 0
      const executionTimeMs = Math.round(performance.now() - startTime)
      timer.end({ rowCount, executionTimeMs: result.execution_time_ms })

      addQueryHistory({
        query: currentQuery.trim(),
        connectionId: connectionInfoId,
        connectionName,
        databaseName: selectedDatabase ?? null,
        executionTimeMs,
        rowCount,
        success: true,
        errorMessage: null,
      })
        .then((entry) => {
          addHistoryEntryRef.current(entry)
        })
        .catch((e) => {
          editorLogger.warn('Failed to log query to history', e)
        })

      toast.success('Query executed', {
        description: `${rowCount} row${rowCount !== 1 ? 's' : ''} returned`,
      })
    } catch (e) {
      timer.fail(e)
      const executionTimeMs = Math.round(performance.now() - startTime)
      const errorMessage = formatErrorMessage(e)
      setQueryErrorRef.current(tabId, errorMessage)

      addQueryHistory({
        query: currentQuery.trim(),
        connectionId: connectionInfoId,
        connectionName,
        databaseName: selectedDatabase ?? null,
        executionTimeMs,
        rowCount: null,
        success: false,
        errorMessage,
      })
        .then((entry) => {
          addHistoryEntryRef.current(entry)
        })
        .catch((err) => {
          editorLogger.warn('Failed to log query to history', err)
        })

      toast.error('Query failed', {
        description: errorMessage,
      })
    }
  }, [connectionId, connectionInfoId, connectionName, tabId, selectedDatabase])

  return { queryRef, handleExecute }
}

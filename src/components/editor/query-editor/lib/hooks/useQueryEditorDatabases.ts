import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { createTimer, editorLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import { getDatabases } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import type { SchemaContext } from '../../../lib'

interface UseQueryEditorDatabasesParams {
  connectionId?: string
  connectionInfoId?: string
  selectedDatabase?: string
  schemaCacheForConnection?: SchemaContext
}

/**
 * Loads (and caches) the database list for the active connection and exposes
 * the schema context used by autocomplete plus the database-change handler.
 */
export function useQueryEditorDatabases({
  connectionId,
  connectionInfoId,
  selectedDatabase,
  schemaCacheForConnection,
}: UseQueryEditorDatabasesParams) {
  const setSelectedDatabaseRef = useRef(useConnectionStore.getState().setSelectedDatabase)
  const setDatabasesRef = useRef(useConnectionStore.getState().setDatabases)

  const databases = useMemo(() => {
    return schemaCacheForConnection?.databases || []
  }, [schemaCacheForConnection])

  const schema: SchemaContext | undefined = useMemo(() => {
    if (!schemaCacheForConnection) return undefined
    return {
      databases: schemaCacheForConnection.databases,
      tables: schemaCacheForConnection.tables,
      columns: schemaCacheForConnection.columns,
    }
  }, [schemaCacheForConnection])

  // Load databases if not cached
  useEffect(() => {
    if (!connectionId || !connectionInfoId) return

    const hasDatabases =
      schemaCacheForConnection?.databases && schemaCacheForConnection.databases.length > 0

    if (hasDatabases) {
      editorLogger.debug('databases cache hit', {
        connectionId,
        count: schemaCacheForConnection.databases.length,
      })
      return
    }

    editorLogger.debug('databases cache miss, loading', { connectionId })
    const timer = createTimer(editorLogger, 'load databases')

    getDatabases(connectionId)
      .then((dbs) => {
        timer.end({ count: dbs.length })
        setDatabasesRef.current(connectionId, dbs)
        if (!selectedDatabase && dbs.length > 0) {
          setSelectedDatabaseRef.current(connectionInfoId, dbs[0].name)
        }
      })
      .catch((e) => {
        timer.fail(e)
        toast.error('Failed to load databases', { description: formatErrorMessage(e) })
      })
  }, [connectionId, connectionInfoId, selectedDatabase, schemaCacheForConnection])

  const handleDatabaseChange = useCallback(
    (database: string) => {
      if (connectionInfoId) {
        editorLogger.debug('database changed', { connectionInfoId, database })
        setSelectedDatabaseRef.current(connectionInfoId, database)
      }
    },
    [connectionInfoId],
  )

  return { databases, schema, handleDatabaseChange }
}

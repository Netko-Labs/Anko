import type { Dispatch } from 'react'
import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { treeLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import { disconnect } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import type { TreeAction, TreeState } from '@/reducers/tree-reducer'
import type { ActiveConnection } from '@/types'
import type { useTreeDataLoading } from './useTreeDataLoading'

interface UseTreeEventHandlersParams {
  connection: ActiveConnection
  isPostgreSQL: boolean
  state: TreeState
  dispatch: Dispatch<TreeAction>
  dataLoaders: ReturnType<typeof useTreeDataLoading>
}

export function useTreeEventHandlers({
  connection,
  isPostgreSQL,
  state,
  dispatch,
  dataLoaders,
}: UseTreeEventHandlersParams) {
  const { connectionId } = connection
  const { isExpanded, expandedDatabases, expandedSchemas, expandedTables } = state
  const { loadDatabases, loadSchemas, loadTables, loadColumns, refreshTables, refreshColumns } =
    dataLoaders

  // Store actions - use refs to stabilize dependencies
  const setSelectedDatabaseRef = useRef(useConnectionStore.getState().setSelectedDatabase)
  const removeActiveConnectionRef = useRef(useConnectionStore.getState().removeActiveConnection)
  const addTableTabRef = useRef(useConnectionStore.getState().addTableTab)

  const handleConnectionClick = useCallback(() => {
    treeLogger.debug('connection node toggled', { connectionId, wasExpanded: isExpanded })
    if (!isExpanded) {
      loadDatabases()
    }
    dispatch({ type: 'TOGGLE_CONNECTION' })
  }, [isExpanded, loadDatabases, connectionId, dispatch])

  const handleDatabaseClick = useCallback(
    (database: string) => {
      const willExpand = !expandedDatabases.has(database)
      treeLogger.debug('database node toggled', { database, willExpand })
      dispatch({ type: 'TOGGLE_DATABASE', database })

      if (willExpand) {
        if (isPostgreSQL) {
          loadSchemas(database)
        } else {
          loadTables(database, '')
        }
      }
      setSelectedDatabaseRef.current(connection.id, database)
    },
    [expandedDatabases, isPostgreSQL, loadSchemas, loadTables, connection.id, dispatch],
  )

  const handleSchemaClick = useCallback(
    (database: string, schema: string) => {
      const schemaKey = `${database}.${schema}`
      const willExpand = !expandedSchemas.has(schemaKey)
      treeLogger.debug('schema node toggled', { database, schema, willExpand })
      dispatch({ type: 'TOGGLE_SCHEMA', schemaKey })

      if (willExpand) {
        loadTables(database, schema)
      }
    },
    [expandedSchemas, loadTables, dispatch],
  )

  const handleTableClick = useCallback(
    (database: string, schema: string, table: string) => {
      const key = schema ? `${database}.${schema}.${table}` : `${database}.${table}`
      const willExpand = !expandedTables.has(key)
      treeLogger.debug('table node toggled', { table: key, willExpand })
      dispatch({ type: 'TOGGLE_TABLE', tableKey: key })

      if (willExpand) {
        loadColumns(database, schema, table)
      }
    },
    [expandedTables, loadColumns, dispatch],
  )

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect(connectionId)
      removeActiveConnectionRef.current(connection.id)
    } catch (e) {
      console.error('Failed to disconnect:', e)
      toast.error('Failed to disconnect', {
        description: formatErrorMessage(e),
      })
    }
  }, [connectionId, connection.id])

  const handleOpenTable = useCallback(
    (database: string, schema: string, table: string) => {
      addTableTabRef.current(connection.id, connectionId, database, schema || undefined, table)
    },
    [connection.id, connectionId],
  )

  const handleRefreshTables = useCallback(
    (database: string, schema: string) => refreshTables(database, schema),
    [refreshTables],
  )

  const handleRefreshColumns = useCallback(
    (database: string, schema: string, table: string) => refreshColumns(database, schema, table),
    [refreshColumns],
  )

  return {
    handleConnectionClick,
    handleDatabaseClick,
    handleSchemaClick,
    handleTableClick,
    handleDisconnect,
    handleOpenTable,
    handleRefreshTables,
    handleRefreshColumns,
  }
}

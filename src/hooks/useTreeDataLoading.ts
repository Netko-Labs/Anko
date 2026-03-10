import type { Dispatch } from 'react'
import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { createTimer, treeLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import {
  getColumns as fetchColumns,
  getSchemas as fetchSchemas,
  getTables as fetchTables,
  getDatabases,
} from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import type { TreeAction, TreeState } from '@/reducers/tree-reducer'

export function useTreeDataLoading(
  connectionId: string,
  state: TreeState,
  dispatch: Dispatch<TreeAction>,
) {
  const { loadedDatabases, loadedSchemas, loadedTables, loadedColumns } = state

  // Store actions - use refs to stabilize dependencies
  const setDatabasesRef = useRef(useConnectionStore.getState().setDatabases)
  const setSchemasRef = useRef(useConnectionStore.getState().setSchemas)
  const setTablesRef = useRef(useConnectionStore.getState().setTables)
  const setColumnsRef = useRef(useConnectionStore.getState().setColumns)

  const loadDatabases = useCallback(async () => {
    if (loadedDatabases) return

    treeLogger.debug('loading databases', { connectionId })
    const timer = createTimer(treeLogger, 'load databases')
    dispatch({ type: 'SET_LOADING_DATABASES', loading: true })
    try {
      const dbs = await getDatabases(connectionId)
      timer.end({ count: dbs.length })
      setDatabasesRef.current(connectionId, dbs)
      dispatch({ type: 'SET_LOADED_DATABASES' })
    } catch (e) {
      timer.fail(e)
      toast.error('Failed to load databases', {
        description: formatErrorMessage(e),
      })
    } finally {
      dispatch({ type: 'SET_LOADING_DATABASES', loading: false })
    }
  }, [connectionId, loadedDatabases, dispatch])

  const loadSchemas = useCallback(
    async (database: string) => {
      if (loadedSchemas.has(database)) return

      treeLogger.debug('loading schemas', { connectionId, database })
      const timer = createTimer(treeLogger, 'load schemas')
      dispatch({ type: 'SET_LOADING_SCHEMAS', database, loading: true })
      try {
        const schms = await fetchSchemas(connectionId, database)
        timer.end({ database, count: schms.length })
        setSchemasRef.current(connectionId, database, schms)
        dispatch({ type: 'SET_LOADED_SCHEMAS', database })
      } catch (e) {
        timer.fail(e)
        toast.error('Failed to load schemas', {
          description: formatErrorMessage(e),
        })
      } finally {
        dispatch({ type: 'SET_LOADING_SCHEMAS', database, loading: false })
      }
    },
    [connectionId, loadedSchemas, dispatch],
  )

  const loadTables = useCallback(
    async (database: string, schema: string) => {
      const cacheKey = schema ? `${database}.${schema}` : database
      if (loadedTables.has(cacheKey)) return

      treeLogger.debug('loading tables', { connectionId, database, schema })
      const timer = createTimer(treeLogger, 'load tables')
      dispatch({ type: 'SET_LOADING_TABLES', cacheKey, loading: true })
      try {
        const tbls = await fetchTables(connectionId, database, schema)
        timer.end({ schema: cacheKey, count: tbls.length })
        setTablesRef.current(connectionId, cacheKey, tbls)
        dispatch({ type: 'SET_LOADED_TABLES', cacheKey })
      } catch (e) {
        timer.fail(e)
        toast.error('Failed to load tables', {
          description: formatErrorMessage(e),
        })
      } finally {
        dispatch({ type: 'SET_LOADING_TABLES', cacheKey, loading: false })
      }
    },
    [connectionId, loadedTables, dispatch],
  )

  const loadColumns = useCallback(
    async (database: string, schema: string, table: string) => {
      const key = schema ? `${database}.${schema}.${table}` : `${database}.${table}`
      if (loadedColumns.has(key)) return

      treeLogger.debug('loading columns', { connectionId, table: key })
      const timer = createTimer(treeLogger, 'load columns')
      dispatch({ type: 'SET_LOADING_COLUMNS', key, loading: true })
      try {
        const cols = await fetchColumns(connectionId, database, schema, table)
        const pkColumns = cols.filter((c) => c.key === 'PRI').map((c) => c.name)
        timer.end({ table: key, count: cols.length, primaryKeys: pkColumns })
        setColumnsRef.current(connectionId, key, cols)
        dispatch({ type: 'SET_LOADED_COLUMNS', key })
      } catch (e) {
        timer.fail(e)
        toast.error('Failed to load columns', {
          description: formatErrorMessage(e),
        })
      } finally {
        dispatch({ type: 'SET_LOADING_COLUMNS', key, loading: false })
      }
    },
    [connectionId, loadedColumns, dispatch],
  )

  // Force refresh (bypasses loaded checks)
  const refreshTables = useCallback(
    async (database: string, schema: string) => {
      const cacheKey = schema ? `${database}.${schema}` : database
      dispatch({ type: 'SET_LOADING_TABLES', cacheKey, loading: true })
      try {
        const tbls = await fetchTables(connectionId, database, schema)
        setTablesRef.current(connectionId, cacheKey, tbls)
      } catch (e) {
        console.error('Failed to refresh tables:', e)
        toast.error('Failed to refresh tables', {
          description: formatErrorMessage(e),
        })
      } finally {
        dispatch({ type: 'SET_LOADING_TABLES', cacheKey, loading: false })
      }
    },
    [connectionId, dispatch],
  )

  const refreshColumns = useCallback(
    async (database: string, schema: string, table: string) => {
      const key = schema ? `${database}.${schema}.${table}` : `${database}.${table}`
      dispatch({ type: 'SET_LOADING_COLUMNS', key, loading: true })
      try {
        const cols = await fetchColumns(connectionId, database, schema, table)
        setColumnsRef.current(connectionId, key, cols)
      } catch (e) {
        console.error('Failed to refresh columns:', e)
        toast.error('Failed to refresh columns', {
          description: formatErrorMessage(e),
        })
      } finally {
        dispatch({ type: 'SET_LOADING_COLUMNS', key, loading: false })
      }
    },
    [connectionId, dispatch],
  )

  return { loadDatabases, loadSchemas, loadTables, loadColumns, refreshTables, refreshColumns }
}

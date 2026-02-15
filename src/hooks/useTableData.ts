import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createTimer, tableLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import { quoteIdentifier } from '@/lib/sql-generator'
import { buildWhereClause } from '@/lib/sql-utils'
import { executeQuery, getColumns } from '@/lib/tauri'
import { ensureMinimumToastDuration } from '@/lib/toast-utils'
import { useConnectionStore } from '@/stores/connection'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import type { ActiveConnection, DatabaseDriver, FilterCondition, QueryTab } from '@/types'

const PAGE_SIZE = 100

export function useTableData(
  tabId: string,
  tab: QueryTab | undefined,
  connection: ActiveConnection | null | undefined,
) {
  // Store actions - use refs to stabilize dependencies
  const setQueryResultRef = useRef(useConnectionStore.getState().setQueryResult)
  const setQueryErrorRef = useRef(useConnectionStore.getState().setQueryError)
  const setQueryExecutingRef = useRef(useConnectionStore.getState().setQueryExecuting)
  const setTablePageRef = useRef(useConnectionStore.getState().setTablePage)
  const setTableTotalRowsRef = useRef(useConnectionStore.getState().setTableTotalRows)
  const initTableEditStateRef = useRef(useConnectionStore.getState().initTableEditState)
  const showTableDetailsRef = useRef(useRightSidebarStore.getState().showTableDetails)

  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Use ref for filters to stabilize callbacks
  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Extract stable primitive values
  const tableName = tab?.tableName
  const databaseName = tab?.databaseName
  const schemaName = tab?.schemaName
  const runtimeConnectionId = connection?.connectionId
  const driver: DatabaseDriver | undefined = connection?.info.driver

  // Track if this tab is active
  const activeTabId = useConnectionStore((s) => s.activeTabId)
  const isActiveTab = activeTabId === tabId

  // Store column details in a ref for reuse when switching tabs
  const columnsRef = useRef<Awaited<ReturnType<typeof getColumns>> | null>(null)

  // Fetch column details to get primary key information
  useEffect(() => {
    async function fetchColumnDetails() {
      if (!runtimeConnectionId || !tableName || !databaseName) return

      try {
        const schema = schemaName || databaseName
        const cols = await getColumns(runtimeConnectionId, databaseName, schema, tableName)
        columnsRef.current = cols

        const pkCols = cols.filter((c) => c.key === 'PRI').map((c) => c.name)
        initTableEditStateRef.current(tabId, pkCols)

        showTableDetailsRef.current(tableName, cols, databaseName, schemaName)
      } catch (e) {
        console.error('Failed to fetch column details:', e)
      }
    }

    fetchColumnDetails()
  }, [runtimeConnectionId, tableName, databaseName, schemaName, tabId])

  // Update sidebar context when this tab becomes active
  useEffect(() => {
    if (isActiveTab && columnsRef.current && tableName && databaseName) {
      showTableDetailsRef.current(tableName, columnsRef.current, databaseName, schemaName)
    }
  }, [isActiveTab, tableName, databaseName, schemaName])

  // Load data for the current page
  const loadPage = useCallback(
    async (pageNumber: number, currentFilters?: FilterCondition[]) => {
      if (!runtimeConnectionId || !tableName || !databaseName) return

      const activeFilters = currentFilters ?? filtersRef.current
      const offset = pageNumber * PAGE_SIZE
      const tableRef = schemaName
        ? `${quoteIdentifier(schemaName, driver)}.${quoteIdentifier(tableName, driver)}`
        : `${quoteIdentifier(databaseName, driver)}.${quoteIdentifier(tableName, driver)}`
      const whereClause = buildWhereClause(activeFilters, driver)
      const query = `SELECT * FROM ${tableRef} ${whereClause} LIMIT ${PAGE_SIZE} OFFSET ${offset}`

      const database = schemaName ? databaseName : undefined
      const context = schemaName || databaseName

      tableLogger.debug('loading page', {
        tableName,
        page: pageNumber,
        filterCount: activeFilters.length,
      })
      const timer = createTimer(tableLogger, `load page ${pageNumber}`)
      setQueryExecutingRef.current(tabId, true)

      try {
        const result = await executeQuery(runtimeConnectionId, query, database, context)
        timer.end({ rowCount: result.rows.length })
        setQueryResultRef.current(tabId, result)
        setTablePageRef.current(tabId, pageNumber)
      } catch (e) {
        timer.fail(e)
        setQueryErrorRef.current(tabId, formatErrorMessage(e))
      }
    },
    [runtimeConnectionId, tableName, databaseName, schemaName, tabId, driver],
  )

  // Load total row count
  const loadTotalRows = useCallback(
    async (currentFilters?: FilterCondition[]) => {
      if (!runtimeConnectionId || !tableName || !databaseName) return

      const activeFilters = currentFilters ?? filtersRef.current
      const tableRef = schemaName
        ? `${quoteIdentifier(schemaName, driver)}.${quoteIdentifier(tableName, driver)}`
        : `${quoteIdentifier(databaseName, driver)}.${quoteIdentifier(tableName, driver)}`

      const database = schemaName ? databaseName : undefined
      const context = schemaName || databaseName

      const whereClause = buildWhereClause(activeFilters, driver)
      const timer = createTimer(tableLogger, 'load total rows')
      try {
        const countQuery = `SELECT COUNT(*) as count FROM ${tableRef} ${whereClause}`
        const result = await executeQuery(runtimeConnectionId, countQuery, database, context)
        if (result.rows.length > 0) {
          const count = Number(result.rows[0][0])
          timer.end({ totalRows: count })
          setTableTotalRowsRef.current(tabId, count)
        }
      } catch (e) {
        timer.fail(e)
      }
    },
    [runtimeConnectionId, tableName, databaseName, schemaName, tabId, driver],
  )

  // Extract more stable values for initial load effect
  const tabResult = tab?.result
  const tabIsExecuting = tab?.isExecuting
  const tabPage = tab?.page

  // Load initial data and count
  useEffect(() => {
    if (tableName && !tabResult && !tabIsExecuting && !hasLoaded) {
      setHasLoaded(true)
      loadPage(tabPage ?? 0)
      loadTotalRows()
    }
  }, [tableName, tabResult, tabIsExecuting, tabPage, hasLoaded, loadPage, loadTotalRows])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    tableLogger.debug('refreshing table', { tableName, page: tabPage ?? 0 })
    const timer = createTimer(tableLogger, 'table refresh')
    setIsRefreshing(true)
    const startTime = Date.now()
    const toastId = toast.loading('Refreshing table data...')

    try {
      await Promise.all([loadPage(tabPage ?? 0), loadTotalRows()])

      await ensureMinimumToastDuration(startTime)
      timer.end()
      toast.success('Table refreshed', { id: toastId })
    } catch (e) {
      timer.fail(e)
      toast.error('Failed to refresh table', {
        id: toastId,
        description: formatErrorMessage(e),
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [loadPage, loadTotalRows, tabPage, tableName])

  return {
    filters,
    setFilters,
    isRefreshing,
    loadPage,
    loadTotalRows,
    handleRefresh,
    runtimeConnectionId,
    driver,
    tableName,
    databaseName,
    schemaName,
    tabResult,
    tabIsExecuting,
    tabPage,
    PAGE_SIZE,
  }
}

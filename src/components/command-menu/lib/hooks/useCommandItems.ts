import { useEffect, useMemo } from 'react'
import { listQueryHistory, listSavedQueries } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import { useQueryHistoryStore } from '@/stores/query-history'
import { useSavedQueriesStore } from '@/stores/saved-queries'
import {
  type CommandDatabaseItem,
  type CommandItems,
  type CommandTableItem,
  MAX_HISTORY_ITEMS,
  type Page,
} from '..'
import { truncateQuery } from '../utils'

/**
 * Subscribes to the connection / saved-query / history stores and derives the
 * grouped item lists rendered by the command palette. Also lazy-loads saved
 * queries and history the first time the palette opens on the main page.
 */
export function useCommandItems(open: boolean, page: Page): CommandItems {
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const queryTabs = useConnectionStore((s) => s.queryTabs)
  const activeTabId = useConnectionStore((s) => s.activeTabId)
  const schemaCache = useConnectionStore((s) => s.schemaCache)

  const savedQueries = useSavedQueriesStore((s) => s.queries)
  const setSavedQueries = useSavedQueriesStore((s) => s.setQueries)
  const historyEntries = useQueryHistoryStore((s) => s.entries)
  const setHistoryEntries = useQueryHistoryStore((s) => s.setEntries)

  // Lazy-load saved queries & history when the palette opens on main page
  useEffect(() => {
    if (!open || page !== 'main') return
    if (savedQueries.length === 0) {
      listSavedQueries()
        .then(setSavedQueries)
        .catch(() => {})
    }
    if (historyEntries.length === 0) {
      listQueryHistory(undefined, MAX_HISTORY_ITEMS)
        .then(setHistoryEntries)
        .catch(() => {})
    }
  }, [open, page, savedQueries.length, historyEntries.length, setSavedQueries, setHistoryEntries])

  const tabItems = useMemo(() => {
    return queryTabs.map((tab) => {
      const conn = activeConnections.find((c) => c.id === tab.connectionId)
      const connName = conn?.info.name ?? 'Unknown'
      const db = tab.databaseName ?? conn?.selectedDatabase
      return {
        id: tab.id,
        label: tab.tableName ?? 'Query',
        isTable: !!tab.tableName,
        connectionName: connName,
        database: db,
        isActive: tab.id === activeTabId,
        value: `tab:${tab.tableName ?? 'query'} ${connName} ${db ?? ''}`,
      }
    })
  }, [queryTabs, activeConnections, activeTabId])

  const { activeItems, disconnectedItems } = useMemo(() => {
    const activeIds = new Set(activeConnections.map((c) => c.id))
    return {
      activeItems: activeConnections.map((c) => ({
        ...c,
        value: `conn:${c.info.name} ${c.info.host} ${c.info.driver} active`,
      })),
      disconnectedItems: savedConnections
        .filter((c) => !activeIds.has(c.id))
        .map((c) => ({
          ...c,
          value: `conn:${c.name} ${c.host} ${c.driver} saved`,
        })),
    }
  }, [activeConnections, savedConnections])

  const tableItems = useMemo<CommandTableItem[]>(() => {
    const items: CommandTableItem[] = []

    for (const conn of activeConnections) {
      const cache = schemaCache[conn.connectionId]
      if (!cache) continue

      for (const [cacheKey, tables] of Object.entries(cache.tables)) {
        const dotIdx = cacheKey.indexOf('.')
        const database = dotIdx >= 0 ? cacheKey.slice(0, dotIdx) : cacheKey
        const schemaFromKey = dotIdx >= 0 ? cacheKey.slice(dotIdx + 1) : undefined

        for (const table of tables) {
          const schema = table.schema || schemaFromKey
          items.push({
            key: `${conn.id}-${cacheKey}-${table.name}`,
            connectionId: conn.id,
            runtimeConnectionId: conn.connectionId,
            connectionName: conn.info.name,
            database,
            schema,
            tableName: table.name,
            value: `table:${table.name} ${database} ${schema ?? ''} ${conn.info.name}`,
          })
        }
      }
    }

    return items
  }, [activeConnections, schemaCache])

  const newTabDatabaseItems = useMemo<CommandDatabaseItem[]>(() => {
    const items: CommandDatabaseItem[] = []

    for (const conn of activeConnections) {
      const cache = schemaCache[conn.connectionId]
      if (!cache) continue

      for (const db of cache.databases) {
        items.push({
          key: `newtab-${conn.id}-${db.name}`,
          connectionId: conn.id,
          runtimeConnectionId: conn.connectionId,
          connectionName: conn.info.name,
          database: db.name,
          value: `newtab:${db.name} ${conn.info.name} query`,
        })
      }
    }

    return items
  }, [activeConnections, schemaCache])

  const newTabTableItems = useMemo<CommandTableItem[]>(() => {
    const items: CommandTableItem[] = []

    for (const conn of activeConnections) {
      const cache = schemaCache[conn.connectionId]
      if (!cache) continue

      for (const [cacheKey, tables] of Object.entries(cache.tables)) {
        const dotIdx = cacheKey.indexOf('.')
        const database = dotIdx >= 0 ? cacheKey.slice(0, dotIdx) : cacheKey
        const schemaFromKey = dotIdx >= 0 ? cacheKey.slice(dotIdx + 1) : undefined

        for (const table of tables) {
          const schema = table.schema || schemaFromKey
          items.push({
            key: `newtab-table-${conn.id}-${cacheKey}-${table.name}`,
            connectionId: conn.id,
            runtimeConnectionId: conn.connectionId,
            connectionName: conn.info.name,
            database,
            schema,
            tableName: table.name,
            value: `newtab:${table.name} ${database} ${schema ?? ''} ${conn.info.name} table`,
          })
        }
      }
    }

    return items
  }, [activeConnections, schemaCache])

  const savedQueryItems = useMemo(() => {
    return savedQueries.map((q) => ({
      ...q,
      preview: truncateQuery(q.query, 80),
      value: `saved:${q.name} ${q.query.slice(0, 100)} ${q.description ?? ''}`,
    }))
  }, [savedQueries])

  const historyItems = useMemo(() => {
    return historyEntries.slice(0, MAX_HISTORY_ITEMS).map((e) => ({
      ...e,
      preview: truncateQuery(e.query, 80),
      value: `history:${e.id} ${e.query.slice(0, 100)} ${e.connectionName} ${e.databaseName ?? ''}`,
    }))
  }, [historyEntries])

  return {
    tabItems,
    activeItems,
    disconnectedItems,
    tableItems,
    newTabDatabaseItems,
    newTabTableItems,
    savedQueryItems,
    historyItems,
  }
}

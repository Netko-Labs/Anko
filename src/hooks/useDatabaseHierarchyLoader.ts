import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { formatErrorMessage } from '@/lib/error-utils'
import { getDatabases, getSchemas, getTables } from '@/lib/tauri'
import { useConnectionStore } from '@/stores/connection'
import type { ActiveConnection } from '@/types'

interface UseDatabaseHierarchyLoaderParams {
  open: boolean
  mode: 'query' | 'table'
}

export function useDatabaseHierarchyLoader({ open, mode }: UseDatabaseHierarchyLoaderParams) {
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const schemaCache = useConnectionStore((s) => s.schemaCache)

  const setDatabasesRef = useRef(useConnectionStore.getState().setDatabases)
  const setSchemasRef = useRef(useConnectionStore.getState().setSchemas)
  const setTablesRef = useRef(useConnectionStore.getState().setTables)

  const [selectedConnectionId, setSelectedConnectionId] = useState('')
  const [selectedDatabase, setSelectedDatabaseState] = useState('')
  const [selectedSchema, setSelectedSchema] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false)
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false)
  const [isLoadingTables, setIsLoadingTables] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedConnectionId('')
      setSelectedDatabaseState('')
      setSelectedSchema('')
      setSelectedTable('')
      return
    }

    if (activeConnections.length === 0) {
      setSelectedConnectionId('')
      return
    }

    const hasSelected = activeConnections.some(
      (connection) => connection.id === selectedConnectionId,
    )
    if (!selectedConnectionId || !hasSelected) {
      setSelectedConnectionId(activeConnections[0].id)
    }
  }, [open, selectedConnectionId, activeConnections])

  useEffect(() => {
    if (!open) return
    setSelectedDatabaseState('')
    setSelectedSchema('')
    setSelectedTable('')
  }, [open, selectedConnectionId])

  const selectedConnection = useMemo<ActiveConnection | undefined>(() => {
    return activeConnections.find((connection) => connection.id === selectedConnectionId)
  }, [activeConnections, selectedConnectionId])

  const runtimeConnectionId = selectedConnection?.connectionId
  const driver = selectedConnection?.info.driver
  const connectionCache = runtimeConnectionId ? schemaCache[runtimeConnectionId] : undefined
  const databases = connectionCache?.databases || []

  const schemas = useMemo(() => {
    if (!runtimeConnectionId || !selectedDatabase) return []
    return schemaCache[runtimeConnectionId]?.schemas[selectedDatabase] || []
  }, [runtimeConnectionId, schemaCache, selectedDatabase])

  const tablesKey = useMemo(() => {
    if (!selectedDatabase) return ''
    if (driver === 'postgresql') {
      return selectedSchema ? `${selectedDatabase}.${selectedSchema}` : ''
    }
    return selectedDatabase
  }, [driver, selectedDatabase, selectedSchema])

  const tables = useMemo(() => {
    if (!runtimeConnectionId || !tablesKey) return []
    return schemaCache[runtimeConnectionId]?.tables[tablesKey] || []
  }, [runtimeConnectionId, schemaCache, tablesKey])

  // Load databases
  useEffect(() => {
    if (!open || !runtimeConnectionId) return

    if (databases.length > 0) {
      if (!selectedDatabase) {
        const fallback = selectedConnection?.selectedDatabase || databases[0]?.name || ''
        setSelectedDatabaseState(fallback)
      }
      return
    }

    setIsLoadingDatabases(true)
    getDatabases(runtimeConnectionId)
      .then((dbs) => {
        setDatabasesRef.current(runtimeConnectionId, dbs)
        if (!selectedDatabase) {
          const fallback = selectedConnection?.selectedDatabase || dbs[0]?.name || ''
          setSelectedDatabaseState(fallback)
        }
      })
      .catch((e) => {
        console.error('Failed to load databases:', e)
        toast.error('Failed to load databases', { description: formatErrorMessage(e) })
      })
      .finally(() => setIsLoadingDatabases(false))
  }, [
    open,
    runtimeConnectionId,
    databases.length,
    selectedDatabase,
    selectedConnection?.selectedDatabase,
  ])

  // Load schemas (PostgreSQL)
  useEffect(() => {
    if (!open || mode !== 'table') return
    if (driver !== 'postgresql') return
    if (!runtimeConnectionId || !selectedDatabase) return

    if (schemas.length > 0) {
      if (!selectedSchema) {
        const fallback =
          schemas.find((schema) => schema.name === 'public')?.name || schemas[0]?.name
        setSelectedSchema(fallback || '')
      }
      return
    }

    setIsLoadingSchemas(true)
    getSchemas(runtimeConnectionId, selectedDatabase)
      .then((loadedSchemas) => {
        setSchemasRef.current(runtimeConnectionId, selectedDatabase, loadedSchemas)
        if (!selectedSchema) {
          const fallback =
            loadedSchemas.find((schema) => schema.name === 'public')?.name ||
            loadedSchemas[0]?.name ||
            ''
          setSelectedSchema(fallback)
        }
      })
      .catch((e) => {
        console.error('Failed to load schemas:', e)
        toast.error('Failed to load schemas', { description: formatErrorMessage(e) })
      })
      .finally(() => setIsLoadingSchemas(false))
  }, [open, mode, driver, runtimeConnectionId, selectedDatabase, schemas.length, selectedSchema])

  // Load tables
  useEffect(() => {
    if (!open || mode !== 'table') return
    if (!runtimeConnectionId || !selectedDatabase) return
    if (driver === 'postgresql' && !selectedSchema) return
    if (!tablesKey) return

    if (tables.length > 0) {
      if (!selectedTable) {
        setSelectedTable(tables[0]?.name || '')
      }
      return
    }

    const schema = driver === 'postgresql' ? selectedSchema : ''
    setIsLoadingTables(true)
    getTables(runtimeConnectionId, selectedDatabase, schema)
      .then((loadedTables) => {
        setTablesRef.current(runtimeConnectionId, tablesKey, loadedTables)
        if (!selectedTable) {
          setSelectedTable(loadedTables[0]?.name || '')
        }
      })
      .catch((e) => {
        console.error('Failed to load tables:', e)
        toast.error('Failed to load tables', { description: formatErrorMessage(e) })
      })
      .finally(() => setIsLoadingTables(false))
  }, [
    open,
    mode,
    runtimeConnectionId,
    selectedDatabase,
    selectedSchema,
    driver,
    tablesKey,
    tables.length,
    selectedTable,
  ])

  // Reset table/schema on database change
  useEffect(() => {
    if (!open) return
    setSelectedTable('')
    if (driver === 'postgresql') {
      setSelectedSchema('')
    }
  }, [open, selectedDatabase, driver])

  // Reset table on schema change
  useEffect(() => {
    if (!open || mode !== 'table') return
    setSelectedTable('')
  }, [open, mode, selectedSchema])

  return {
    activeConnections,
    selectedConnectionId,
    setSelectedConnectionId,
    selectedConnection,
    selectedDatabase,
    setSelectedDatabaseState,
    selectedSchema,
    setSelectedSchema,
    selectedTable,
    setSelectedTable,
    databases,
    schemas,
    tables,
    driver,
    isLoadingDatabases,
    isLoadingSchemas,
    isLoadingTables,
  }
}

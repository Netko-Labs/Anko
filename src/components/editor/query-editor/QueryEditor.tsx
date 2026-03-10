import { IconDatabase, IconDeviceFloppy, IconServer } from '@tabler/icons-react'
import { ChevronDown, ChevronRight, Loader2Icon, PlayIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useQueryExecution } from '@/hooks/useQueryExecution'
import { createTimer, editorLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import { getDatabases } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import { useWorkspaceStore } from '@/stores/workspace'
import type { QueryEditorTabProps } from '../definitions'
import { SaveQueryDialog } from '../save-query-dialog/SaveQueryDialog'
import type { SchemaContext } from '../sql-autocomplete'
import { SQLEditor } from '../sql-editor/SQLEditor'

export function QueryEditor({ tabId }: QueryEditorTabProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Data selectors
  const queryTabs = useConnectionStore((s) => s.queryTabs)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const schemaCache = useConnectionStore((s) => s.schemaCache)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)

  // Refs for store actions
  const updateQueryTabRef = useRef(useConnectionStore.getState().updateQueryTab)
  const setSelectedDatabaseRef = useRef(useConnectionStore.getState().setSelectedDatabase)
  const setDatabasesRef = useRef(useConnectionStore.getState().setDatabases)

  // Derive tab and connection
  const tab = useMemo(() => queryTabs.find((t) => t.id === tabId), [queryTabs, tabId])
  const connection = useMemo(
    () => activeConnections.find((c) => c.id === tab?.connectionId),
    [activeConnections, tab?.connectionId],
  )
  const workspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  )

  const connectionId = connection?.connectionId
  const connectionInfoId = connection?.id
  const selectedDatabase = connection?.selectedDatabase
  const schemaCacheForConnection = connectionId ? schemaCache[connectionId] : undefined
  const connectionName = connection?.info.name ?? ''

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

  const handleConnectionChange = useCallback(
    (newConnectionInfoId: string) => {
      updateQueryTabRef.current(tabId, { connectionId: newConnectionInfoId })
    },
    [tabId],
  )

  // Query execution hook
  const { queryRef, handleExecute } = useQueryExecution({
    tabId,
    connectionId,
    connectionInfoId,
    connectionName,
    selectedDatabase,
    query: tab?.query,
  })

  const handleChange = useCallback(
    (value: string) => {
      updateQueryTabRef.current(tabId, { query: value })
    },
    [tabId],
  )

  // Save query dialog
  const { handleOpenSaveDialog, dialog: saveDialog } = SaveQueryDialog({
    open: saveDialogOpen,
    onOpenChange: setSaveDialogOpen,
    queryRef,
    activeWorkspaceId,
    connectionInfoId,
    selectedDatabase,
  })

  if (!tab || !connection) return null

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1 text-xs">
          <span className={workspace?.name ? 'text-foreground/80' : 'text-muted-foreground/70'}>
            {workspace?.name || '—'}
          </span>

          <ChevronRight className="size-3 text-muted-foreground" />

          {/* Connection selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 px-2 py-1 text-foreground/80 hover:text-foreground hover:bg-accent rounded transition-colors"
              render={<button type="button" />}
            >
              <IconServer className="size-3.5 text-emerald-500" />
              <span
                className={connection.info.name ? 'text-foreground/80' : 'text-muted-foreground/70'}
              >
                {connection.info.name || '—'}
              </span>
              {connection.info.host && (
                <span className="text-muted-foreground">({connection.info.host})</span>
              )}
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {activeConnections.length === 0 ? (
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  No active connections
                </DropdownMenuItem>
              ) : (
                activeConnections.map((conn) => (
                  <DropdownMenuItem
                    key={conn.id}
                    onClick={() => handleConnectionChange(conn.id)}
                    className="text-xs text-foreground/90"
                  >
                    <IconServer className="size-3.5 mr-2 text-emerald-500/70" />
                    <span>{conn.info.name}</span>
                    <span className="text-muted-foreground ml-1">({conn.info.host})</span>
                    {conn.id === connectionInfoId && (
                      <span className="ml-auto text-emerald-500">●</span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRight className="size-3 text-muted-foreground" />

          {/* Database selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 px-2 py-1 text-foreground/80 hover:text-foreground hover:bg-accent rounded transition-colors"
              render={<button type="button" />}
            >
              <IconDatabase className="size-3.5 text-primary" />
              <span
                className={selectedDatabase ? 'text-foreground/80' : 'text-muted-foreground/70'}
              >
                {selectedDatabase || '—'}
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {databases.length === 0 ? (
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  No databases available
                </DropdownMenuItem>
              ) : (
                databases.map((db) => (
                  <DropdownMenuItem
                    key={db.name}
                    onClick={() => handleDatabaseChange(db.name)}
                    className="text-xs text-foreground/90"
                  >
                    <IconDatabase className="size-3.5 mr-2 text-primary/70" />
                    {db.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSaveDialog}
            disabled={!tab.query.trim()}
            className="h-7 px-2.5 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            title="Save Query"
          >
            <IconDeviceFloppy className="size-3.5" />
            Save
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={tab.isExecuting || !tab.query.trim()}
                  className="h-7 px-3 gap-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                >
                  {tab.isExecuting ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <PlayIcon className="size-3" />
                      Run
                    </>
                  )}
                  <ChevronDown className="size-3 ml-0.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExecute} className="text-xs text-foreground/90">
                <PlayIcon className="size-3.5 mr-2" />
                Run All
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs text-foreground/90">
                <PlayIcon className="size-3.5 mr-2" />
                Run Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <SQLEditor
          value={tab.query}
          onChange={handleChange}
          onExecute={handleExecute}
          driver={connection.info.driver}
          selectedDatabase={selectedDatabase}
          schema={schema}
        />
      </div>

      {/* Save Query Dialog */}
      {saveDialog}
    </div>
  )
}

import {
  IconCheck,
  IconClock,
  IconCode,
  IconDatabase,
  IconDeviceDesktop,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconMoon,
  IconPlug,
  IconPlugConnected,
  IconPlus,
  IconSun,
  IconTable,
  IconX,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useTheme } from '@/components/theme/ThemeProvider'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { formatErrorMessage } from '@/lib/error-utils'
import { connect, getConnectionConfig, listQueryHistory, listSavedQueries } from '@/lib/rpc'
import { ensureMinimumToastDuration } from '@/lib/toast-utils'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connection'
import { useLeftSidebarStore } from '@/stores/left-sidebar'
import { useQueryHistoryStore } from '@/stores/query-history'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import { useSavedQueriesStore } from '@/stores/saved-queries'
import type { ActiveConnection, ConnectionInfo } from '@/types'

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Custom filter with group-based search priorities.
 * Item values are prefixed with `group:` so the filter can
 * assign higher scores to more relevant categories.
 *
 * Priority (highest first):
 *   tab=4, table=3, conn=3, action=3, saved=2, theme=2, history=1
 */
function priorityFilter(value: string, search: string): number {
  const colonIdx = value.indexOf(':')
  const group = colonIdx >= 0 ? value.slice(0, colonIdx) : ''
  const text = colonIdx >= 0 ? value.slice(colonIdx + 1) : value

  if (!text.toLowerCase().includes(search.toLowerCase())) return 0

  const priorities: Record<string, number> = {
    tab: 4,
    table: 3,
    conn: 3,
    action: 3,
    saved: 2,
    theme: 2,
    history: 1,
  }
  return priorities[group] ?? 1
}

const MAX_HISTORY_ITEMS = 10

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const { theme, setTheme } = useTheme()

  // Connection store
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const queryTabs = useConnectionStore((s) => s.queryTabs)
  const activeTabId = useConnectionStore((s) => s.activeTabId)
  const setActiveTabId = useConnectionStore((s) => s.setActiveTabId)
  const addQueryTab = useConnectionStore((s) => s.addQueryTab)
  const addTableTab = useConnectionStore((s) => s.addTableTab)
  const schemaCache = useConnectionStore((s) => s.schemaCache)

  // Saved queries & history stores
  const savedQueries = useSavedQueriesStore((s) => s.queries)
  const setSavedQueries = useSavedQueriesStore((s) => s.setQueries)
  const historyEntries = useQueryHistoryStore((s) => s.entries)
  const setHistoryEntries = useQueryHistoryStore((s) => s.setEntries)

  // Sidebar stores
  const toggleLeftSidebar = useLeftSidebarStore((s) => s.toggle)
  const toggleRightSidebar = useRightSidebarStore((s) => s.toggle)

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // Lazy-load saved queries & history when the palette opens
  useEffect(() => {
    if (!open) return
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
  }, [open, savedQueries.length, historyEntries.length, setSavedQueries, setHistoryEntries])

  const runAndClose = useCallback(
    (fn: () => void) => {
      fn()
      onOpenChange(false)
    },
    [onOpenChange],
  )

  // ── Derive current connection from active tab ──────────────
  const currentConnection = useMemo(() => {
    if (!activeTabId) return activeConnections[0] ?? null
    const tab = queryTabs.find((t) => t.id === activeTabId)
    if (!tab) return activeConnections[0] ?? null
    return activeConnections.find((c) => c.id === tab.connectionId) ?? activeConnections[0] ?? null
  }, [activeTabId, queryTabs, activeConnections])

  // ── Tab items ──────────────────────────────────────────────
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

  // ── Connection items (active + saved-disconnected) ─────────
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

  // ── Table items from schema cache ──────────────────────────
  const tableItems = useMemo(() => {
    const items: {
      key: string
      connectionId: string
      runtimeConnectionId: string
      connectionName: string
      database: string
      schema: string | undefined
      tableName: string
      value: string
    }[] = []

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

  // ── Saved query items ──────────────────────────────────────
  const savedQueryItems = useMemo(() => {
    return savedQueries.map((q) => ({
      ...q,
      preview: truncateQuery(q.query, 80),
      value: `saved:${q.name} ${q.query.slice(0, 100)} ${q.description ?? ''}`,
    }))
  }, [savedQueries])

  // ── History items (capped) ─────────────────────────────────
  const historyItems = useMemo(() => {
    return historyEntries.slice(0, MAX_HISTORY_ITEMS).map((e) => ({
      ...e,
      preview: truncateQuery(e.query, 80),
      value: `history:${e.id} ${e.query.slice(0, 100)} ${e.connectionName} ${e.databaseName ?? ''}`,
    }))
  }, [historyEntries])

  // ── Handlers ───────────────────────────────────────────────
  const handleConnect = useCallback(
    async (info: ConnectionInfo) => {
      onOpenChange(false)
      const startTime = Date.now()
      const toastId = toast.loading('Connecting...', {
        description: `Connecting to "${info.name}"`,
      })
      try {
        const config = await getConnectionConfig(info.id)
        const connectionId = await connect(config)
        const active: ActiveConnection = {
          id: info.id,
          connectionId,
          info,
          selectedDatabase: info.database,
        }
        useConnectionStore.getState().addActiveConnection(active)
        await ensureMinimumToastDuration(startTime)
        toast.success('Connected', {
          id: toastId,
          description: `Successfully connected to "${info.name}"`,
        })
      } catch (e) {
        toast.error('Connection failed', {
          id: toastId,
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

  const handleNewQuery = useCallback(() => {
    if (currentConnection) {
      addQueryTab({
        id: `query-${Date.now()}`,
        connectionId: currentConnection.id,
        query: '',
        isExecuting: false,
      })
    } else {
      toast.info('No active connection', {
        description: 'Connect to a database first.',
      })
    }
    onOpenChange(false)
  }, [currentConnection, addQueryTab, onOpenChange])

  const handleOpenTable = useCallback(
    (item: (typeof tableItems)[number]) => {
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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      <Command filter={priorityFilter}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList className="max-h-96">
          <CommandEmpty>No results found.</CommandEmpty>

          {/* ── Open Tabs ─────────────────────────────────── */}
          {tabItems.length > 0 && (
            <CommandGroup heading="Open Tabs">
              {tabItems.map((tab) => (
                <CommandItem
                  key={tab.id}
                  value={tab.value}
                  onSelect={() => runAndClose(() => setActiveTabId(tab.id))}
                >
                  {tab.isTable ? (
                    <IconTable className="size-4 text-muted-foreground" />
                  ) : (
                    <IconDatabase className="size-4 text-muted-foreground" />
                  )}
                  <span className={cn(tab.isActive && 'font-medium')}>{tab.label}</span>
                  <span className="text-muted-foreground truncate">
                    {tab.connectionName}
                    {tab.database && ` / ${tab.database}`}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* ── Connections ────────────────────────────────── */}
          {(activeItems.length > 0 || disconnectedItems.length > 0) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Connections">
                {activeItems.map((conn) => (
                  <CommandItem
                    key={conn.id}
                    value={conn.value}
                    onSelect={() => onOpenChange(false)}
                  >
                    <IconPlugConnected className="size-4 text-green-500" />
                    <span>{conn.info.name}</span>
                    <span className="text-muted-foreground truncate">
                      {conn.info.host}:{conn.info.port}
                    </span>
                    <CommandShortcut className="text-green-500/80">Connected</CommandShortcut>
                  </CommandItem>
                ))}
                {disconnectedItems.map((conn) => (
                  <CommandItem
                    key={conn.id}
                    value={conn.value}
                    onSelect={() => handleConnect(conn)}
                  >
                    <IconPlug className="size-4 text-muted-foreground" />
                    <span>{conn.name}</span>
                    <span className="text-muted-foreground truncate">
                      {conn.host}:{conn.port}
                    </span>
                    <CommandShortcut>Connect</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* ── Tables ─────────────────────────────────────── */}
          {tableItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Tables">
                {tableItems.map((item) => (
                  <CommandItem
                    key={item.key}
                    value={item.value}
                    onSelect={() => handleOpenTable(item)}
                  >
                    <IconTable className="size-4 text-muted-foreground" />
                    <span>{item.tableName}</span>
                    <span className="text-muted-foreground truncate">
                      {item.connectionName} / {item.database}
                      {item.schema && ` / ${item.schema}`}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* ── Saved Queries ──────────────────────────────── */}
          {savedQueryItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Saved Queries">
                {savedQueryItems.map((q) => (
                  <CommandItem
                    key={q.id}
                    value={q.value}
                    onSelect={() => handleOpenQuery(q.query, q.name, q.connectionId)}
                  >
                    <IconCode className="size-4 text-primary/70" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{q.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate">
                        {q.preview}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* ── History ────────────────────────────────────── */}
          {historyItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent History">
                {historyItems.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={entry.value}
                    onSelect={() =>
                      handleOpenQuery(entry.query, 'History query', entry.connectionId)
                    }
                  >
                    {entry.success ? (
                      <IconCheck className="size-4 text-green-500" />
                    ) : (
                      <IconX className="size-4 text-destructive" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono truncate text-[11px]">{entry.preview}</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <IconClock className="size-2.5" />
                        {entry.connectionName}
                        {entry.databaseName && ` / ${entry.databaseName}`}
                        {entry.executionTimeMs != null && ` · ${entry.executionTimeMs}ms`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />

          {/* ── Actions ────────────────────────────────────── */}
          <CommandGroup heading="Actions">
            <CommandItem value="action:new query editor" onSelect={handleNewQuery}>
              <IconPlus className="size-4 text-muted-foreground" />
              New Query
            </CommandItem>
            <CommandItem
              value="action:toggle left sidebar"
              onSelect={() => runAndClose(toggleLeftSidebar)}
            >
              <IconLayoutSidebar className="size-4 text-muted-foreground" />
              Toggle Left Sidebar
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="action:toggle right sidebar inspector"
              onSelect={() => runAndClose(toggleRightSidebar)}
            >
              <IconLayoutSidebarRight className="size-4 text-muted-foreground" />
              Toggle Right Sidebar
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* ── Theme ──────────────────────────────────────── */}
          <CommandGroup heading="Theme">
            <CommandItem
              value="theme:light"
              data-checked={theme === 'light' || undefined}
              onSelect={() => runAndClose(() => setTheme('light'))}
            >
              <IconSun className="size-4 text-muted-foreground" />
              Light
            </CommandItem>
            <CommandItem
              value="theme:dark"
              data-checked={theme === 'dark' || undefined}
              onSelect={() => runAndClose(() => setTheme('dark'))}
            >
              <IconMoon className="size-4 text-muted-foreground" />
              Dark
            </CommandItem>
            <CommandItem
              value="theme:system auto"
              data-checked={theme === 'system' || undefined}
              onSelect={() => runAndClose(() => setTheme('system'))}
            >
              <IconDeviceDesktop className="size-4 text-muted-foreground" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

function truncateQuery(query: string, maxLen: number): string {
  const trimmed = query.trim().replace(/\s+/g, ' ')
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}...` : trimmed
}

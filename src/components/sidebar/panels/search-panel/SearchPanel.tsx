import {
  IconCheck,
  IconClock,
  IconCode,
  IconPlug,
  IconPlugConnected,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { listQueryHistory, listSavedQueries } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import { useQueryHistoryStore } from '@/stores/query-history'
import { useSavedQueriesStore } from '@/stores/saved-queries'

const MAX_HISTORY_RESULTS = 10

export function SearchPanel() {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Stores
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const savedQueries = useSavedQueriesStore((s) => s.queries)
  const setSavedQueries = useSavedQueriesStore((s) => s.setQueries)
  const historyEntries = useQueryHistoryStore((s) => s.entries)
  const setHistoryEntries = useQueryHistoryStore((s) => s.setEntries)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Lazy-load saved queries & history if stores are empty
  useEffect(() => {
    if (savedQueries.length === 0) {
      listSavedQueries().then(setSavedQueries).catch(() => {})
    }
    if (historyEntries.length === 0) {
      listQueryHistory(undefined, 100).then(setHistoryEntries).catch(() => {})
    }
  }, [savedQueries.length, historyEntries.length, setSavedQueries, setHistoryEntries])

  const search = query.trim().toLowerCase()

  // Connections (active + saved) — high priority
  const connectionResults = useMemo(() => {
    if (!search) return []
    const activeIds = new Set(activeConnections.map((c) => c.id))

    return savedConnections.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.host.toLowerCase().includes(search) ||
        c.database?.toLowerCase().includes(search),
    ).map((c) => ({
      ...c,
      isActive: activeIds.has(c.id),
    }))
  }, [search, savedConnections, activeConnections])

  // Saved queries — high priority
  const savedQueryResults = useMemo(() => {
    if (!search) return []
    return savedQueries.filter(
      (q) =>
        q.name.toLowerCase().includes(search) ||
        q.query.toLowerCase().includes(search) ||
        q.description?.toLowerCase().includes(search),
    )
  }, [search, savedQueries])

  // History — low priority, capped
  const historyResults = useMemo(() => {
    if (!search) return []
    return historyEntries
      .filter(
        (e) =>
          e.query.toLowerCase().includes(search) ||
          e.connectionName.toLowerCase().includes(search) ||
          e.databaseName?.toLowerCase().includes(search),
      )
      .slice(0, MAX_HISTORY_RESULTS)
  }, [search, historyEntries])

  const hasResults =
    connectionResults.length > 0 || savedQueryResults.length > 0 || historyResults.length > 0

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center border-b border-border px-3 h-8">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Search</span>
      </div>
      {/* Search input */}
      <div className="border-b border-border px-3 py-2">
        <Input
          ref={inputRef}
          placeholder="Connections, queries, history..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-0.5">
          {!search && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Type to search across connections, saved queries, and history.
            </div>
          )}

          {search && !hasResults && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}

          {/* Connections */}
          {connectionResults.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] text-primary/60 font-medium uppercase tracking-wide">
                Connections ({connectionResults.length})
              </div>
              {connectionResults.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center gap-2 px-2 py-1 rounded-sm text-xs hover:bg-muted/60"
                >
                  {conn.isActive ? (
                    <IconPlugConnected className="size-3.5 text-green-500 shrink-0" />
                  ) : (
                    <IconPlug className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate" title={conn.name}>{conn.name}</span>
                  <span className="text-muted-foreground text-[10px] truncate ml-auto" title={`${conn.host}:${conn.port}`}>
                    {conn.host}:{conn.port}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Saved Queries */}
          {savedQueryResults.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] text-primary/60 font-medium uppercase tracking-wide">
                Saved Queries ({savedQueryResults.length})
              </div>
              {savedQueryResults.map((q) => (
                <div
                  key={q.id}
                  className="px-2 py-1.5 rounded-sm text-xs hover:bg-muted/60"
                >
                  <div className="flex items-center gap-1.5">
                    <IconCode className="size-3.5 text-primary/70 shrink-0" />
                    <span className="truncate font-medium" title={q.name}>{q.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate mt-0.5 pl-5">
                    {q.query.trim().replace(/\s+/g, ' ').slice(0, 80)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {historyResults.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] text-primary/60 font-medium uppercase tracking-wide">
                History ({historyResults.length}{historyResults.length === MAX_HISTORY_RESULTS ? '+' : ''})
              </div>
              {historyResults.map((entry) => (
                <div
                  key={entry.id}
                  className="px-2 py-1.5 rounded-sm text-xs hover:bg-muted/60"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {entry.success ? (
                      <IconCheck className="size-3 text-green-500 shrink-0" />
                    ) : (
                      <IconX className="size-3 text-destructive shrink-0" />
                    )}
                    <IconClock className="size-2.5" />
                    <span className="truncate">
                      {entry.connectionName}
                      {entry.databaseName && ` / ${entry.databaseName}`}
                    </span>
                    {entry.executionTimeMs != null && (
                      <span className="ml-auto text-muted-foreground/80 shrink-0">
                        {entry.executionTimeMs}ms
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] truncate text-foreground/90 mt-0.5 pl-5">
                    {entry.query.trim().replace(/\s+/g, ' ').slice(0, 100)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

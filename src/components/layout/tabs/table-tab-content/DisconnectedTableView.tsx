import { IconDatabaseOff, IconPlugConnected } from '@tabler/icons-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ResultsTable } from '@/components/results/results-table/ResultsTable'
import { connectSaved } from '@/lib/connect'
import { formatErrorMessage } from '@/lib/error-utils'
import { useConnectionStore } from '@/stores/connection'
import type { QueryResult } from '@/types'

/**
 * Read-only view for a restored table tab whose connection isn't live yet. Shows
 * the persisted snapshot (if any) behind an amber "reconnect to refresh" banner.
 * Reconnecting flips the tab back to the full editable view (TableTabContent),
 * which then re-fetches via the stale-refresh effect in useTableData.
 */
export function DisconnectedTableView({
  connectionId,
  result,
}: {
  connectionId: string
  result?: QueryResult
}) {
  const info = useConnectionStore((s) => s.savedConnections.find((c) => c.id === connectionId))
  const [connecting, setConnecting] = useState(false)

  const handleReconnect = async () => {
    if (!info) return
    setConnecting(true)
    try {
      await connectSaved(info)
    } catch (e) {
      toast.error('Connection failed', { description: formatErrorMessage(e) })
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs">
        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
        <span className="text-muted-foreground">
          {result
            ? 'Showing a snapshot from your last session. Reconnect to refresh and edit.'
            : 'Disconnected. Reconnect to load this table.'}
        </span>
        <button
          type="button"
          onClick={handleReconnect}
          disabled={connecting || !info}
          className="ml-auto inline-flex items-center gap-1 rounded px-2 py-0.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 disabled:opacity-50 transition-colors"
        >
          <IconPlugConnected className="size-3.5" />
          {connecting ? 'Reconnecting…' : 'Reconnect'}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {result ? (
          <ResultsTable result={result} isExecuting={false} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <IconDatabaseOff className="size-8 opacity-40" />
            <span className="text-sm">No data — reconnect to load this table.</span>
          </div>
        )}
      </div>
    </div>
  )
}

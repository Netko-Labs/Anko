import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { connectSaved } from '@/lib/connect'
import { formatErrorMessage } from '@/lib/error-utils'
import { deleteConnection } from '@/lib/rpc'
import { ensureMinimumToastDuration, resolveToast } from '@/lib/toast-utils'
import { useConnectionStore } from '@/stores/connection'
import type { ActiveConnection, ConnectionInfo } from '@/types'
import { DatabaseTree } from '../../tree'
import { DisconnectedConnection } from './disconnected-connection'
import type { DatabasesPanelProps } from './lib'

export function DatabasesPanel({
  activeWorkspace,
  onNewConnection,
  onEditConnection,
  onConnectionSelect,
}: DatabasesPanelProps) {
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [connectedExpanded, setConnectedExpanded] = useState(true)
  const [reconnectExpanded, setReconnectExpanded] = useState(true)
  const [savedExpanded, setSavedExpanded] = useState(true)

  // Connection store
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  // Connections that were live in this workspace's last session, awaiting a
  // manual reconnect (restored by the session loader, see lib/session.ts).
  const pendingReconnect = useConnectionStore((s) => s.pendingReconnect)

  // Get connections filtered by workspace
  const workspaceConnections = useMemo(() => {
    if (!activeWorkspace) return savedConnections
    return savedConnections.filter((conn) => activeWorkspace.connection_ids.includes(conn.id))
  }, [savedConnections, activeWorkspace])

  // Split into connected / pending-reconnect / saved.
  const { connectedList, reconnectList, disconnectedList } = useMemo(() => {
    const connected: { conn: ConnectionInfo; active: ActiveConnection }[] = []
    const reconnect: ConnectionInfo[] = []
    const disconnected: ConnectionInfo[] = []
    const pendingIds = new Set(pendingReconnect.map((p) => p.connectionId))

    for (const conn of workspaceConnections) {
      const activeConn = activeConnections.find((c) => c.id === conn.id)
      if (activeConn) {
        connected.push({ conn, active: activeConn })
      } else if (pendingIds.has(conn.id)) {
        reconnect.push(conn)
      } else {
        disconnected.push(conn)
      }
    }

    return { connectedList: connected, reconnectList: reconnect, disconnectedList: disconnected }
  }, [workspaceConnections, activeConnections, pendingReconnect])

  // Handle connect
  const handleConnect = async (info: ConnectionInfo) => {
    const existing = activeConnections.find((c) => c.id === info.id)
    if (existing) return // Already connected

    setConnectingId(info.id)

    const startTime = Date.now()
    const toastId = toast.loading('Connecting...', {
      description: `Connecting to "${info.name}" at ${info.host}:${info.port}`,
    })

    try {
      const active = await connectSaved(info)
      onConnectionSelect?.(active)

      // Ensure toast displays for minimum duration
      await ensureMinimumToastDuration(startTime)

      resolveToast.success(toastId, 'Connected', {
        description: `Successfully connected to "${info.name}"`,
      })
    } catch (e) {
      console.error('Failed to connect:', e)

      resolveToast.error(toastId, 'Connection failed', {
        description: formatErrorMessage(e),
      })
    } finally {
      setConnectingId(null)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    const connection = savedConnections.find((c) => c.id === id)
    const connectionName = connection?.name || 'connection'

    try {
      await deleteConnection(id)
      useConnectionStore.getState().removeSavedConnection(id)

      toast.success('Connection deleted', {
        description: `"${connectionName}" has been removed`,
      })
    } catch (e) {
      console.error('Failed to delete:', e)

      toast.error('Failed to delete connection', {
        description: formatErrorMessage(e),
      })
    }
  }

  // Handle text insertion (for editor autocomplete)
  const handleInsertText = (text: string) => {
    // This would need to communicate with the active editor
    // For now, we'll just log it. Integration would happen via a global event or store.
    console.log('Insert text:', text)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="group/header flex items-center justify-between border-b border-border px-3 h-8">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          Connections
        </span>
        <button
          type="button"
          onClick={onNewConnection}
          className="size-5 rounded flex items-center justify-center text-primary/70 hover:text-primary transition-colors"
          title="New Connection"
        >
          <IconPlus className="size-3.5" />
        </button>
      </div>

      {/* Tree content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-0.5">
          {workspaceConnections.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No connections yet</div>
          ) : (
            <>
              {/* Connected section */}
              {connectedList.length > 0 && (
                <Collapsible open={connectedExpanded} onOpenChange={setConnectedExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-1 px-1.5 py-0.5 w-full hover:bg-accent/50 rounded-sm cursor-pointer select-none">
                    <IconChevronRight
                      className={`size-2.5 text-muted-foreground transition-transform ${
                        connectedExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="size-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Active ({connectedList.length})
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {connectedList.map(({ conn, active }) => (
                      <DatabaseTree
                        key={conn.id}
                        connection={active}
                        onEdit={() => onEditConnection(conn)}
                        onDelete={() => handleDelete(conn.id)}
                        onInsertText={handleInsertText}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Reconnect section — connected last session, awaiting reconnect */}
              {reconnectList.length > 0 && (
                <Collapsible open={reconnectExpanded} onOpenChange={setReconnectExpanded}>
                  {connectedList.length > 0 && <div className="h-1" />}
                  <CollapsibleTrigger className="flex items-center gap-1 px-1.5 py-0.5 w-full hover:bg-accent/50 rounded-sm cursor-pointer select-none">
                    <IconChevronRight
                      className={`size-2.5 text-muted-foreground transition-transform ${
                        reconnectExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Reconnect ({reconnectList.length})
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {reconnectList.map((conn) => (
                      <DisconnectedConnection
                        key={conn.id}
                        connection={conn}
                        isConnecting={connectingId === conn.id}
                        onConnect={() => handleConnect(conn)}
                        onEdit={() => onEditConnection(conn)}
                        onDelete={() => handleDelete(conn.id)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Saved section */}
              {disconnectedList.length > 0 && (
                <Collapsible open={savedExpanded} onOpenChange={setSavedExpanded}>
                  {(connectedList.length > 0 || reconnectList.length > 0) && (
                    <div className="h-1" />
                  )}
                  <CollapsibleTrigger className="flex items-center gap-1 px-1.5 py-0.5 w-full hover:bg-accent/50 rounded-sm cursor-pointer select-none">
                    <IconChevronRight
                      className={`size-2.5 text-muted-foreground transition-transform ${
                        savedExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Saved ({disconnectedList.length})
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {disconnectedList.map((conn) => (
                      <DisconnectedConnection
                        key={conn.id}
                        connection={conn}
                        isConnecting={connectingId === conn.id}
                        onConnect={() => handleConnect(conn)}
                        onEdit={() => onEditConnection(conn)}
                        onDelete={() => handleDelete(conn.id)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

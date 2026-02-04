import {
  IconChevronRight,
  IconDatabase,
  IconPencil,
  IconPlugConnected,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatErrorMessage } from '@/lib/error-utils'
import { connect, deleteConnection, getConnectionConfig } from '@/lib/tauri'
import { ensureMinimumToastDuration } from '@/lib/toast-utils'
import { useConnectionStore } from '@/stores/connection'
import type { ActiveConnection, ConnectionInfo, Workspace } from '@/types'
import { DatabaseTree, DatabaseTypeIcon, TreeNode } from '../tree'

interface DatabasesPanelProps {
  workspaces: Workspace[]
  activeWorkspace?: Workspace
  onNewConnection: () => void
  onEditConnection: (connection: ConnectionInfo) => void
  onConnectionSelect?: (connection: ActiveConnection) => void
}

export function DatabasesPanel({
  activeWorkspace,
  onNewConnection,
  onEditConnection,
  onConnectionSelect,
}: DatabasesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [connectedExpanded, setConnectedExpanded] = useState(true)
  const [savedExpanded, setSavedExpanded] = useState(true)

  // Connection store
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  const activeConnections = useConnectionStore((s) => s.activeConnections)

  // Get connections filtered by workspace
  const workspaceConnections = useMemo(() => {
    if (!activeWorkspace) return savedConnections
    return savedConnections.filter((conn) => activeWorkspace.connection_ids.includes(conn.id))
  }, [savedConnections, activeWorkspace])

  // Filter by search
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return workspaceConnections
    const query = searchQuery.toLowerCase()
    return workspaceConnections.filter(
      (conn) =>
        conn.name.toLowerCase().includes(query) ||
        conn.host.toLowerCase().includes(query) ||
        conn.database?.toLowerCase().includes(query),
    )
  }, [workspaceConnections, searchQuery])

  // Separate connected and disconnected connections
  const { connectedList, disconnectedList } = useMemo(() => {
    const connected: { conn: ConnectionInfo; active: ActiveConnection }[] = []
    const disconnected: ConnectionInfo[] = []

    for (const conn of filteredConnections) {
      const activeConn = activeConnections.find((c) => c.id === conn.id)
      if (activeConn) {
        connected.push({ conn, active: activeConn })
      } else {
        disconnected.push(conn)
      }
    }

    return { connectedList: connected, disconnectedList: disconnected }
  }, [filteredConnections, activeConnections])

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
      const config = await getConnectionConfig(info.id)
      const connectionId = await connect(config)

      const active: ActiveConnection = {
        id: info.id,
        connectionId,
        info,
        selectedDatabase: info.database,
      }

      useConnectionStore.getState().addActiveConnection(active)
      onConnectionSelect?.(active)

      // Ensure toast displays for minimum duration
      await ensureMinimumToastDuration(startTime)

      toast.success('Connected', {
        id: toastId,
        description: `Successfully connected to "${info.name}"`,
      })
    } catch (e) {
      console.error('Failed to connect:', e)

      toast.error('Connection failed', {
        id: toastId,
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
      <div className="flex flex-col gap-3 border-b border-border/50 px-3 py-3">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground text-sm font-semibold tracking-tight">Connections</div>
          <button
            type="button"
            onClick={onNewConnection}
            className="size-7 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow glow-primary"
            title="New Connection"
          >
            <IconPlus className="size-4" />
          </button>
        </div>
        <Input
          placeholder="Search connections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-border/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Tree content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {filteredConnections.length === 0 ? (
            <div className="p-6 text-center animate-fade-in">
              <div className="size-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3 border border-border/50">
                <IconDatabase className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {searchQuery ? 'No matches found' : 'No connections yet'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {searchQuery ? 'Try a different search' : 'Click + to add one'}
              </p>
            </div>
          ) : (
            <>
              {/* Connected section */}
              {connectedList.length > 0 && (
                <Collapsible open={connectedExpanded} onOpenChange={setConnectedExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-1.5 px-2 py-1.5 w-full hover:bg-accent/30 rounded-lg cursor-pointer select-none transition-colors duration-200">
                    <IconChevronRight
                      className={`size-3 text-muted-foreground transition-transform duration-200 ${
                        connectedExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[11px] text-foreground/80 font-medium tracking-wide">
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

              {/* Saved section */}
              {disconnectedList.length > 0 && (
                <Collapsible open={savedExpanded} onOpenChange={setSavedExpanded}>
                  {connectedList.length > 0 && <div className="h-2" />}
                  <CollapsibleTrigger className="flex items-center gap-1.5 px-2 py-1.5 w-full hover:bg-accent/30 rounded-lg cursor-pointer select-none transition-colors duration-200">
                    <IconChevronRight
                      className={`size-3 text-muted-foreground transition-transform duration-200 ${
                        savedExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="size-2 rounded-full bg-muted-foreground/40" />
                    <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
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

interface DisconnectedConnectionProps {
  connection: ConnectionInfo
  isConnecting: boolean
  onConnect: () => void
  onEdit: () => void
  onDelete: () => void
}

function DisconnectedConnection({
  connection,
  isConnecting,
  onConnect,
  onEdit,
  onDelete,
}: DisconnectedConnectionProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <TreeNode
          label={connection.name}
          secondaryLabel={`${connection.host}:${connection.port}`}
          icon={
            <DatabaseTypeIcon
              driver={connection.driver}
              className="size-4 text-muted-foreground/50"
            />
          }
          isExpandable={false}
          isLoading={isConnecting}
          onClick={onConnect}
          onDoubleClick={onConnect}
          level={0}
          className="opacity-70 hover:opacity-100"
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onConnect}>
          <IconPlugConnected className="size-4 mr-2" />
          Connect
        </ContextMenuItem>
        <ContextMenuItem onClick={onEdit}>
          <IconPencil className="size-4 mr-2" />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} variant="destructive">
          <IconTrash className="size-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

import { Loader2, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatErrorMessage } from '@/lib/error-utils'
import { connect, deleteConnection, getConnectionConfig } from '@/lib/rpc'
import { ensureMinimumToastDuration, resolveToast } from '@/lib/toast-utils'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connection'
import type { ActiveConnection, ConnectionInfo } from '@/types'
import { ConnectionDialog } from '../connection-dialog/ConnectionDialog'
import type { ConnectionListProps } from '../definitions'

export function ConnectionList({ onConnectionSelect }: ConnectionListProps) {
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  const activeConnections = useConnectionStore((s) => s.activeConnections)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editConnection, setEditConnection] = useState<ConnectionInfo | undefined>()
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = async () => {
    const ids = savedConnections.filter((c) => selectedIds.has(c.id)).map((c) => c.id)
    if (ids.length === 0) return
    setBulkDeleting(true)
    const startTime = Date.now()
    const toastId = toast.loading(`Deleting ${ids.length} connection${ids.length > 1 ? 's' : ''}...`)

    try {
      for (const id of ids) {
        await deleteConnection(id)
        useConnectionStore.getState().removeSavedConnection(id)
      }
      await ensureMinimumToastDuration(startTime)
      resolveToast.success(toastId, 'Connections deleted', {
        description: `${ids.length} connection${ids.length > 1 ? 's' : ''} removed`,
      })
      clearSelection()
      setConfirmOpen(false)
    } catch (e) {
      console.error('Failed to delete connections:', e)
      resolveToast.error(toastId, 'Failed to delete connections', {
        description: formatErrorMessage(e),
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleConnect = async (info: ConnectionInfo) => {
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
      onConnectionSelect(active)

      // Ensure minimum toast display time before showing success
      await ensureMinimumToastDuration(startTime)
      resolveToast.success(toastId, 'Connected', {
        description: `Connected to "${info.name}"`,
      })
    } catch (e) {
      console.error('Failed to connect:', e)

      // Show error immediately (no delay needed for errors)
      resolveToast.error(toastId, 'Connection failed', {
        description: formatErrorMessage(e),
      })
    } finally {
      setConnectingId(null)
    }
  }

  const handleEdit = (connection: ConnectionInfo) => {
    setEditConnection(connection)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const conn = savedConnections.find((c) => c.id === id)

    const startTime = Date.now()
    const toastId = toast.loading('Deleting connection...', {
      description: conn ? `Removing "${conn.name}"` : 'Removing connection',
    })

    try {
      await deleteConnection(id)
      useConnectionStore.getState().removeSavedConnection(id)
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })

      // Ensure minimum toast display time before showing success
      await ensureMinimumToastDuration(startTime)
      resolveToast.success(toastId, 'Connection deleted', {
        description: conn ? `"${conn.name}" has been removed` : 'Connection removed',
      })
    } catch (e) {
      console.error('Failed to delete:', e)

      // Show error immediately (no delay needed for errors)
      resolveToast.error(toastId, 'Failed to delete connection', {
        description: formatErrorMessage(e),
      })
    }
  }

  const handleNewConnection = () => {
    setEditConnection(undefined)
    setDialogOpen(true)
  }

  const isConnected = (id: string) => activeConnections.some((c) => c.id === id)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={handleNewConnection} className="w-full">
          + New Connection
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="px-3 py-2 border-b flex items-center justify-between gap-2 bg-muted/40">
          <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={clearSelection}
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {savedConnections.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No saved connections.
              <br />
              Click "New Connection" to add one.
            </div>
          ) : (
            savedConnections.map((conn) => {
              const showMenu = hoveredId === conn.id || menuOpenId === conn.id
              return (
                <div
                  key={conn.id}
                  className={cn(
                    'group flex items-center gap-2 p-2 rounded-md hover:bg-accent',
                    selectedIds.has(conn.id) && 'bg-accent',
                  )}
                  onPointerEnter={() => setHoveredId(conn.id)}
                  onPointerLeave={() => setHoveredId(null)}
                >
                  <Checkbox
                    checked={selectedIds.has(conn.id)}
                    onCheckedChange={(checked) => toggleSelected(conn.id, checked === true)}
                    aria-label={`Select ${conn.name}`}
                    className={cn(
                      'shrink-0 transition-opacity',
                      selectedIds.size > 0 || selectedIds.has(conn.id)
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleConnect(conn)}
                    disabled={connectingId === conn.id || isConnected(conn.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      {connectingId === conn.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      ) : (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isConnected(conn.id) ? 'bg-green-500' : 'bg-muted'
                          }`}
                        />
                      )}
                      <span className="font-medium text-sm">{conn.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {conn.host}:{conn.port}
                      {conn.database && ` / ${conn.database}`}
                    </div>
                  </button>

                  {showMenu && (
                    <DropdownMenu
                      open={menuOpenId === conn.id}
                      onOpenChange={(open) => setMenuOpenId(open ? conn.id : null)}
                    >
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground">
                        ⋮
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(conn)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(conn.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <ConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editConnection={editConnection}
      />

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !bulkDeleting && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} connection{selectedIds.size > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected connection
              {selectedIds.size > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={bulkDeleting} onClick={handleBulkDelete}>
              {bulkDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

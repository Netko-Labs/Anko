import { IconPlus } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createSavedQuery, deleteSavedQuery, listSavedQueries, updateSavedQuery } from '@/lib/tauri'
import { useConnectionStore } from '@/stores/connection'
import { useSavedQueriesStore } from '@/stores/saved-queries'
import { useWorkspaceStore } from '@/stores/workspace'
import type { SavedQuery } from '@/types'
import { SaveQueryDialog } from './SaveQueryDialog'
import { SavedQueryItem } from './SavedQueryItem'

export function SavedQueriesPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null)

  const queries = useSavedQueriesStore((s) => s.queries)
  const setQueries = useSavedQueriesStore((s) => s.setQueries)
  const addQuery = useSavedQueriesStore((s) => s.addQuery)
  const updateQueryInStore = useSavedQueriesStore((s) => s.updateQuery)
  const removeQuery = useSavedQueriesStore((s) => s.removeQuery)
  const isLoading = useSavedQueriesStore((s) => s.isLoading)
  const setLoading = useSavedQueriesStore((s) => s.setLoading)

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const addQueryTab = useConnectionStore((s) => s.addQueryTab)

  useEffect(() => {
    const loadQueries = async () => {
      setLoading(true)
      try {
        const savedQueries = await listSavedQueries()
        setQueries(savedQueries)
      } catch (e) {
        console.error('Failed to load saved queries:', e)
        toast.error('Failed to load saved queries')
      } finally {
        setLoading(false)
      }
    }
    loadQueries()
  }, [setQueries, setLoading])

  const filteredQueries = useMemo(() => {
    let filtered = queries

    if (activeWorkspaceId && activeWorkspaceId !== 'default') {
      filtered = filtered.filter(
        (q) => q.workspaceId === activeWorkspaceId || q.workspaceId === null,
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (q) =>
          q.name.toLowerCase().includes(query) ||
          q.query.toLowerCase().includes(query) ||
          q.description?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [queries, searchQuery, activeWorkspaceId])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSavedQuery(id)
        removeQuery(id)
        toast.success('Query deleted')
      } catch (e) {
        console.error('Failed to delete saved query:', e)
        toast.error('Failed to delete query')
      }
    },
    [removeQuery],
  )

  const handleCopy = useCallback((query: string) => {
    navigator.clipboard.writeText(query)
    toast.success('Copied to clipboard')
  }, [])

  const handleOpenInEditor = useCallback(
    (savedQuery: SavedQuery) => {
      let activeConn = savedQuery.connectionId
        ? activeConnections.find((c) => c.id === savedQuery.connectionId)
        : activeConnections[0]

      if (!activeConn && activeConnections.length > 0) {
        activeConn = activeConnections[0]
      }

      if (activeConn) {
        const tabId = `saved-${savedQuery.id}-${Date.now()}`
        addQueryTab({
          id: tabId,
          connectionId: activeConn.id,
          query: savedQuery.query,
          isExecuting: false,
        })
        toast.success('Opened in editor')
      } else {
        navigator.clipboard.writeText(savedQuery.query)
        toast.info('No active connection', {
          description: 'Query copied to clipboard. Connect to a database first.',
        })
      }
    },
    [activeConnections, addQueryTab],
  )

  const handleNewQuery = () => {
    setEditingQuery(null)
    setDialogOpen(true)
  }

  const handleEditQuery = (query: SavedQuery) => {
    setEditingQuery(query)
    setDialogOpen(true)
  }

  const handleSaveQuery = async (name: string, query: string, description: string) => {
    try {
      if (editingQuery) {
        const updated = await updateSavedQuery(editingQuery.id, {
          name,
          query,
          description: description || null,
        })
        updateQueryInStore(editingQuery.id, updated)
        toast.success('Query updated')
      } else {
        const created = await createSavedQuery({
          name,
          query,
          description: description || null,
          workspaceId: activeWorkspaceId !== 'default' ? activeWorkspaceId : null,
          connectionId: null,
          databaseName: null,
        })
        addQuery(created)
        toast.success('Query saved')
      }
      setDialogOpen(false)
    } catch (e) {
      console.error('Failed to save query:', e)
      toast.error('Failed to save query')
    }
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex flex-col gap-2 border-b px-3 py-2.5">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-sm font-medium">Saved Queries</div>
            <button
              type="button"
              onClick={handleNewQuery}
              className="size-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
              title="New Saved Query"
            >
              <IconPlus className="size-3.5" />
            </button>
          </div>
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-0.5">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filteredQueries.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No matching queries' : 'No saved queries yet'}
              </div>
            ) : (
              filteredQueries.map((query) => (
                <SavedQueryItem
                  key={query.id}
                  query={query}
                  onDelete={() => handleDelete(query.id)}
                  onCopy={() => handleCopy(query.query)}
                  onOpenInEditor={() => handleOpenInEditor(query)}
                  onEdit={() => handleEditQuery(query)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <SaveQueryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editQuery={editingQuery}
        onSave={handleSaveQuery}
      />
    </>
  )
}

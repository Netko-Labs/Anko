import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { editorLogger } from '@/lib/debug'
import { createSavedQuery } from '@/lib/rpc'
import { useSavedQueriesStore } from '@/stores/saved-queries'
import type { SaveQueryDialogProps } from './definitions'

export function SaveQueryDialog({
  open,
  onOpenChange,
  queryRef,
  activeWorkspaceId,
  connectionInfoId,
  selectedDatabase,
}: SaveQueryDialogProps) {
  const [saveQueryName, setSaveQueryName] = useState('')
  const [saveQueryDescription, setSaveQueryDescription] = useState('')
  const addSavedQuery = useSavedQueriesStore((s) => s.addQuery)

  const handleOpenSaveDialog = useCallback(() => {
    const query = queryRef.current?.trim()
    if (!query) return
    const firstLine = query.split('\n')[0]
    const defaultName = firstLine.length > 30 ? `${firstLine.slice(0, 30)}...` : firstLine
    setSaveQueryName(defaultName)
    setSaveQueryDescription('')
    onOpenChange(true)
  }, [queryRef, onOpenChange])

  const handleSaveQuery = useCallback(async () => {
    const query = queryRef.current?.trim()
    if (!query || !saveQueryName.trim()) return

    try {
      const saved = await createSavedQuery({
        name: saveQueryName.trim(),
        query,
        description: saveQueryDescription.trim() || null,
        workspaceId: activeWorkspaceId !== 'default' ? activeWorkspaceId : null,
        connectionId: connectionInfoId ?? null,
        databaseName: selectedDatabase ?? null,
      })
      addSavedQuery(saved)
      onOpenChange(false)
      toast.success('Query saved', {
        description: 'You can find it in the Saved Queries panel',
      })
    } catch (e) {
      editorLogger.warn('Failed to save query', e)
      toast.error('Failed to save query')
    }
  }, [
    queryRef,
    saveQueryName,
    saveQueryDescription,
    activeWorkspaceId,
    connectionInfoId,
    selectedDatabase,
    addSavedQuery,
    onOpenChange,
  ])

  return {
    handleOpenSaveDialog,
    dialog: (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSaveQuery()
            }}
          >
            <DialogHeader>
              <DialogTitle>Save Query</DialogTitle>
              <DialogDescription>Save this query for quick access later.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="save-query-name">Name</Label>
                <Input
                  id="save-query-name"
                  value={saveQueryName}
                  onChange={(e) => setSaveQueryName(e.target.value)}
                  placeholder="e.g., Get all active users"
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="save-query-description">Description (optional)</Label>
                <Input
                  id="save-query-description"
                  value={saveQueryDescription}
                  onChange={(e) => setSaveQueryDescription(e.target.value)}
                  placeholder="Brief description of what this query does"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!saveQueryName.trim()}>
                Save Query
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    ),
  }
}

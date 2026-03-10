import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import type { SaveQueryDialogProps } from './definitions'

export function SaveQueryDialog({ open, onOpenChange, editQuery, onSave }: SaveQueryDialogProps) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      if (editQuery) {
        setName(editQuery.name)
        setQuery(editQuery.query)
        setDescription(editQuery.description ?? '')
      } else {
        setName('')
        setQuery('')
        setDescription('')
      }
    }
  }, [open, editQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !query.trim()) return
    onSave(name.trim(), query.trim(), description.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editQuery ? 'Edit Query' : 'Save Query'}</DialogTitle>
            <DialogDescription>
              {editQuery
                ? 'Update the saved query details.'
                : 'Save this query for quick access later.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Get all users"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="query">Query</Label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM users WHERE active = 1"
                className="font-mono text-sm min-h-[120px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this query does"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !query.trim()}>
              {editQuery ? 'Save Changes' : 'Save Query'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

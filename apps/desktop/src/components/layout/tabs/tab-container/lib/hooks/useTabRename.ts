import type React from 'react'
import { useRef, useState } from 'react'
import { useConnectionStore } from '@/stores/connection'

export function useTabRename() {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const renameQueryTabRef = useRef(useConnectionStore.getState().renameQueryTab)

  const handleStartRename = (e: React.MouseEvent, tabId: string, currentName: string) => {
    e.stopPropagation()
    setEditingTabId(tabId)
    setEditingName(currentName)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  const handleRenameSubmit = (tabId: string) => {
    const trimmedName = editingName.trim()
    renameQueryTabRef.current(tabId, trimmedName || undefined)
    setEditingTabId(null)
    setEditingName('')
  }

  const handleRenameCancel = () => {
    setEditingTabId(null)
    setEditingName('')
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit(tabId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleRenameCancel()
    }
  }

  return {
    editingTabId,
    editingName,
    setEditingName,
    editInputRef,
    handleStartRename,
    handleRenameSubmit,
    handleRenameCancel,
    handleRenameKeyDown,
  }
}

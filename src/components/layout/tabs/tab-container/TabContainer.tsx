import { IconTable } from '@tabler/icons-react'
import { Code2, Pencil, Plus, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTabDragAndDrop } from '@/hooks/useTabDragAndDrop'
import { useTabRename } from '@/hooks/useTabRename'
import { tabLogger } from '@/lib/debug'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connection'
import { QueryTabContent } from '../query-tab-content/QueryTabContent'
import { TabActionDialog } from '../tab-action-dialog/TabActionDialog'
import { TableTabContent } from '../table-tab-content/TableTabContent'
import { UnsavedChangesDialog } from '../unsaved-changes-dialog/UnsavedChangesDialog'

export function TabContainer() {
  const queryTabs = useConnectionStore((s) => s.queryTabs)
  const activeTabId = useConnectionStore((s) => s.activeTabId)
  const activeConnections = useConnectionStore((s) => s.activeConnections)

  const setActiveTabIdRef = useRef(useConnectionStore.getState().setActiveTabId)
  const removeQueryTabRef = useRef(useConnectionStore.getState().removeQueryTab)
  const discardAllChangesRef = useRef(useConnectionStore.getState().discardAllChanges)

  const [dialogMode, setDialogMode] = useState<'query' | 'table' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'close' | 'switch'
    tabId: string
    targetTabId?: string
  } | null>(null)

  // Tab rename hook
  const {
    editingTabId,
    editingName,
    setEditingName,
    editInputRef,
    handleStartRename,
    handleRenameSubmit,
    handleRenameKeyDown,
  } = useTabRename()

  // Tab drag-and-drop hook
  const { dragState, tabRefs, handleMouseDown } = useTabDragAndDrop(queryTabs, editingTabId)

  const hasTabs = queryTabs.length > 0
  const hasConnections = activeConnections.length > 0

  const getTabWithChanges = useCallback(
    (tabId: string) => {
      const tab = queryTabs.find((t) => t.id === tabId)
      if (tab?.tableName && tab.editState?.pendingChanges?.length) {
        return { tab, changesCount: tab.editState.pendingChanges.length }
      }
      return null
    },
    [queryTabs],
  )

  const tabIndicesByConnection = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    queryTabs.forEach((tab) => {
      if (!map.has(tab.connectionId)) map.set(tab.connectionId, new Map())
      const connMap = map.get(tab.connectionId)!
      connMap.set(tab.id, connMap.size + 1)
    })
    return map
  }, [queryTabs])

  const handleNewQuery = () => {
    if (!hasConnections) {
      toast.error('No active connections', { description: 'Connect to a database first' })
      setMenuOpen(false)
      return
    }
    tabLogger.debug('new query tab requested')
    setDialogMode('query')
    setMenuOpen(false)
  }

  const handleOpenTable = () => {
    if (!hasConnections) {
      toast.error('No active connections', { description: 'Connect to a database first' })
      setMenuOpen(false)
      return
    }
    tabLogger.debug('open table tab requested')
    setDialogMode('table')
    setMenuOpen(false)
  }

  const getTabLabel = (tabId: string, connectionId: string, customName?: string) => {
    if (customName) return customName
    const tabIndex = tabIndicesByConnection.get(connectionId)?.get(tabId) ?? 1
    return `Query #${tabIndex}`
  }

  const handleTabDoubleClick = (
    e: React.MouseEvent,
    tabId: string,
    connectionId: string,
    customName?: string,
  ) => {
    e.stopPropagation()
    const currentLabel = getTabLabel(tabId, connectionId, customName)
    handleStartRename(e, tabId, currentLabel)
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()

    const tabWithChanges = getTabWithChanges(tabId)
    if (tabWithChanges) {
      tabLogger.debug('tab close blocked - unsaved changes', {
        tabId,
        changesCount: tabWithChanges.changesCount,
      })
      setPendingAction({ type: 'close', tabId })
      setShowUnsavedDialog(true)
      return
    }

    tabLogger.debug('tab closed', { tabId })
    removeQueryTabRef.current(tabId)
  }

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTabId) return

    if (activeTabId) {
      const tabWithChanges = getTabWithChanges(activeTabId)
      if (tabWithChanges) {
        tabLogger.debug('tab switch blocked - unsaved changes', {
          fromTabId: activeTabId,
          toTabId: tabId,
        })
        setPendingAction({ type: 'switch', tabId: activeTabId, targetTabId: tabId })
        setShowUnsavedDialog(true)
        return
      }
    }

    tabLogger.debug('tab switched', { fromTabId: activeTabId, toTabId: tabId })
    setActiveTabIdRef.current(tabId)
  }

  const handleDialogDiscard = useCallback(() => {
    if (!pendingAction) return

    tabLogger.debug('changes discarded', { tabId: pendingAction.tabId, action: pendingAction.type })
    discardAllChangesRef.current(pendingAction.tabId)
    setShowUnsavedDialog(false)

    if (pendingAction.type === 'close') {
      removeQueryTabRef.current(pendingAction.tabId)
    } else if (pendingAction.type === 'switch' && pendingAction.targetTabId) {
      setActiveTabIdRef.current(pendingAction.targetTabId)
    }

    setPendingAction(null)
  }, [pendingAction])

  const handleDialogCancel = useCallback(() => {
    setShowUnsavedDialog(false)
    setPendingAction(null)
  }, [])

  const pendingChangesCount = useMemo(() => {
    if (!pendingAction) return 0
    const tab = queryTabs.find((t) => t.id === pendingAction.tabId)
    return tab?.editState?.pendingChanges?.length ?? 0
  }, [pendingAction, queryTabs])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex items-center bg-muted/50 border-b border-border min-w-0">
        <div className="flex items-center gap-0.5 px-1 pt-1 overflow-x-auto flex-1 min-w-0 no-scrollbar">
          {queryTabs.map((tab, index) => {
            const isActive = tab.id === activeTabId
            const isTableTab = tab.tableName !== undefined
            const hasChanges = isTableTab && (tab.editState?.pendingChanges?.length ?? 0) > 0
            const isDragging = dragState.isDragging && dragState.draggedIndex === index
            const isDragOver = dragState.isDragging && dragState.overIndex === index
            const isAnyDragging = dragState.isDragging
            const isEditing = editingTabId === tab.id

            return (
              <div
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(index, el)
                  else tabRefs.current.delete(index)
                }}
                onMouseDown={(e) => handleMouseDown(e, index)}
                onClick={() => {
                  if (!dragState.isDragging && !isEditing) {
                    handleTabClick(tab.id)
                  }
                }}
                onDoubleClick={(e) =>
                  !isTableTab &&
                  !dragState.isDragging &&
                  handleTabDoubleClick(e, tab.id, tab.connectionId, tab.customName)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleTabClick(tab.id)
                }}
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                className={cn(
                  'group relative flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-md border-t border-l border-r transition-all shrink-0 cursor-pointer select-none',
                  isActive
                    ? 'bg-background border-border text-foreground'
                    : 'bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-primary/10 [&:hover_svg]:text-primary',
                  isDragging && 'opacity-50 cursor-grabbing',
                  isDragOver && 'border-l-2 border-l-blue-500 bg-blue-500/10',
                  !isAnyDragging && !isEditing && 'cursor-grab',
                )}
              >
                {/* Active tab bottom indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}
                {isTableTab ? (
                  <IconTable className={cn('size-3.5', isActive && 'text-primary', isAnyDragging && 'pointer-events-none')} />
                ) : (
                  <Code2 className={cn('size-3.5', isActive && 'text-primary', isAnyDragging && 'pointer-events-none')} />
                )}
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, tab.id)}
                    onBlur={() => handleRenameSubmit(tab.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 bg-muted border border-border rounded px-1 py-0.5 text-xs text-foreground outline-none focus:border-ring"
                  />
                ) : (
                  <span className={cn('max-w-32 truncate', isAnyDragging && 'pointer-events-none')}>
                    {isTableTab ? (
                      <>
                        {tab.tableName} <span className="text-muted-foreground">/all</span>
                      </>
                    ) : (
                      getTabLabel(tab.id, tab.connectionId, tab.customName)
                    )}
                  </span>
                )}
                {hasChanges && (
                  <span
                    className={cn(
                      'size-2 rounded-full bg-amber-500',
                      isAnyDragging && 'pointer-events-none',
                    )}
                    title="Unsaved changes"
                  />
                )}
                {!isTableTab && !isEditing && !isAnyDragging && (
                  <button
                    type="button"
                    onClick={(e) =>
                      handleStartRename(
                        e,
                        tab.id,
                        getTabLabel(tab.id, tab.connectionId, tab.customName),
                      )
                    }
                    className={cn(
                      'p-0.5 rounded-sm transition-opacity',
                      isActive
                        ? 'opacity-0 group-hover:opacity-50 hover:opacity-100! hover:bg-muted'
                        : 'opacity-0 group-hover:opacity-50 hover:opacity-100! hover:bg-muted',
                    )}
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
                {!isAnyDragging && (
                  <button
                    type="button"
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className={cn(
                      'ml-1 p-0.5 rounded-sm transition-opacity',
                      isActive
                        ? 'opacity-50 hover:opacity-100 hover:bg-muted'
                        : 'opacity-0 group-hover:opacity-50 hover:opacity-100! hover:bg-muted',
                    )}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* New Tab Button */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            className="flex items-center justify-center size-7 mx-1 rounded-md transition-colors shrink-0 text-primary/70 hover:text-primary hover:bg-primary/10"
            render={<button type="button" />}
          >
            <Plus className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-40">
            <DropdownMenuItem onClick={handleNewQuery}>
              <Code2 className="size-4" />
              New Query
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenTable}>
              <IconTable className="size-4" />
              Open Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {hasTabs ? (
          queryTabs.map((tab) => {
            const isTableTab = tab.tableName !== undefined
            return (
              <div
                key={tab.id}
                className={cn('h-full', tab.id === activeTabId ? 'block' : 'hidden')}
              >
                {isTableTab ? (
                  <TableTabContent tabId={tab.id} />
                ) : (
                  <QueryTabContent tabId={tab.id} />
                )}
              </div>
            )
          })
        ) : (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center max-w-md px-4">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Code2 className="size-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">
                {hasConnections ? 'No tabs open' : 'No active connections'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {hasConnections
                  ? 'Create a new query or open a table to get started'
                  : 'Select a connection from the sidebar to start querying your databases'}
              </p>
            </div>
          </div>
        )}
      </div>

      <TabActionDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'query'}
        onOpenChange={(open: boolean) => {
          if (!open) setDialogMode(null)
        }}
      />

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        changesCount={pendingChangesCount}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
      />
    </div>
  )
}

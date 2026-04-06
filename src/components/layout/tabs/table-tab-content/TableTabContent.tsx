import type { Table } from '@tanstack/react-table'
import { Columns } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { DataTable } from '@/components/results/data-table-component/DataTable'
import { FilterBar } from '@/components/results/filter-bar/FilterBar'
import { ResultsTable } from '@/components/results/results-table/ResultsTable'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTableCommit } from '@/hooks/useTableCommit'
import { useTableData } from '@/hooks/useTableData'
import { useTableEditing } from '@/hooks/useTableEditing'
import { useConnectionStore } from '@/stores/connection'
import type { FilterCondition } from '@/types'
import type { TableTabContentProps } from '../definitions'
import { TableFooter } from '../table-footer/TableFooter'
import { UnsavedChangesDialog } from '../unsaved-changes-dialog/UnsavedChangesDialog'

export function TableTabContent({ tabId }: TableTabContentProps) {
  const tab = useConnectionStore((s) => s.queryTabs.find((t) => t.id === tabId))
  const activeConnections = useConnectionStore((s) => s.activeConnections)

  const connectionId = tab?.connectionId
  const connection = useMemo(
    () => (connectionId ? activeConnections.find((c) => c.id === connectionId) : null),
    [connectionId, activeConnections],
  )

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
  const [tableInstance, setTableInstance] = useState<Table<Record<string, unknown>> | null>(null)

  // Data loading hook
  const tableData = useTableData(tabId, tab, connection)
  const {
    filters,
    setFilters,
    isRefreshing,
    loadPage,
    loadTotalRows,
    handleRefresh,
    runtimeConnectionId,
    driver,
    tableName,
    databaseName,
    schemaName,
    tabResult,
    tabIsExecuting,
    tabPage,
    PAGE_SIZE,
  } = tableData

  // Derived state from tab
  const pendingChanges = useMemo(
    () => tab?.editState?.pendingChanges ?? [],
    [tab?.editState?.pendingChanges],
  )
  const editState = tab?.editState
  const hasChanges = pendingChanges.length > 0
  const primaryKeyColumns = useMemo(
    () => editState?.primaryKeyColumns ?? [],
    [editState?.primaryKeyColumns],
  )
  const canEdit = primaryKeyColumns.length > 0
  const isEditMode = editState?.isEditMode ?? false
  const commitError = editState?.commitError
  const isCommitting = editState?.isCommitting ?? false

  // Editing hook
  const {
    tabColumns,
    handleToggleEditMode: toggleEditMode,
    handleAddRow,
    handleCellEdit,
    handleRowDelete,
    handleUndoRowDelete,
    handleRemoveNewRow,
    handleUpdateNewRowCell,
  } = useTableEditing(tabId, tabResult)

  const handleToggleEditMode = useCallback(() => {
    toggleEditMode(isEditMode)
  }, [toggleEditMode, isEditMode])

  // Commit hook
  const { handleCommit, handleDiscard } = useTableCommit({
    tabId,
    runtimeConnectionId,
    tableName,
    databaseName,
    schemaName,
    driver,
    pendingChanges,
    handleRefresh,
  })

  // Navigation guard for pagination
  const guardedNavigate = useCallback(
    (navigateFn: () => void) => {
      if (hasChanges) {
        setPendingNavigation(() => navigateFn)
        setShowUnsavedDialog(true)
      } else {
        navigateFn()
      }
    },
    [hasChanges],
  )

  const handleDialogDiscard = useCallback(() => {
    handleDiscard()
    setShowUnsavedDialog(false)
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
  }, [handleDiscard, pendingNavigation])

  const handleDialogCancel = useCallback(() => {
    setShowUnsavedDialog(false)
    setPendingNavigation(null)
  }, [])

  // Memoize filter change handler
  const handleFiltersChange = useCallback(
    (newFilters: FilterCondition[]) => {
      if (hasChanges) {
        setPendingNavigation(() => () => {
          setFilters(newFilters)
          loadPage(0, newFilters)
          loadTotalRows(newFilters)
        })
        setShowUnsavedDialog(true)
      } else {
        setFilters(newFilters)
        loadPage(0, newFilters)
        loadTotalRows(newFilters)
      }
    },
    [hasChanges, loadPage, loadTotalRows, setFilters],
  )

  // Pagination state
  const currentPage = tabPage ?? 0
  const totalRows = tab?.totalRows ?? 0
  const totalPages = Math.ceil(totalRows / PAGE_SIZE)

  // Memoize pagination handlers
  const handleFirstPage = useCallback(
    () => guardedNavigate(() => loadPage(0)),
    [guardedNavigate, loadPage],
  )
  const handlePrevPage = useCallback(
    () => guardedNavigate(() => loadPage(Math.max(0, currentPage - 1))),
    [guardedNavigate, loadPage, currentPage],
  )
  const handleNextPage = useCallback(
    () => guardedNavigate(() => loadPage(currentPage + 1)),
    [guardedNavigate, loadPage, currentPage],
  )
  const handleLastPage = useCallback(
    () => guardedNavigate(() => loadPage(Math.max(0, totalPages - 1))),
    [guardedNavigate, loadPage, totalPages],
  )

  // Early return if no tab or connection data
  if (!tableName || !runtimeConnectionId) {
    return null
  }

  const hasNextPage = (currentPage + 1) * PAGE_SIZE < totalRows
  const hasPrevPage = currentPage > 0

  const columnsDropdown = useMemo(() => {
    if (!tableInstance) return null
    const hidable = tableInstance.getAllColumns().filter((col) => col.getCanHide())
    if (hidable.length === 0) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors shrink-0"
          render={<button type="button" />}
        >
          <Columns className="size-3" />
          Columns
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {hidable.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value: boolean | string) => column.toggleVisibility(!!value)}
              className="text-xs"
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }, [tableInstance])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Filter Bar */}
      <FilterBar
        columns={tabColumns}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        startSlot={isEditMode ? columnsDropdown : undefined}
      />

      {/* Table Content */}
      <div className="flex-1 min-h-0">
        {tabResult && isEditMode ? (
          <DataTable
            result={tabResult}
            isEditMode={isEditMode}
            pendingChanges={pendingChanges}
            primaryKeyColumns={primaryKeyColumns}
            onCellEdit={handleCellEdit}
            onRowDelete={handleRowDelete}
            onUndoRowDelete={handleUndoRowDelete}
            onRemoveNewRow={handleRemoveNewRow}
            onUpdateNewRowCell={handleUpdateNewRowCell}
            onTableReady={setTableInstance}
          />
        ) : (
          <ResultsTable result={tabResult} error={tab?.error} isExecuting={!!tabIsExecuting} />
        )}
      </div>

      {/* Footer */}
      <TableFooter
        tabResult={tabResult}
        tabIsExecuting={tabIsExecuting}
        isRefreshing={isRefreshing}
        currentPage={currentPage}
        totalRows={totalRows}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        hasChanges={hasChanges}
        pendingChanges={pendingChanges}
        isEditMode={isEditMode}
        canEdit={canEdit}
        isCommitting={isCommitting}
        commitError={commitError}
        onFirstPage={handleFirstPage}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onLastPage={handleLastPage}
        onRefresh={handleRefresh}
        onToggleEditMode={handleToggleEditMode}
        onAddRow={handleAddRow}
        onCommit={handleCommit}
        onDiscard={handleDiscard}
        pageSize={PAGE_SIZE}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        changesCount={pendingChanges.length}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
      />
    </div>
  )
}

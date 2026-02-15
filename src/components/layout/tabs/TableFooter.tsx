import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PendingRowChange, QueryResult } from '@/types'

interface TableFooterProps {
  tabResult: QueryResult | undefined
  tabIsExecuting: boolean | undefined
  isRefreshing: boolean
  currentPage: number
  totalRows: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  hasChanges: boolean
  pendingChanges: PendingRowChange[]
  isEditMode: boolean
  canEdit: boolean
  isCommitting: boolean
  commitError: string | undefined
  onFirstPage: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onLastPage: () => void
  onRefresh: () => void
  onToggleEditMode: () => void
  onAddRow: () => void
  onCommit: () => void
  onDiscard: () => void
  pageSize: number
}

export function TableFooter({
  tabResult,
  tabIsExecuting,
  isRefreshing,
  currentPage,
  totalRows,
  totalPages,
  hasNextPage,
  hasPrevPage,
  hasChanges,
  pendingChanges,
  isEditMode,
  canEdit,
  isCommitting,
  commitError,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
  onRefresh,
  onToggleEditMode,
  onAddRow,
  onCommit,
  onDiscard,
  pageSize,
}: TableFooterProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-900 bg-zinc-950 text-xs">
      {/* Left: Row Range Info */}
      <div className="flex items-center gap-2 min-w-32">
        {tabIsExecuting ? (
          <span className="text-zinc-500">Loading...</span>
        ) : tabResult ? (
          <>
            <span className="text-zinc-500">
              {totalRows > 0 ? currentPage * pageSize + 1 : 0}-
              {Math.min((currentPage + 1) * pageSize, totalRows)} of {totalRows.toLocaleString()}
            </span>
            {tabResult.execution_time_ms && (
              <span className="text-zinc-600">{tabResult.execution_time_ms}ms</span>
            )}
          </>
        ) : (
          <span className="text-zinc-500">No data</span>
        )}
      </div>

      {/* Center: Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFirstPage}
          disabled={!hasPrevPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevPage}
          disabled={!hasPrevPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" />
        </Button>

        <span className="px-2 text-zinc-400 min-w-24 text-center">
          Page {currentPage + 1} of {totalPages || 1}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
        >
          <ChevronRight className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLastPage}
          disabled={!hasNextPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>

      {/* Right: Commit/Discard + Refresh, Edit, Add Row */}
      <div className="flex items-center gap-1.5 justify-end">
        {hasChanges && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              disabled={isCommitting}
              className="h-6 px-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              title="Discard all changes"
            >
              <X className="size-3.5 mr-1" />
              Discard
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={onCommit}
              disabled={isCommitting}
              className="h-6 px-2.5 text-xs bg-green-600 hover:bg-green-500 text-white"
              title={
                commitError
                  ? `Error: ${commitError}`
                  : `Commit ${pendingChanges.length} change${pendingChanges.length !== 1 ? 's' : ''}`
              }
            >
              {isCommitting ? (
                <Loader2 className="size-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="size-3.5 mr-1" />
              )}
              Commit ({pendingChanges.length})
            </Button>

            <div className="w-px h-4 bg-zinc-800 mx-0.5" />
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing || hasChanges}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
          title={hasChanges ? 'Commit or discard changes first' : 'Refresh'}
        >
          <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
        </Button>

        {canEdit && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleEditMode}
              disabled={hasChanges && isEditMode}
              className={cn(
                'h-6 w-6 p-0',
                isEditMode
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900',
                hasChanges && isEditMode && 'opacity-30',
              )}
              title={
                hasChanges && isEditMode
                  ? 'Commit or discard changes first'
                  : isEditMode
                    ? 'Exit edit mode'
                    : 'Edit mode'
              }
            >
              <Pencil className="size-3.5" />
            </Button>

            {isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddRow}
                className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                title="Add new row"
              >
                <Plus className="size-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

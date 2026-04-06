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
import type { TableFooterProps } from '../definitions'

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
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-card text-xs">
      {/* Left: Row Range Info */}
      <div className="flex items-center gap-2 min-w-32">
        {tabIsExecuting ? (
          <span className="text-muted-foreground">Loading...</span>
        ) : tabResult ? (
          <>
            <span className="text-muted-foreground">
              {totalRows > 0 ? currentPage * pageSize + 1 : 0}-
              {Math.min((currentPage + 1) * pageSize, totalRows)} of {totalRows.toLocaleString()}
            </span>
            {tabResult.execution_time_ms && (
              <span className="text-muted-foreground/80">{tabResult.execution_time_ms}ms</span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">No data</span>
        )}
      </div>

      {/* Center: Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFirstPage}
          disabled={!hasPrevPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevPage}
          disabled={!hasPrevPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" />
        </Button>

        <span className="px-2 text-muted-foreground min-w-24 text-center">
          Page {currentPage + 1} of {totalPages || 1}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
        >
          <ChevronRight className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLastPage}
          disabled={!hasNextPage || !!tabIsExecuting}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
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
              className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
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
              className="h-6 px-2.5 text-xs bg-emerald-600 text-emerald-50 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
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

            <div className="w-px h-4 bg-border mx-0.5" />
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing || hasChanges}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
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
                  ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
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
                className="h-6 w-6 p-0 text-primary/70 hover:text-primary hover:bg-primary/10"
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

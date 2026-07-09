import type { PendingRowChange, QueryResult } from '@/types'

export type TabActionMode = 'query' | 'table'

export interface TabActionDialogProps {
  open: boolean
  mode: TabActionMode
  onOpenChange: (open: boolean) => void
}

export interface QueryTabContentProps {
  tabId: string
}

export interface TableTabContentProps {
  tabId: string
}

export interface UnsavedChangesDialogProps {
  open: boolean
  changesCount: number
  onDiscard: () => void
  onCancel: () => void
}

export interface TableFooterProps {
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

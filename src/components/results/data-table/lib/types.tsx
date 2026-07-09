import type { Cell, Header, Table } from '@tanstack/react-table'

export type RowData = Record<string, unknown>

export interface EditableCellProps {
  cell: Cell<Record<string, unknown>, unknown>
  isModified: boolean
  isPrimaryKey: boolean
  isNewRow?: boolean
  onValueChange: (newValue: unknown) => void
}

export interface DataTableHeaderProps {
  header: Header<RowData, unknown>
}

export interface DataTableCellProps {
  cell: Cell<RowData, unknown>
}

export interface DataTableToolbarProps {
  table: Table<RowData>
}

export interface RowActionsProps {
  isNewRow: boolean
  isMarkedForDeletion: boolean
  onDelete: () => void
  onUndoDelete: () => void
  onRemoveNewRow: () => void
}

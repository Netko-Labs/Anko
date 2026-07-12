import type { ColumnDetail } from '@anko/desktop-domain'

export interface RowDetailsProps {
  row: Record<string, unknown>
  columns: ColumnDetail[]
}

export interface FieldRowProps {
  column: ColumnDetail
  value: unknown
  onCopy: () => void
}

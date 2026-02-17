import type { ColumnDetail } from '@/types'

export interface RowDetailsProps {
  row: Record<string, unknown>
  columns: ColumnDetail[]
}

export interface FieldRowProps {
  column: ColumnDetail
  value: unknown
  onCopy: () => void
}

import type { ColumnDetail } from '@/types'

export interface TableDetailsProps {
  tableName: string
  columns: ColumnDetail[]
  database: string
  schema?: string
}

export interface ColumnRowProps {
  column: ColumnDetail
}

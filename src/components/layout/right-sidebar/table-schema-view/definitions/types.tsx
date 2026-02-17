import type { ColumnDetail } from '@/types'

export interface TableSchemaViewProps {
  tableName: string
  columns: ColumnDetail[]
  database: string
  schema?: string
}

export interface ColumnRowProps {
  column: ColumnDetail
}

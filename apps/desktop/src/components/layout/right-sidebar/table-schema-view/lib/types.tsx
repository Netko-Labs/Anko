import type { ColumnDetail } from '@anko/desktop-domain'

export interface TableSchemaViewProps {
  tableName: string
  columns: ColumnDetail[]
  database: string
  schema?: string
}

export interface ColumnRowProps {
  column: ColumnDetail
}

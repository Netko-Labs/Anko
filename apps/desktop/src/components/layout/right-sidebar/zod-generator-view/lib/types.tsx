import type { ColumnDetail } from '@anko/desktop-domain'

export interface ZodGeneratorViewProps {
  tableName: string
  columns: ColumnDetail[]
}

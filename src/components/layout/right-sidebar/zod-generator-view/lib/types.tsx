import type { ColumnDetail } from '@/types'

export interface ZodGeneratorViewProps {
  tableName: string
  columns: ColumnDetail[]
}

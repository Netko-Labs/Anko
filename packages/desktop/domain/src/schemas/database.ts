export type DatabaseDriver = 'mysql' | 'postgresql' | 'sqlite'

export interface SchemaInfo {
  name: string
}

export interface TableInfo {
  name: string
  schema: string
  table_type: string
  row_count?: number
}

export interface ColumnDetail {
  name: string
  data_type: string
  nullable: boolean
  key?: string
  default_value?: string
  extra?: string
}

export interface ColumnInfo {
  name: string
  data_type: string
  nullable: boolean
}

export interface QueryResult {
  columns: ColumnInfo[]
  rows: unknown[][]
  affected_rows: number
  execution_time_ms: number
  /** Debug: original query sent from frontend */
  original_query?: string
  /** Debug: actual query executed (after adding context like USE db) */
  executed_query?: string
}
